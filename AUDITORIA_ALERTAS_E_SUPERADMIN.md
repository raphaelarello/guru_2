# Auditoria focada — alertas e superadmin

## Falhas encontradas
### Críticas
- senha hardcoded no frontend
- autenticação simulada no cliente
- alertas sem contexto útil
- ticker com mensagens genéricas que reduzem confiança

### Altas
- sessão admin sem fluxo robusto de bootstrap
- ausência de validação forte para alertas
- falta de ranking/relevância dos eventos

## Correções propostas neste pacote
### Superadmin
- senha provisória via ambiente
- código provisório de 2ª etapa via ambiente
- troca obrigatória de senha no primeiro acesso
- cookie de sessão próprio
- sessão expira por TTL configurável

### Alertas
- bloqueio de mensagens vazias/genéricas
- normalização de campos
- prioridade por tipo de evento
- ordenação do mais relevante para o menos relevante

## Regras de qualidade do alerta
Um alerta só entra se tiver:
- tipo válido
- mensagem útil
- minuto ou timestamp
- time/jogo/contexto minimamente identificável

## Próxima evolução recomendada
1. persistir credenciais do superadmin em banco
2. usar hash bcrypt
3. TOTP real com autenticador
4. persistir trilha de auditoria
5. score contextual de pressão / risco / oportunidade
