export type UrlValidationResult =
  | { valid: true; url: string }
  | { valid: false; reason: string };

/**
 * Valida e normaliza um link de anúncio imobiliário.
 * - remove espaços
 * - prefixa https:// se faltar protocolo
 * - aceita apenas http/https
 * - exige hostname com pelo menos um ponto (ex.: vivareal.com.br)
 */
export function validateListingUrl(input: string): UrlValidationResult {
  const trimmed = (input || "").trim();
  if (!trimmed) {
    return { valid: false, reason: "Cole um link de anúncio" };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return { valid: false, reason: "Link inválido" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: "O link precisa começar com http:// ou https://" };
  }

  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    return { valid: false, reason: "Domínio do link inválido" };
  }

  return { valid: true, url: parsed.toString() };
}
