# Deployment Permanente - Guru 2 no Manus

## Resumo

Este documento descreve como fazer o deployment permanente do Guru 2 nos servidores Manus com um domínio fixo.

## Domínio Permanente

Após o deployment, você terá uma URL permanente como:
```
https://guru-2-football-tips.manus.computer
```

Características:
- Sempre online (sem timeout)
- Certificado SSL automático
- CDN global incluído
- Backups automáticos
- Monitoramento em tempo real

## Passo a Passo para Deploy

### 1. Fazer Push para o GitHub

```bash
cd /home/ubuntu/guru_2_project
git add .
git commit -m "v1.0.61 - Deploy permanente com superadmin e alertas"
git push origin master
```

### 2. Acessar o Painel Manus

1. Ir para https://manus.im
2. Fazer login
3. Clicar em "Novo Deployment"

### 3. Configurar o Deployment

Nome: guru-2-football-tips
Tipo: Node.js / Full Stack
Porta: 3000
Repositório: raphaelarello/guru_2
Branch: master

### 4. Build Command

```bash
npm install --legacy-peer-deps && npm run build
```

### 5. Start Command

```bash
node dist/index.js
```

### 6. Variáveis de Ambiente

NODE_ENV=production
JWT_SECRET=guru_secret_key_2026_test_manus_deployment
ADMIN_EMAIL=admin@raphaguru.com
ADMIN_PASSWORD=Admin@2024
SUPERADMIN_BOOTSTRAP_USER=superadmin
SUPERADMIN_BOOTSTRAP_PASSWORD=TroqueAgora!2026
SUPERADMIN_BOOTSTRAP_CODE=246810
SUPERADMIN_COOKIE_NAME=rg_superadmin
SUPERADMIN_SESSION_TTL_MINUTES=480
SUPERADMIN_REQUIRE_PASSWORD_CHANGE=true

## Credenciais de Teste

Admin:
- Email: admin@raphaguru.com
- Senha: Admin@2024

Superadmin:
- Usuário: superadmin
- Senha: TroqueAgora!2026

## Atualizações Futuras

Para atualizar:
1. Fazer alterações no código
2. Commit e push para GitHub
3. Manus detecta automaticamente
4. Faz rebuild e redeploy

## Monitoramento

No painel Manus você pode:
- Ver logs em tempo real
- Monitorar CPU e memória
- Configurar alertas
- Fazer rollback de versões
- Gerenciar backups

Status: Pronto para deployment permanente!
