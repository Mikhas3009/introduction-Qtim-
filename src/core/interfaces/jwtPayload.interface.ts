/**Данные, для кодировки в jwt токен */
export interface IJwtPayload {
  id: string;
  login: string;
  name?: string;
}
/** интерфейс токенов авторизации */
export interface ITokensInterface {
  accessToken: string;
  refreshToken: string;
}
