/*
  Patch focado: superadmin com senha provisória via ENV
  - login bootstrap
  - troca obrigatória de senha no primeiro acesso
  - sessão em memória com cookie
  Observação:
  - próxima fase ideal: persistir hash em banco + TOTP real
*/

import crypto from "node:crypto";

export type SuperAdminSession = {
  id: string;
  username: string;
  createdAt: number;
  expiresAt: number;
  requiresPasswordChange: boolean;
};

type LoginInput = {
  username: string;
  password: string;
  code?: string;
};

type PasswordChangeInput = {
  sessionId: string;
  currentPassword: string;
  newPassword: string;
};

const COOKIE_NAME = process.env.SUPERADMIN_COOKIE_NAME || "rg_superadmin";
const SESSION_TTL_MINUTES = Number(process.env.SUPERADMIN_SESSION_TTL_MINUTES || "480");
const REQUIRE_PASSWORD_CHANGE = String(process.env.SUPERADMIN_REQUIRE_PASSWORD_CHANGE || "true") === "true";

const BOOTSTRAP_USER = process.env.SUPERADMIN_BOOTSTRAP_USER || "superadmin";
const BOOTSTRAP_PASSWORD = process.env.SUPERADMIN_BOOTSTRAP_PASSWORD || "TroqueAgora!2026";
const BOOTSTRAP_CODE = process.env.SUPERADMIN_BOOTSTRAP_CODE || "246810";

class SuperAdminAuthService {
  private sessions = new Map<string, SuperAdminSession>();
  private activePassword = BOOTSTRAP_PASSWORD;
  private bootstrapMode = true;

  private createSession(username: string, requiresPasswordChange: boolean): SuperAdminSession {
    const now = Date.now();
    const ttlMs = SESSION_TTL_MINUTES * 60 * 1000;
    const session: SuperAdminSession = {
      id: crypto.randomUUID(),
      username,
      createdAt: now,
      expiresAt: now + ttlMs,
      requiresPasswordChange,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  private isStrongPassword(password: string): boolean {
    return (
      password.length >= 10 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  public login(input: LoginInput) {
    const usernameOk = input.username === BOOTSTRAP_USER;
    const passwordOk = input.password === this.activePassword;
    const codeOk = (input.code || "") === BOOTSTRAP_CODE;

    if (!usernameOk || !passwordOk || !codeOk) {
      return {
        success: false,
        message: "Usuário, senha provisória ou código inválidos.",
      };
    }

    const session = this.createSession(
      input.username,
      this.bootstrapMode && REQUIRE_PASSWORD_CHANGE
    );

    return {
      success: true,
      session,
      cookieName: COOKIE_NAME,
      requiresPasswordChange: session.requiresPasswordChange,
      message: session.requiresPasswordChange
        ? "Login realizado. Troca de senha obrigatória."
        : "Login realizado com sucesso.",
    };
  }

  public changePassword(input: PasswordChangeInput) {
    const session = this.sessions.get(input.sessionId);

    if (!session) {
      return { success: false, message: "Sessão não encontrada." };
    }

    if (session.expiresAt < Date.now()) {
      this.sessions.delete(session.id);
      return { success: false, message: "Sessão expirada." };
    }

    if (input.currentPassword !== this.activePassword) {
      return { success: false, message: "Senha atual inválida." };
    }

    if (!this.isStrongPassword(input.newPassword)) {
      return {
        success: false,
        message:
          "A nova senha precisa ter no mínimo 10 caracteres, letra maiúscula, minúscula, número e símbolo.",
      };
    }

    this.activePassword = input.newPassword;
    this.bootstrapMode = false;

    const updated: SuperAdminSession = {
      ...session,
      requiresPasswordChange: false,
    };

    this.sessions.set(session.id, updated);

    return {
      success: true,
      session: updated,
      message: "Senha alterada com sucesso.",
    };
  }

  public getSession(sessionId?: string | null) {
    if (!sessionId) return null;

    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.expiresAt < Date.now()) {
      this.sessions.delete(session.id);
      return null;
    }

    return session;
  }

  public logout(sessionId?: string | null) {
    if (sessionId) {
      this.sessions.delete(sessionId);
    }
    return { success: true };
  }

  public listActiveSessions(): SuperAdminSession[] {
    return Array.from(this.sessions.values()).filter((session) => {
      if (session.expiresAt < Date.now()) {
        this.sessions.delete(session.id);
        return false;
      }
      return true;
    });
  }
}

export const superAdminAuth = new SuperAdminAuthService();
export const SUPERADMIN_COOKIE_NAME = COOKIE_NAME;
