# Configuração de Domínio Permanente - Manus

## 🌐 Domínio Permanente Manus

Para criar um domínio permanente no Manus, você precisa:

1. **Acessar o painel Manus**: https://manus.im
2. **Ir para "Deployments"** ou **"Aplicações"**
3. **Criar novo deployment** com as seguintes configurações:

### Configurações de Deploy

**Nome da Aplicação**: guru-2-football-tips
**Tipo**: Node.js / Full Stack
**Porta**: 3000
**Ambiente**: Production

### Variáveis de Ambiente

```
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
```

### Comando de Inicialização

```bash
cd /home/ubuntu/guru_2_project && npm install && npm run build && node dist/index.js
```

### Ou usando Docker

```bash
docker-compose up -d
```

### Banco de Dados

- **Tipo**: SQLite (incluído no projeto)
- **Localização**: `/home/ubuntu/guru_2_project/data/rapha.db`
- **Backup automático**: Configurar no painel Manus

---

## ✅ Após o Deploy

1. Você receberá uma URL permanente: `https://guru-2-football-tips.manus.computer`
2. O site estará sempre online (sem timeout)
3. Certificado SSL automático incluído
4. CDN global para melhor performance

---

## 📊 Monitoramento

No painel Manus você pode:
- Ver logs em tempo real
- Monitorar CPU e memória
- Configurar alertas
- Fazer rollback de versões

---

## 🔄 Atualizações

Para atualizar o código:
1. Fazer push para o GitHub
2. Manus detecta automaticamente
3. Faz rebuild e redeploy

---

**Status**: Pronto para deploy permanente no Manus! 🚀
