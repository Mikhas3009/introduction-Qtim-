/**
 * Абстракция бэкенда кэша.
 *
 */
export interface CacheStore {
  /**
   * Прочитать значение по ключу.
   * @typeParam T Тип десериализованного значения.
   * @param key Ключ кэша.
   * @returns Десериализованное значение или `undefined`, если ключ отсутствует.
   */

  get<T = any>(key: string): Promise<T | undefined>;
  /**
   * Записать значение по ключу.
   * @typeParam T Тип сериализуемого значения.
   * @param key Ключ кэша.
   * @param value Любое сериализуемое значение.
   * @param ttl Необязательный TTL (мс). Если не задан — используется дефолт стора.
   * @returns Успех операции.
   */
  set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> | boolean;

  /**
   * Удалить ключ.
   * @param key Ключ кэша.
   * @returns Был ли ключ удалён.
   */
  del(key: string): Promise<boolean>;

  /**
   * Удалить несколько ключей по паттерну (store-specific).
   * Например, Redis — через SCAN MATCH + DEL.
   * @param pattern Глоб-паттерн ключа.
   * @returns Количество удалённых ключей.
   */
  delByPattern(pattern: string): Promise<number>;
}
