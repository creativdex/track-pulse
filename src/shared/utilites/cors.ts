import { INestApplication } from '@nestjs/common';

interface ICorsConfig {
  origin?: string[];
}

export function enableCors(app: INestApplication, config?: ICorsConfig): void {
  app.enableCors({
    origin: config?.origin ?? '*',
    allowedHeaders: '*',
    methods: '*',
  });
}

export function extratCors(hosts: string): string[] {
  return hosts.split(',').map((host) => {
    const url = new URL(host);
    return url.origin;
  });
}

export function enableCorsFromHosts(app: INestApplication, hosts: string): void {
  const corsHosts = extratCors(hosts);
  enableCors(app, { origin: corsHosts });
}
