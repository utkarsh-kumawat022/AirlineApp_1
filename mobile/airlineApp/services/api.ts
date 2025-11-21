import { BACKEND_HOST } from "../app/config";

export async function searchFlights({
  origin,
  destination,
  departDate,
  returnDate,
  nonStop,
}: any) {
  const res = await fetch(`${BACKEND_HOST}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin,
      destination,
      departDate,
      returnDate,
      nonStop,
    }),
  });

  if (!res.ok) {
    throw new Error("Search failed");
  }

  const json = await res.json();
  return json;

  console.log("📦 Received from backend:", json); // DEBUG

  return json.data;  // 🔥 FIX: return CLEAN ARRAY of offers WITH INR
}
