export function buildHotmartCheckoutUrl(opts: {
  base: string; // HOTMART_CHECKOUT_BASE
  email?: string;
  referenceId: string;
  amount: number; // en la moneda normal (ej: 150.5)
  currency?: string; // USD, COP, etc
  description?: string;
  redirect?: string;
}) {
  const { base, email, referenceId, amount, currency = "USD", description, redirect } = opts;
  const params = new URLSearchParams();

  if (email) params.set("email", email);
  // external_reference es tu referencia interna
  params.set("external_reference", referenceId);
  // Hotmart puede aceptar price/currency si el checkout lo permite
  params.set("price", String(amount));
  params.set("currency", currency);
  if (description) params.set("desc", description);
  if (redirect) params.set("redirect", redirect);

  return `${base}?${params.toString()}`;
}
