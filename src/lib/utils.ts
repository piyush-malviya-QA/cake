export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmt = (n: number | string) =>
  "₹" + Number(n || 0).toFixed(2);

export const now = () => new Date().toISOString();

export const today = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// DB ↔ Frontend naming conversion
export function snakeToCamel<T>(
  obj: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result as T;
}

export function camelToSnake(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(
      /[A-Z]/g,
      (c) => "_" + c.toLowerCase()
    );
    result[snakeKey] = obj[key];
  }
  return result;
}
