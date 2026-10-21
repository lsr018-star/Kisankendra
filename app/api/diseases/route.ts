import { loadStore } from "@/lib/db";
import { json } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
  const store = loadStore();
  let diseases = store.diseases;
  if (q) {
    diseases = diseases.filter(
      (d) =>
        d.crop.toLowerCase().includes(q) ||
        d.disease.toLowerCase().includes(q) ||
        d.symptoms.toLowerCase().includes(q)
    );
  }
  return json({ diseases });
}
