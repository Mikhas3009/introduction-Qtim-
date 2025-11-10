import { ExecutionContext } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

export function setCacheHeader(
  context: ExecutionContext,
  httpAdapterHost: HttpAdapterHost | undefined,
  cached: any,
): void {
  const httpAdapter = httpAdapterHost?.httpAdapter;
  if (!httpAdapter) return;
  const response = context.switchToHttp().getResponse();
  httpAdapter.setHeader(
    response,
    'X-Cache',
    cached !== undefined ? 'HIT' : 'MISS',
  );
}
