// src/lib/clientId.ts
const CLIENT_ID_KEY = "ag_demo_client_id";

export function getClientId(): string {
  if (typeof window === "undefined") return "demo-client"; // SSR guard if needed

  let id = window.localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id =
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `client-${Math.random().toString(16).slice(2)}`);
    window.localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}
