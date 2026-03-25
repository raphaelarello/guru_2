
/**
 * Serviço de Autenticação SuperAdmin
 * Segurança server-side com sessão, auditoria e 2FA bootstrap.
 */

import * as crypto from "crypto";

export const SUPERADMIN_COOKIE_NAME = "rg_superadmin_session";

export type SuperAdminSession = {
  id: string;
  superAdminId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  twoFactorVerified: boolean;
  twoFactorSecret?: string;
};

export type AuditLog = {
  id: string;
  superAdminId: string;
  acao: string;
  descricao: string;
  tabela_afetada: string;
  dados_anteriores?: Record<string, unknown>;
  dados_novos?: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  timestamp: number;
  status: "sucesso" | "falha";
  motivo_falha?: string;
};

class SuperAdminAuth {
  private sessions: Map<string, SuperAdminSession> = new Map();
  private auditLogs: AuditLog[] = [];
  private superAdminPasswordHash: string;
  private readonly maxSessions = 3;
  private readonly sessionTimeout = 30 * 60 * 1000;
  private readonly inactivityTimeout = 15 * 60 * 1000;
  private readonly bootstrap2FACode = process.env.SUPER_ADMIN_2FA_CODE || "246810";

  constructor() {
    this.superAdminPasswordHash = this.hashPassword(
      process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2024!Rapha"
    );
    console.log("[SuperAdminAuth] ✅ Serviço inicializado");
  }

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, "sha512")
      .toString("hex");
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, hash: string): boolean {
    const [salt, storedHash] = hash.split(":");
    if (!salt || !storedHash) return false;
    const computedHash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, "sha512")
      .toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "utf8"),
      Buffer.from(storedHash, "utf8"),
    );
  }

  private generateTOTP(secret: string): string {
    const time = Math.floor(Date.now() / 1000 / 30);
    const secretBuffer = Buffer.from(secret, "hex");
    const hmac = crypto.createHmac("sha1", secretBuffer);
    hmac.update(Buffer.from(time.toString().padStart(16, "0"), "hex"));
    const digest = hmac.digest("hex");
    const offset = parseInt(digest.slice(-1), 16);
    const code =
      (parseInt(digest.slice(offset * 2, offset * 2 + 8), 16) & 0x7fffffff) %
      1000000;
    return code.toString().padStart(6, "0");
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      if (now > session.expiresAt || now - session.lastActivity > this.inactivityTimeout) {
        this.sessions.delete(sessionId);
      }
    }
    if (this.sessions.size > this.maxSessions) {
      const toDelete = Array.from(this.sessions.entries())
        .sort((a, b) => a[1].lastActivity - b[1].lastActivity)
        .slice(0, this.sessions.size - this.maxSessions)
        .map(([id]) => id);
      for (const id of toDelete) this.sessions.delete(id);
    }
  }

  autenticar(
    senha: string,
    ipAddress: string,
    userAgent: string,
  ): {
    sucesso: boolean;
    sessionId?: string;
    requiresTwoFactor?: boolean;
    mensagem: string;
    bootstrapHint?: string;
  } {
    this.cleanup();

    if (!this.verifyPassword(senha, this.superAdminPasswordHash)) {
      this.registrarAuditLog(
        "superadmin-login-falha",
        "Tentativa de login com senha incorreta",
        "sessions",
        ipAddress,
        userAgent,
        "falha",
        "Senha incorreta",
      );
      return { sucesso: false, mensagem: "Senha incorreta" };
    }

    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString("hex");
    const twoFactorSecret = crypto.randomBytes(20).toString("hex").toUpperCase();

    this.sessions.set(sessionId, {
      id: sessionId,
      superAdminId: "superadmin-001",
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      lastActivity: Date.now(),
      ipAddress,
      userAgent,
      twoFactorVerified: false,
      twoFactorSecret,
    });

    this.registrarAuditLog(
      "superadmin-login",
      "Login SuperAdmin iniciado - aguardando 2FA",
      "sessions",
      ipAddress,
      userAgent,
      "sucesso",
    );

    return {
      sucesso: true,
      sessionId,
      requiresTwoFactor: true,
      mensagem: "Código 2FA solicitado",
      bootstrapHint:
        process.env.NODE_ENV !== "production"
          ? this.bootstrap2FACode
          : undefined,
    };
  }

  verificarDoisFatores(
    sessionId: string,
    codigo: string,
  ): {
    sucesso: boolean;
    mensagem: string;
    token?: string;
  } {
    this.cleanup();
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { sucesso: false, mensagem: "Sessão inválida" };
    }

    const codigoEsperado = session.twoFactorSecret
      ? this.generateTOTP(session.twoFactorSecret)
      : undefined;
    const normalizedCode = codigo.trim();

    if (
      normalizedCode !== this.bootstrap2FACode &&
      normalizedCode !== codigoEsperado
    ) {
      this.registrarAuditLog(
        "superadmin-2fa-falha",
        "Código 2FA inválido",
        "sessions",
        session.ipAddress,
        session.userAgent,
        "falha",
        "Código incorreto",
      );
      return { sucesso: false, mensagem: "Código 2FA inválido" };
    }

    session.twoFactorVerified = true;
    session.lastActivity = Date.now();

    this.registrarAuditLog(
      "superadmin-2fa-sucesso",
      "Login SuperAdmin confirmado via 2FA",
      "sessions",
      session.ipAddress,
      session.userAgent,
      "sucesso",
    );

    return {
      sucesso: true,
      mensagem: "Autenticação concluída",
      token: session.token,
    };
  }

  validarSessao(
    sessionId: string,
    token: string,
  ): { valida: boolean; mensagem: string; session?: SuperAdminSession } {
    this.cleanup();
    const session = this.sessions.get(sessionId);
    if (!session) return { valida: false, mensagem: "Sessão não encontrada" };
    if (session.token !== token) return { valida: false, mensagem: "Token inválido" };
    if (!session.twoFactorVerified) return { valida: false, mensagem: "2FA pendente" };
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return { valida: false, mensagem: "Sessão expirada" };
    }
    if (Date.now() - session.lastActivity > this.inactivityTimeout) {
      this.sessions.delete(sessionId);
      return { valida: false, mensagem: "Sessão inativa" };
    }

    session.lastActivity = Date.now();
    return { valida: true, mensagem: "Sessão válida", session };
  }

  getSessionCookieValue(sessionId: string, token: string): string {
    return Buffer.from(`${sessionId}:${token}`, "utf8").toString("base64url");
  }

  parseSessionCookieValue(value?: string | null): { sessionId: string; token: string } | null {
    if (!value) return null;
    try {
      const decoded = Buffer.from(value, "base64url").toString("utf8");
      const [sessionId, token] = decoded.split(":");
      if (!sessionId || !token) return null;
      return { sessionId, token };
    } catch {
      return null;
    }
  }

  logout(sessionId: string): { sucesso: boolean; mensagem: string } {
    const session = this.sessions.get(sessionId);
    if (!session) return { sucesso: false, mensagem: "Sessão não encontrada" };

    this.registrarAuditLog(
      "superadmin-logout",
      "Logout SuperAdmin",
      "sessions",
      session.ipAddress,
      session.userAgent,
      "sucesso",
    );
    this.sessions.delete(sessionId);
    return { sucesso: true, mensagem: "Logout realizado" };
  }

  registrarAuditLog(
    acao: string,
    descricao: string,
    tabelaAfetada: string,
    ipAddress: string,
    userAgent: string,
    status: "sucesso" | "falha" = "sucesso",
    motivoFalha?: string,
  ): void {
    this.auditLogs.push({
      id: crypto.randomUUID(),
      superAdminId: "superadmin-001",
      acao,
      descricao,
      tabela_afetada: tabelaAfetada,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: Date.now(),
      status,
      motivo_falha: motivoFalha,
    });
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  obterAuditLogs(filtros?: {
    acao?: string;
    status?: "sucesso" | "falha";
    limite?: number;
  }): AuditLog[] {
    let logs = [...this.auditLogs];
    if (filtros?.acao) logs = logs.filter((log) => log.acao.includes(filtros.acao!));
    if (filtros?.status) logs = logs.filter((log) => log.status === filtros.status);
    return logs.slice(-(filtros?.limite ?? 100)).reverse();
  }

  obterEstatisticas() {
    const tentativasFalhadas = this.auditLogs.filter(
      (log) => log.acao === "superadmin-login-falha" || log.acao === "superadmin-2fa-falha",
    ).length;

    return {
      sessoes_ativas: this.sessions.size,
      tentativas_login_falhadas: tentativasFalhadas,
      logs_auditoria: this.auditLogs.length,
      ultimas_acoes: this.auditLogs.slice(-10).reverse(),
    };
  }

  alterarSenha(senhaAtual: string, novaSenha: string) {
    if (!this.verifyPassword(senhaAtual, this.superAdminPasswordHash)) {
      return { sucesso: false, mensagem: "Senha atual incorreta" };
    }
    if (novaSenha.length < 12) {
      return { sucesso: false, mensagem: "Nova senha deve ter pelo menos 12 caracteres" };
    }
    this.superAdminPasswordHash = this.hashPassword(novaSenha);
    return { sucesso: true, mensagem: "Senha alterada com sucesso" };
  }
}

export const superAdminAuth = new SuperAdminAuth();
