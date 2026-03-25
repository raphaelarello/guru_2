# Pacote — Senha provisória do superadmin + filtro de alertas vazios

Este pacote foi feito para você aplicar rápido no projeto atual.

## O que ele resolve
1. **Senha provisória do superadmin**
   - via variável de ambiente
   - troca obrigatória no primeiro acesso
   - sem senha hardcoded no frontend

2. **Filtro de alertas lixo**
   - remove notificações genéricas como "Atualização em tempo real"
   - só deixa alerta com **tipo + jogo/time + minuto + mensagem**
   - ordena por prioridade

## Arquivos incluídos
- `.env.superadmin.example`
- `server/services/superAdminAuth.ts`
- `server/services/motorCentral.ts`
- `client/src/pages/AdminPanel.tsx`
- `AUDITORIA_ALERTAS_E_SUPERADMIN.md`

## Como aplicar
1. Faça backup dos arquivos atuais.
2. Copie os arquivos deste pacote para os caminhos equivalentes no projeto.
3. Crie a variável de ambiente usando o exemplo do arquivo `.env.superadmin.example`.
4. Rode:
   ```bash
   pnpm build
   ```
5. Reinicie o processo da aplicação.
6. Teste:
   - login do superadmin
   - troca obrigatória de senha
   - logout
   - alertas no ticker e na central

## Variáveis de ambiente novas
Veja `.env.superadmin.example`.

## Observação importante
Este pacote foi preparado como **patch focado**, para você subir rápido.
Se quiser, a próxima etapa eu fecho a versão com:
- TOTP real
- persistência de senha em banco
- logs de auditoria em banco
- score de pressão / risco de gol mais avançado
