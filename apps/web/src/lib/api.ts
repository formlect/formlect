// Every API response is the ServiceResponse envelope; unwrap `responseObject` and surface `message` on failure.
type Envelope<T> = { success: boolean; message: string; responseObject: T; statusCode: number };

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method: init.method,
    credentials: "include",
    headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !json?.success) throw new Error(json?.message ?? "Something went wrong. Try again.");
  return json.responseObject;
}
