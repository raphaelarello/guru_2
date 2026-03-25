
# Auditoria técnica — superadmin e riscos críticos

## Resumo executivo
A arquitetura antiga do superadmin tinha falhas críticas de segurança e confiabilidade. O principal problema não era visual: a autenticação estava sendo simulada no frontend e coexistiam duas implementações concorrentes.

## Falhas críticas encontradas
1. **Senha hardcoded no frontend**  
   Arquivo anterior: `client/src/components/AdminPanel/AdminPanelSecret.tsx`  
   Risco: qualquer pessoa com acesso ao bundle poderia extrair a senha.

2. **2FA simulado apenas no React**  
   Arquivo anterior: `client/src/pages/AdminPanel.tsx`  
   Risco: a verificação não tinha valor de segurança real.

3. **Duas áreas admin ativas ao mesmo tempo**  
   Arquivos anteriores:
   - `client/src/pages/AdminPanel.tsx`
   - `client/src/components/AdminPanel/AdminPanelSecret.tsx`
   - montagem dupla em `client/src/App.tsx`
   Risco: comportamento inconsistente, perda de sessão e conflitos de UI.

4. **Sessão sem persistência real**  
   Antes a “sessão” vivia apenas em estado do componente.

5. **Modelo de role incompleto no banco**  
   `drizzle/schema.ts` só aceitava `user` e `admin`.

## Correções aplicadas nesta fase
- criação da role `superadmin` no schema
- promoção automática do `OWNER_OPEN_ID` para `superadmin`
- remoção da montagem automática dos dois painéis inseguros no `App.tsx`
- nova autenticação `superadmin` via backend em `server/routers.ts`
- cookie seguro dedicado: `rg_superadmin_session`
- nova tela `/admin` baseada em tRPC real
- trilha de auditoria disponível por query
- timeout de sessão e invalidação por inatividade

## Arquivos alterados
- `drizzle/schema.ts`
- `drizzle/0006_superadmin_role.sql`
- `server/db.ts`
- `server/_core/trpc.ts`
- `server/services/superAdminAuth.ts`
- `server/routers.ts`
- `client/src/pages/AdminPanel.tsx`
- `client/src/App.tsx`

## Pendências recomendadas para a próxima fase
1. substituir o código bootstrap 2FA por integração com autenticador TOTP real
2. persistir auditoria em banco, não apenas em memória
3. proteger procedures sensíveis com `superAdminProcedure`
4. criar tela única de gestão de usuários, roles e permissões
5. registrar auditoria também para alterações críticas de bots, canais, banca e configs

## Outros riscos altos observados na base
- sinais ao vivo ainda mostram zeros quando a API não retorna estatística pronta
- score de pressão ainda precisa de calibração com múltiplas features
- parte do produto ainda concentra lógica demais em páginas grandes
- telas operacionais precisam de normalização visual para evitar semântica ambígua em cartões/escanteios

## Recomendação
Resolver o superadmin agora foi a decisão certa. A próxima etapa ideal é:
- consolidar autorização de alto privilégio
- persistir auditoria em banco
- calibrar o motor de leitura contextual dos jogos
- avançar em `Apostas`, `Estatísticas` e no cockpit detalhado por partida
