export function jsonError(message: string, status: 400 | 401 | 404 | 429) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}
