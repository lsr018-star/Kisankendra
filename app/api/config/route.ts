import { loadStore } from "@/lib/db";
import { json } from "@/lib/api-helpers";

// Public platform configuration the storefront needs for price summaries.
export async function GET() {
  const store = loadStore();
  return json({
    deliveryFeePaise: store.config.deliveryFeePaise,
    taxPct: store.config.taxPct,
    refundNote: store.config.refundNote,
  });
}
