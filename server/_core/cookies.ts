import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  // Check if the request is over HTTPS
  if (req.protocol === "https") return true;

  // Check the x-forwarded-proto header (set by reverse proxies like Nginx, Manus)
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (forwardedProto) {
    const protoList = Array.isArray(forwardedProto)
      ? forwardedProto
      : forwardedProto.split(",");
    if (protoList.some(proto => proto.trim().toLowerCase() === "https")) {
      return true;
    }
  }

  // In production (NODE_ENV !== 'development'), assume HTTPS for security
  // This is important for cookie security in cloud deployments
  if (process.env.NODE_ENV !== "development") {
    return true;
  }

  return false;
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const isDevelopment = process.env.NODE_ENV === "development";
  const secure = isSecureRequest(req);

  // Determinar se deve definir domain
  const shouldSetDomain =
    hostname &&
    !LOCAL_HOSTS.has(hostname) &&
    !isIpAddress(hostname) &&
    hostname !== "127.0.0.1" &&
    hostname !== "::1";

  // Definir domain para cookies (com ponto para subdomínios)
  let domain: string | undefined;
  if (shouldSetDomain) {
    // Para domínios como "example.com", usar ".example.com" para compartilhar com subdomínios
    // Para domínios como "api.example.com", usar "example.com" para compatibilidade
    if (hostname.includes(".")) {
      const parts = hostname.split(".");
      if (parts.length === 2) {
        // "example.com" -> ".example.com"
        domain = `.${hostname}`;
      } else if (parts.length > 2) {
        // "api.example.com" -> "example.com"
        domain = parts.slice(-2).join(".");
      }
    } else {
      domain = hostname;
    }
  }

  // Log para debugging em produção
  if (!isDevelopment) {
    console.log(
      `[Cookies] Configuração: hostname=${hostname}, domain=${domain}, secure=${secure}, sameSite=lax`
    );
  }

  return {
    domain,
    httpOnly: true,
    path: "/",
    // Em desenvolvimento: sameSite=none para testes cross-site
    // Em produção: sameSite=lax para compatibilidade com navegadores
    sameSite: isDevelopment ? "none" : "lax",
    // Sempre usar secure=true em produção
    secure: isDevelopment ? secure : true,
  };
}
