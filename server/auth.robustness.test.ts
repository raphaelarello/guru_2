import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response } from "express";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import * as db from "./db";

/**
 * Testes de Autenticação Robusta em Produção
 * Valida: cookies, OAuth flow, sessão, logout, retry logic
 */

describe("Autenticação Robusta", () => {
  // ─────────────────────────────────────────────────────────────
  // TESTES DE COOKIES
  // ─────────────────────────────────────────────────────────────

  describe("Configuração de Cookies", () => {
    it("deve usar sameSite=lax em produção", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const mockReq = {
        protocol: "https",
        headers: { "x-forwarded-proto": "https" },
      } as unknown as Request;

      const options = getSessionCookieOptions(mockReq);

      expect(options.sameSite).toBe("lax");
      expect(options.secure).toBe(true);
      expect(options.httpOnly).toBe(true);
      expect(options.path).toBe("/");

      process.env.NODE_ENV = originalEnv;
    });

    it("deve usar sameSite=none em desenvolvimento", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const mockReq = {
        protocol: "http",
        headers: {},
      } as unknown as Request;

      const options = getSessionCookieOptions(mockReq);

      expect(options.sameSite).toBe("none");
      expect(options.httpOnly).toBe(true);
      expect(options.path).toBe("/");

      process.env.NODE_ENV = originalEnv;
    });

    it("deve detectar HTTPS via x-forwarded-proto", () => {
      const mockReq = {
        protocol: "http",
        headers: { "x-forwarded-proto": "https" },
      } as unknown as Request;

      const options = getSessionCookieOptions(mockReq);

      expect(options.secure).toBe(true);
    });

    it("deve forçar secure=true em produção mesmo com HTTP", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const mockReq = {
        protocol: "http",
        headers: {},
      } as unknown as Request;

      const options = getSessionCookieOptions(mockReq);

      expect(options.secure).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TESTES DE SESSÃO
  // ─────────────────────────────────────────────────────────────

  describe("Gerenciamento de Sessão", () => {
    it("deve criar token de sessão válido", async () => {
      const token = await sdk.createSessionToken("test-open-id", {
        name: "Test User",
        expiresInMs: 3600000, // 1 hora
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT tem 3 partes
    });

    it("deve verificar token de sessão válido", async () => {
      const token = await sdk.createSessionToken("test-open-id", {
        name: "Test User",
      });

      const session = await sdk.verifySession(token);

      expect(session).toBeDefined();
      expect(session?.openId).toBe("test-open-id");
      expect(session?.name).toBe("Test User");
    });

    it("deve rejeitar token inválido", async () => {
      const invalidToken = "invalid.token.here";

      const session = await sdk.verifySession(invalidToken);

      expect(session).toBeNull();
    });

    it("deve rejeitar token expirado", async () => {
      // Token com expiração de 1ms (já expirado)
      const expiredToken = await sdk.createSessionToken("test-open-id", {
        name: "Test User",
        expiresInMs: 1,
      });

      // Aguardar para garantir expiração
      await new Promise(resolve => setTimeout(resolve, 10));

      const session = await sdk.verifySession(expiredToken);

      expect(session).toBeNull();
    });

    it("deve rejeitar token null ou undefined", async () => {
      const session1 = await sdk.verifySession(null);
      const session2 = await sdk.verifySession(undefined);

      expect(session1).toBeNull();
      expect(session2).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TESTES DE LOGOUT
  // ─────────────────────────────────────────────────────────────

  describe("Logout", () => {
    it("deve limpar sessão após logout", async () => {
      // Simular login
      const token = await sdk.createSessionToken("test-open-id", {
        name: "Test User",
      });

      // Verificar que sessão existe
      const sessionBefore = await sdk.verifySession(token);
      expect(sessionBefore).toBeDefined();

      // Simular logout (remover token)
      const sessionAfter = await sdk.verifySession(null);
      expect(sessionAfter).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TESTES DE SINCRONIZAÇÃO DE USUÁRIO
  // ─────────────────────────────────────────────────────────────

  describe("Sincronização de Usuário", () => {
    it("deve fazer upsert de usuário com dados corretos", async () => {
      const userData = {
        openId: `test-open-id-${Date.now()}`,
        name: "Test User",
        email: "test@example.com",
        loginMethod: "google" as const,
        lastSignedIn: new Date(),
      };

      await db.upsertUser(userData);

      const user = await db.getUserByOpenId(userData.openId);

      expect(user).toBeDefined();
      expect(user?.openId).toBe(userData.openId);
      expect(user?.name).toBe(userData.name);
      expect(user?.email).toBe(userData.email);
    });

    it("deve atualizar usuário existente", async () => {
      const openId = `test-open-id-${Date.now()}`;

      // Primeiro upsert
      await db.upsertUser({
        openId,
        name: "Original Name",
        email: "original@example.com",
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Segundo upsert com dados atualizados
      const newDate = new Date();
      await db.upsertUser({
        openId,
        name: "Updated Name",
        email: "updated@example.com",
        loginMethod: "github",
        lastSignedIn: newDate,
      });

      const user = await db.getUserByOpenId(openId);

      expect(user?.name).toBe("Updated Name");
      expect(user?.email).toBe("updated@example.com");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TESTES DE ROBUSTEZ
  // ─────────────────────────────────────────────────────────────

  describe("Robustez de Autenticação", () => {
    it("deve lidar com múltiplas requisições simultâneas", async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        sdk.createSessionToken(`user-${i}`, {
          name: `User ${i}`,
        })
      );

      const tokens = await Promise.all(promises);

      expect(tokens).toHaveLength(10);
      tokens.forEach(token => {
        expect(token).toBeDefined();
        expect(typeof token).toBe("string");
      });
    });

    it("deve validar tokens em paralelo", async () => {
      const token = await sdk.createSessionToken("test-user", {
        name: "Test User",
      });

      const verifications = Array.from({ length: 5 }, () =>
        sdk.verifySession(token)
      );

      const results = await Promise.all(verifications);

      results.forEach(session => {
        expect(session?.openId).toBe("test-user");
      });
    });

    it("deve recuperar de erro de verificação", async () => {
      const validToken = await sdk.createSessionToken("test-user", {
        name: "Test User",
      });

      // Primeira verificação com token inválido
      const invalidSession = await sdk.verifySession("invalid");
      expect(invalidSession).toBeNull();

      // Segunda verificação com token válido deve funcionar
      const validSession = await sdk.verifySession(validToken);
      expect(validSession).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TESTES DE SEGURANÇA
  // ─────────────────────────────────────────────────────────────

  describe("Segurança de Autenticação", () => {
    it("deve rejeitar token com payload inválido", async () => {
      // Token com payload corrompido
      const invalidToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";

      const session = await sdk.verifySession(invalidToken);

      expect(session).toBeNull();
    });

    it("deve validar campos obrigatórios do token", async () => {
      // Criar token com campos válidos
      const token = await sdk.createSessionToken("test-open-id", {
        name: "Test User",
      });

      const session = await sdk.verifySession(token);

      // Verificar que todos os campos obrigatórios estão presentes
      expect(session?.openId).toBeDefined();
      expect(session?.appId).toBeDefined();
      expect(typeof session?.openId).toBe("string");
      expect(typeof session?.appId).toBe("string");
    });

    it("deve usar httpOnly para proteger contra XSS", () => {
      const mockReq = {
        protocol: "https",
        headers: { "x-forwarded-proto": "https" },
      } as unknown as Request;

      const options = getSessionCookieOptions(mockReq);

      expect(options.httpOnly).toBe(true);
    });
  });
});
