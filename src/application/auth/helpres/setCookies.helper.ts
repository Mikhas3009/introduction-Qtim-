import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { toMs } from 'ms-typescript';
import { ITokensInterface } from 'src/core/interfaces/jwtPayload.interface';

export const setTokenCookie = async (
  res: Response,
  tokens: ITokensInterface,
  configService: ConfigService,
): Promise<Response> => {
  return res
    .cookie('refreshToken', tokens.refreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'none',
      expires: new Date(
        Date.now() +
          toMs(configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN')),
      ),
    })
    .cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'none',
      path: '/',
      expires: new Date(
        Date.now() + toMs(configService.getOrThrow<string>('JWT_EXPIRES_IN')),
      ),
    })
    .status(HttpStatus.OK)
    .send({ success: true });
};
