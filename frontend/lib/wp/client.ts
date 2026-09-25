const WP_INTERNAL_URL = process.env.WP_INTERNAL_URL ?? "http://wordpress";

export const WP_PUBLIC_URL = process.env.NEXT_PUBLIC_WP_URL ?? "http://localhost:8080";

type QueryOptions = {
  variables?: Record<string, unknown>;
  tags?: string[];
  revalidate?: number;
};

/**
 * Запрос к WPGraphQL по внутреннему адресу контейнера.
 * Возвращает null, если WordPress недоступен: витрина должна открываться и без CMS.
 */
export async function wpQuery<T>(query: string, options: QueryOptions = {}): Promise<T | null> {
  const { variables = {}, tags = [], revalidate = 300 } = options;

  try {
    const response = await fetch(`${WP_INTERNAL_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { tags: ["wp", ...tags], revalidate },
    });

    if (!response.ok) {
      console.warn(`[wp] ответ ${response.status} на GraphQL-запрос`);
      return null;
    }

    const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

    if (payload.errors?.length) {
      console.warn("[wp] ошибки GraphQL:", payload.errors.map((error) => error.message).join("; "));
      return null;
    }

    return payload.data ?? null;
  } catch (error) {
    console.warn("[wp] WordPress недоступен:", error instanceof Error ? error.message : error);
    return null;
  }
}
