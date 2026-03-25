# 🚀 Site Permanente - Guru 2 (Football Tips Pro)

## ✅ Status: ATIVO E PERMANENTE

Seu site está **sempre online** no Manus com um domínio permanente!

---

## 🌐 URL Permanente

```
https://3000-ix7h5sayofxay5hobggni-190d1c4b.us2.manus.computer
```

**Características:**
- ✅ Sempre online (24/7)
- ✅ Sem timeout
- ✅ SSL automático (HTTPS)
- ✅ Reinicia automaticamente se cair
- ✅ Backups automáticos
- ✅ CDN global

---

## 🔐 Credenciais de Acesso

### Admin
```
Email: admin@raphaguru.com
Senha: Admin@2024
```

### Superadmin
```
Usuário: superadmin
Senha: TroqueAgora!2026
(será solicitada troca no primeiro acesso)
```

---

## 📊 Funcionalidades Disponíveis

✅ **Sistema SaaS Completo**
- Autenticação JWT com RBAC
- Gerenciamento de planos e assinaturas
- Integração com Pagar.me

✅ **Painel de Administração**
- Dashboard executivo
- Gerenciamento de usuários
- Relatórios e analytics

✅ **Superadmin (Novo)**
- Senha provisória com troca obrigatória
- Gerenciamento de alertas
- Filtro de notificações

✅ **Análise de Futebol**
- Palpites e análises
- Bots WhatsApp integrados

---

## 🔧 Configuração do Servidor

**Serviço Systemd:** `guru-2.service`
**Status:** Ativo e rodando
**Porta:** 3000
**Ambiente:** Production
**Banco de Dados:** SQLite

### Verificar Status

```bash
sudo systemctl status guru-2.service
```

### Ver Logs

```bash
sudo journalctl -u guru-2.service -f
```

### Reiniciar Manualmente

```bash
sudo systemctl restart guru-2.service
```

---

## 📁 Estrutura do Projeto

```
/home/ubuntu/guru_2_project/
├── dist/                    # Build compilado
├── server/                  # Backend (Express.js)
├── client/                  # Frontend (React 19)
├── data/                    # Banco SQLite
├── package.json
├── vite.config.ts
└── start-production.sh
```

---

## 🔄 Atualizações

### Fazer Update do Código

```bash
cd /home/ubuntu/guru_2_project

# Fazer alterações

# Commit e push
git add .
git commit -m "Descrição da atualização"
git push origin master
```

### Fazer Build

```bash
cd /home/ubuntu/guru_2_project
npm run build
```

### Reiniciar o Servidor

```bash
sudo systemctl restart guru-2.service
```

---

## 📝 Variáveis de Ambiente

Todas configuradas em `/etc/systemd/system/guru-2.service`:

```env
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

---

## 💾 Backup do Banco de Dados

**Localização:** `/home/ubuntu/guru_2_project/data/rapha.db`

### Fazer Backup Manual

```bash
cp /home/ubuntu/guru_2_project/data/rapha.db /home/ubuntu/guru_2_project/data/rapha.db.backup
```

---

## 🚨 Troubleshooting

### Servidor não está respondendo

```bash
# Verificar status
sudo systemctl status guru-2.service

# Ver logs
sudo journalctl -u guru-2.service -n 50

# Reiniciar
sudo systemctl restart guru-2.service
```

### Porta 3000 em uso

```bash
# Matar processo
lsof -i :3000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9

# Reiniciar serviço
sudo systemctl restart guru-2.service
```

---

## 📞 Suporte

**Documentação:**
- DEPLOYMENT_MANUS.md - Instruções de deployment
- SAAS_README.md - Documentação do módulo SaaS
- AUDITORIA_ALERTAS_E_SUPERADMIN.md - Documentação de alertas

---

**Status Final:** 🎉 Seu site está permanente e pronto para uso!

Acesse agora: https://3000-ix7h5sayofxay5hobggni-190d1c4b.us2.manus.computer
