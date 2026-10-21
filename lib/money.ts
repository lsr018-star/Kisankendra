// Money is handled in integer paise everywhere. 100 paise = 1 rupee.
export function inr(paise: number): string {
  const rupees = paise / 100;
  return (
    "₹" +
    rupees.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function pctOf(amountPaise: number, pct: number): number {
  return Math.round((amountPaise * pct) / 100);
}
