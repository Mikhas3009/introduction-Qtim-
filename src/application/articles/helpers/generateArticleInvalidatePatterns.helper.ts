export function generateArticleInvalidatePatterns(options: {
    id?: string | number;
}) {
    const { id } = options;
    const patterns: string[] = [];

    patterns.push(`/articles`);
    patterns.push(`/articles?*`);

    // Конкретная статья
    if (id != null) {
        const base = `/articles/${id}`;
        patterns.push(base);
        patterns.push(`${base}?*`);
        patterns.push(`${base}/*`);
        patterns.push(`${base}/*?*`);
    }

    return patterns;
}
