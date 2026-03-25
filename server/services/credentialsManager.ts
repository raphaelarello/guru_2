// Sistema de Gerenciamento de Credenciais Reais
// Suporta Betfair, Pinnacle e outras exchanges

import crypto from 'crypto';

export interface CredentialsConfig {
  betfair?: {
    username: string;
    password: string;
    apiKey: string;
    appId?: string;
  };
  pinnacle?: {
    apiKey: string;
    username?: string;
  };
  firebase?: {
    projectId: string;
    apiKey: string;
    authDomain: string;
    databaseUrl?: string;
  };
  football?: {
    apiKey: string;
    baseUrl: string;
  };
}

class CredentialsManager {
  private credentials: CredentialsConfig = {};
  private encryptionKey: string;
  private isProduction: boolean;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'dev-key-change-in-production';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.loadCredentials();
  }

  // Carregar credenciais do ambiente
  private loadCredentials() {
    // Betfair
    if (process.env.BETFAIR_USERNAME && process.env.BETFAIR_PASSWORD) {
      this.credentials.betfair = {
        username: process.env.BETFAIR_USERNAME,
        password: process.env.BETFAIR_PASSWORD,
        apiKey: process.env.BETFAIR_API_KEY || '',
        appId: process.env.BETFAIR_APP_ID,
      };
      console.log('[CredentialsManager] Betfair credentials loaded');
    }

    // Pinnacle
    if (process.env.PINNACLE_API_KEY) {
      this.credentials.pinnacle = {
        apiKey: process.env.PINNACLE_API_KEY,
        username: process.env.PINNACLE_USERNAME,
      };
      console.log('[CredentialsManager] Pinnacle credentials loaded');
    }

    // Firebase
    if (process.env.FIREBASE_PROJECT_ID) {
      this.credentials.firebase = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        databaseUrl: process.env.FIREBASE_DATABASE_URL,
      };
      console.log('[CredentialsManager] Firebase credentials loaded');
    }

    // Football API
    if (process.env.API_FOOTBALL_KEY) {
      this.credentials.football = {
        apiKey: process.env.API_FOOTBALL_KEY,
        baseUrl: process.env.API_FOOTBALL_URL || 'https://v3.football.api-sports.io',
      };
      console.log('[CredentialsManager] Football API credentials loaded');
    }
  }

  // Obter credenciais de uma exchange
  getExchangeCredentials(exchange: 'betfair' | 'pinnacle') {
    if (!this.credentials[exchange]) {
      throw new Error(`${exchange} credentials not configured`);
    }

    if (!this.isProduction) {
      console.log(`[CredentialsManager] Using ${exchange} credentials in development mode`);
    }

    return this.credentials[exchange];
  }

  // Obter credenciais do Firebase
  getFirebaseCredentials() {
    if (!this.credentials.firebase) {
      throw new Error('Firebase credentials not configured');
    }
    return this.credentials.firebase;
  }

  // Obter credenciais da Football API
  getFootballApiCredentials() {
    if (!this.credentials.football) {
      throw new Error('Football API credentials not configured');
    }
    return this.credentials.football;
  }

  // Validar credenciais
  validateCredentials(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar Betfair
    if (this.credentials.betfair) {
      if (!this.credentials.betfair.username) errors.push('Betfair username missing');
      if (!this.credentials.betfair.password) errors.push('Betfair password missing');
      if (!this.credentials.betfair.apiKey) errors.push('Betfair API key missing');
    } else {
      warnings.push('Betfair not configured - using simulated data');
    }

    // Validar Pinnacle
    if (this.credentials.pinnacle) {
      if (!this.credentials.pinnacle.apiKey) errors.push('Pinnacle API key missing');
    } else {
      warnings.push('Pinnacle not configured - using simulated data');
    }

    // Validar Firebase
    if (this.credentials.firebase) {
      if (!this.credentials.firebase.projectId) errors.push('Firebase project ID missing');
      if (!this.credentials.firebase.apiKey) errors.push('Firebase API key missing');
    } else {
      warnings.push('Firebase not configured - push notifications disabled');
    }

    // Validar Football API
    if (this.credentials.football) {
      if (!this.credentials.football.apiKey) errors.push('Football API key missing');
    } else {
      warnings.push('Football API not configured - using cache only');
    }

    // Avisos de segurança
    if (!this.isProduction) {
      warnings.push('Running in development mode - use production credentials for live trading');
    }

    if (this.encryptionKey === 'dev-key-change-in-production') {
      warnings.push('Using default encryption key - change ENCRYPTION_KEY in production');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Encriptar valor sensível
  encrypt(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey.padEnd(32, '0').slice(0, 32)),
      iv
    );

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  // Decriptar valor sensível
  decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey.padEnd(32, '0').slice(0, 32)),
      iv
    );

    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Obter status das credenciais
  getStatus() {
    return {
      betfair: !!this.credentials.betfair,
      pinnacle: !!this.credentials.pinnacle,
      firebase: !!this.credentials.firebase,
      football: !!this.credentials.football,
      production: this.isProduction,
      validation: this.validateCredentials(),
    };
  }

  // Atualizar credenciais em tempo de execução
  updateCredentials(exchange: string, creds: any) {
    if (this.isProduction) {
      throw new Error('Cannot update credentials in production mode');
    }

    this.credentials[exchange as keyof CredentialsConfig] = creds;
    console.log(`[CredentialsManager] ${exchange} credentials updated`);
  }
}

// Instância singleton
let managerInstance: CredentialsManager | null = null;

export function initCredentialsManager(): CredentialsManager {
  if (!managerInstance) {
    managerInstance = new CredentialsManager();
  }
  return managerInstance;
}

export function getCredentialsManager(): CredentialsManager {
  if (!managerInstance) {
    managerInstance = new CredentialsManager();
  }
  return managerInstance;
}
