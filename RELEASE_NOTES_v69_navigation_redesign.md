# RELEASE NOTES v69 — navegação premium + dock inferior

## O que entrou
- Header principal novo com separação clara por jornadas:
  - Radar Esportivo
  - Ligas
  - Ferramentas
  - Recomendadas 2026
  - Bots IA
  - Sobre o sistema
- Busca rápida estilo command palette (`Ctrl+K`) para:
  - atalhos
  - jogos do dia
  - ligas/competições
- Dock inferior fixo com 4 acessos principais:
  - Destaques
  - Radar Esportivo
  - Bots IA
  - Conta
- Home reorganizada para dar mais clareza visual e sensação de produto premium.
- Navegação aplicada também nas páginas:
  - execução manual
  - automação

## Arquivos novos
- `client/src/components/navigation/PlatformHeader.tsx`
- `client/src/components/navigation/PlatformCommandPalette.tsx`
- `client/src/components/navigation/BottomModeDock.tsx`

## Arquivos alterados
- `client/src/pages/Home.tsx`
- `client/src/pages/ExecutionCenter.tsx`
- `client/src/pages/AutomationCenter.tsx`

## Validação executada aqui
- `npm run build` → OK
- tentativa de subir `node dist/index.js` → bloqueada no ambiente por binding nativo do `better-sqlite3`
- `npm run check` → continua falhando por erros TypeScript preexistentes em outros módulos não relacionados diretamente ao redesign

## Observação importante
O redesign visual/navegacional foi aplicado e o bundle de produção foi gerado com sucesso. O runtime completo do backend não pôde ser validado nesta sessão por causa da indisponibilidade do binário nativo do `better-sqlite3` no ambiente atual.
