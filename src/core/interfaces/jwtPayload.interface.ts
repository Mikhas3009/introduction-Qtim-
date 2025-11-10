export interface IJwtPayload {
  id: string;
  login: string;
  name?: string;
}

export interface ITokensInterface {
  accessToken: string;
  refreshToken: string;
}
