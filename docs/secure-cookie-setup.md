# Secure Cookie Setup (Staging)

## Deployment topology

```
browser
  │   HTTPS (cert: Cloudflare)
  ▼
Cloudflare edge
  │   Cloudflare tunnel (encrypted)
  ▼
cloudflared  (VM in local network)
  │   plain HTTP, LAN
  ▼
Caddy        (docker-compose, this repo)
  │   plain HTTP, docker network
  ▼
api / web    (docker-compose)
```

TLS is terminated at the Cloudflare edge. Every leg after that is plaintext, including the LAN hop from `cloudflared` to the docker host. Browsers only ever see HTTPS.

## Why session cookies need extra wiring

The api uses `express-session` with `cookie.secure = NODE_ENV === 'production'` (`apps/api/src/main.ts`). The container sets `NODE_ENV=production`, so the api wants to emit `Secure` cookies.

`express-session` only emits `Secure` cookies when `req.secure` is true. By default `req.secure` is only true when the request actually arrived over TLS *at the express server*. Behind a reverse proxy chain, the api receives plain HTTP — so without further configuration, `req.secure` is false and the cookie is silently dropped. Login then "succeeds" but no session is established.

The fix is two coordinated changes: tell express to trust `X-Forwarded-Proto`, and make sure the chain actually delivers `X-Forwarded-Proto: https` to the api.

## The two changes

### 1. Express trusts the proxy

`apps/api/src/main.ts`:

```ts
app.set('trust proxy', 1);
```

With this set, `req.secure` becomes true whenever the upstream proxy sends `X-Forwarded-Proto: https`. The session middleware then emits the cookie with the `Secure` flag.

The `1` means "trust one hop." That is correct here: Caddy is the single proxy directly in front of the api on the docker network. Even though there are more hops further out (cloudflared, Cloudflare edge), what matters for express is the *immediate* proxy, because that is the one whose forwarded headers express will read.

### 2. Caddy forwards `X-Forwarded-Proto: https`

`Caddyfile.staging` overrides the header on routes that go to the api:

```caddy
handle /api/* {
    reverse_proxy api:3001 {
        header_up X-Forwarded-Proto https
    }
}
```

Why this is needed: Caddy's default behavior is to set `X-Forwarded-Proto` based on the scheme it *received* the request on. Since cloudflared forwards to Caddy over plain HTTP, Caddy would otherwise stamp `X-Forwarded-Proto: http` and overwrite anything cloudflared sent.

Hardcoding `https` is safe in this deployment because the only ingress to Caddy is the cloudflared tunnel, which only carries traffic that originated as HTTPS at the Cloudflare edge. There is no path by which a real HTTP request can reach Caddy from a real client.

If the ingress topology changes (e.g. Caddy is exposed directly to a network where plain-HTTP clients exist), this hardcode becomes a lie and must be replaced with `trusted_proxies` configuration that *preserves* cloudflared's `X-Forwarded-Proto` instead.

## What `Secure=true` actually buys here

Browsers always see HTTPS for this app, so `Secure=true` and `Secure=false` produce identical wire behavior on the public internet *as long as* Cloudflare's "Always Use HTTPS" setting is on (CF dashboard → SSL/TLS → Edge Certificates).

`Secure=true` is still worth keeping as a defense-in-depth measure:

- If Cloudflare's HTTP→HTTPS redirect is ever disabled or misconfigured, `Secure=true` prevents the cookie from being sent in cleartext on the public internet.
- If a port on the docker host is ever exposed for debugging and a developer connects via plain HTTP, the cookie is not sent.
- It documents intent: "this cookie should never travel over plaintext."

The cost is the small amount of plumbing above. Worth it.

## Things that will silently break this

- **Removing `app.set('trust proxy', 1)`.** Sessions stop working in production with no error — login appears to succeed but the next request has no session. Symptom: user is redirected back to login immediately after submitting credentials.
- **Removing `header_up X-Forwarded-Proto https` in the Caddyfile.** Same symptom as above. The api sees `X-Forwarded-Proto: http`, treats the request as insecure, and drops the cookie.
- **Cloudflare "Always Use HTTPS" turned off** combined with a user typing `http://...`. The browser will load the page over HTTP, the api will set the cookie (because the chain still claims https via header_up), but the browser will refuse to *send* the Secure cookie back over the HTTP connection. Symptom: login appears to succeed, next request has no session. Indistinguishable in logs from the cases above.
- **Bypassing Caddy** (e.g. exposing `api` ports directly to the host for debugging and pointing a browser at it). The api will then receive no `X-Forwarded-Proto` header at all, treat the request as insecure, and drop the cookie.

## Verifying it works

After deploying, log in via the public URL and check that:

1. The browser stores a `connect.sid` cookie with the `Secure` and `HttpOnly` flags set (DevTools → Application → Cookies).
2. A subsequent authenticated api request (e.g. `GET /api/recipes`) returns 200, not 401.

If 1 succeeds but 2 fails, the cookie is being set but not sent — almost always a `SameSite` or domain-scope problem, not the `Secure` flag.

If 1 fails (no cookie stored at all), the api dropped the `Set-Cookie` because `req.secure` was false. Re-check both edits above.
