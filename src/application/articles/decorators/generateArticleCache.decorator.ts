import { ExecutionContext, applyDecorators, SetMetadata, UseInterceptors } from "@nestjs/common";
import { CacheInvalidationInterceptor } from "src/core/cache/interceptors/cacheInvalidation.interceptor";
import { generateArticleInvalidatePatterns } from "../helpers/generateArticleInvalidatePatterns.helper";

export const  InvalidateArticleCache = () => {
  const input = (context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const { id } = request.params ?? {};
    console.log(id)
    return {
      patterns: generateArticleInvalidatePatterns({
        id,
      }),
    };
  };

  return applyDecorators(
    SetMetadata('cache_invalidate_key', input),
    UseInterceptors(CacheInvalidationInterceptor),
  );
};
