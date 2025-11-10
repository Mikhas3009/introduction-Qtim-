import { minimatch } from 'minimatch';

/** Проверка совпадения ключа с glob-шаблоном */
export function matchPattern(key: string, pattern: string): boolean {
  return minimatch(key, pattern, { dot: true, matchBase: true });
}
