/**
 * Генерирует набор паттернов ключей кэша для инвалидации страниц статей.
 *
 * Паттерны рассчитаны на стратегию, где ключами кэша выступают **URL-пути** запросов:
 * - список статей: `/articles`, `/articles?*`
 * - конкретная статья: `/articles/:id`, включая варианты с query-строкой и под-ресурсами.
 *
 * @param {Object} options
 * @param {string|number} [options.id] Идентификатор статьи. Если указан — добавляются паттерны для конкретной статьи.
 *
 * @returns {string[]} Массив паттернов ключей.
 */
export function generateArticleInvalidatePatterns(options: {
  id?: string | number;
}) {
  const { id } = options;
  const patterns: string[] = [];

  patterns.push('/articles');
  patterns.push('/articles*');
  patterns.push('/articles\\?*');

  if (id != null) {
    const base = `/articles/${id}`;
    patterns.push(base);
    patterns.push(`${base}*`);
    patterns.push(`${base}\\?*`);
  }

  return patterns;
}
