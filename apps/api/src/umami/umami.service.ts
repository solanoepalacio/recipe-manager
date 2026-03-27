import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class UmamiService {
  constructor(private readonly httpService: HttpService) {}

  trackEvent(eventName: string, data: Record<string, string | number | boolean>): void {
    const umamiUrl = process.env.UMAMI_URL;
    const websiteId = process.env.UMAMI_WEBSITE_ID;

    if (!umamiUrl || !websiteId) return;

    this.httpService
      .post(`${umamiUrl}/api/send`, {
        type: 'event',
        payload: {
          website: websiteId,
          name: eventName,
          data,
          url: '/shared/[token]',
          hostname: process.env.APP_HOSTNAME,
        },
      })
      .subscribe({ error: () => {} });
  }
}
