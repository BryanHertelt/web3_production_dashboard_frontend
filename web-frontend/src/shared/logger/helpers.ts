/**
 * Sanitize sensitive data from log payload
 * Recursively redacts fields containing sensitive keywords (password, token, secret, etc.)
 * @param obj - Object to sanitize
 * @param visited - WeakSet to track visited objects and prevent circular reference loops
 * @returns Sanitized object with sensitive fields replaced with '[REDACTED]'
 */
export function sanitizePayload<T>(obj: T, visited = new WeakSet<object>()): T {
  if (!obj || typeof obj !== "object") return obj;

  // Prevent circular reference infinite loop
  if (visited.has(obj as object)) return "[Circular]" as T;
  visited.add(obj as object);

  const sensitive = [
    "password",
    "authorization",
    "apiKey",
    "api_key",
    "apikey",
    "token",
    "secret",
    "cookie",
    "set-cookie",
    "auth",
    "credential",
    "mail",
    "wallet",
    "address",
  ];

  // Handle arrays separately to preserve array type
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === "object" && item !== null) {
        return sanitizePayload(item, visited);
      }
      return item;
    }) as T;
  }

  const sanitized = { ...obj } as Record<string, unknown>;

  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizePayload(sanitized[key], visited);
    } else if (sensitive.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    }
  });

  return sanitized as T;
}
