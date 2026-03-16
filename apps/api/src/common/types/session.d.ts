// @ts-ignore — express-session installed in Plan 02
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    adminId?: string;
  }
}
