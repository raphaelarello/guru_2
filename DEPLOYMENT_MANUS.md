# Deployment Permanente - Guru 2 no Manus

## 📋 Informações de Deployment

**Projeto**: Football Tips Pro (Guru 2)
**Ambiente**: Produção
**Data de Deploy**: 2026-03-25
**Status**: ✅ Ativo

## 🚀 Como Iniciar o Servidor

### Opção 1: Script de Inicialização
```bash
cd /home/ubuntu/guru_2_project
./start-production.sh
```

### Opção 2: Comando Direto
```bash
cd /home/ubuntu/guru_2_project
export NODE_ENV=production
export JWT_SECRET=guru_secret_key_2026_test_manus_deployment
export ADMIN_EMAIL=admin@raphaguru.com
export ADMIN_PASSWORD=Admin@2024
export SUPERADMIN_BOOTSTRAP_USER=superadmin
export SUPERADMIN_BOOTSTRAP_PASSWORD=TroqueAgora!2026
export SUPERADMIN_BOOTSTRAP_CODE=246810
export SUPERADMIN_COOKIE_NAME=rg_superadmin
export SUPERADMIN_SESSION_TTL_MINUTES=480
export SUPERADMIN_REQUIRE_PASSWORD_CHANGE=true
node dist/index.js
```

## 🔐 Credenciais de Acesso

### Admin
- **Email**: admin@raphaguru.com
- **Senha**: Admin@2024

### Superadmin
- **Usuário**: superadmin
- **Senha Inicial**: TroqueAgora!2026 (será solicitada troca no primeiro acesso)
- **Código**: 246810

## 📦 Estrutura de Diretórios

```
/home/ubuntu/guru_2_project/
├── dist/                    # Build compilado
│   ├── index.js            # Servidor principal
│   └── public/             # Arquivos estáticos
├── server/                 # Código backend
│   ├── services/           # Serviços (auth, alertas, etc)
│   ├── routes/             # Rotas da API
│   ├── middleware/         # Middleware (JWT, RBAC)
│   └── db/                 # Schema do banco
├── client/                 # Código frontend (React)
├── data/                   # Banco SQLite
├── package.json            # Dependências
├── vite.config.ts          # Config Vite
└── start-production.sh     # Script de inicialização
```

## 🔄 Build e Deploy

### Build
```bash
cd /home/ubuntu/guru_2_project
npm run build
```

### Após atualizar código
1. Fazer pull do GitHub
2. Executar `npm run build`
3. Reiniciar o servidor

## 📊 Monitoramento

### Verificar se o servidor está rodando
```bash
curl http://localhost:3000
```

### Ver logs
```bash
# Se usando systemd
journalctl -u guru-server -f

# Se rodando diretamente
# Os logs aparecem no console
```

## 🌐 URLs de Acesso

**Local**: http://localhost:3000
**Manus Permanente**: https://[seu-dominio-manus].manus.computer

## 🔧 Variáveis de Ambiente

| Variável | Valor | Descrição |
|----------|-------|-----------|
| NODE_ENV | production | Ambiente |
| JWT_SECRET | guru_secret_key_2026_test_manus_deployment | Chave JWT |
| ADMIN_EMAIL | admin@raphaguru.com | Email do admin |
| ADMIN_PASSWORD | Admin@2024 | Senha do admin |
| SUPERADMIN_BOOTSTRAP_USER | superadmin | Usuário superadmin |
| SUPERADMIN_BOOTSTRAP_PASSWORD | TroqueAgora!2026 | Senha superadmin |
| SUPERADMIN_BOOTSTRAP_CODE | 246810 | Código superadmin |
| SUPERADMIN_COOKIE_NAME | rg_superadmin | Nome do cookie |
| SUPERADMIN_SESSION_TTL_MINUTES | 480 | TTL da sessão (8h) |
| SUPERADMIN_REQUIRE_PASSWORD_CHANGE | true | Forçar troca de senha |

## 📝 Banco de Dados

**Tipo**: SQLite
**Localização**: `/home/ubuntu/guru_2_project/data/rapha.db`
**Backup**: Fazer backup regularmente do arquivo `rapha.db`

## 🚨 Troubleshooting

### Erro: "JWT_SECRET obrigatório em produção"
- Certifique-se de que a variável `JWT_SECRET` está definida

### Erro: "Playwright não encontrado"
- A automação do Playwright não está ativa em modo de teste
- Para ativar: `npm run instalar:automacao`

### Porta 3000 já em uso
- Mudar porta em `vite.config.ts` (server.port)
- Ou matar processo: `lsof -i :3000`

## 📞 Suporte

Para mais informações, consulte:
- SAAS_README.md - Documentação do módulo SaaS
- AUDITORIA_ALERTAS_E_SUPERADMIN.md - Documentação de alertas
- README_APLICAR.md - Instruções de aplicação do patch
