# Release Notes v71 — Top Palpites / Central de Oportunidades

## O que entrou
- nova aba **Top Palpites** dentro de `/executor`
- filtros rápidos por mercado: **Tudo, 1º tempo, gols, escanteios, cartões, BTTS, value e ao vivo**
- cards premium de oportunidades com:
  - probabilidade
  - odd atual
  - odd justa
  - edge
  - tags de motivo
  - botão para abrir o confronto
  - botão para adicionar ao bilhete
- rankings de equipes na rodada:
  - top equipes que mais marcam no 1º tempo
  - top equipes com mais gols no geral
  - top equipes com mais escanteios
  - top equipes que mais cedem escanteios
  - top equipes com mais cartões
  - top equipes para BTTS
- integração do bilhete com a nova central
- manutenção das abas premium já existentes:
  - Odds Intelligence
  - Timeline & Momentum
  - Props Lab
  - Execução Manual

## Arquivos principais alterados
- `client/src/pages/ExecutionCenter.tsx`
- `client/src/lib/intel.ts`

## Validação executada nesta sessão
- transpile/sintaxe dos arquivos alterados com TypeScript local: **OK**
- smoke das funções novas de Top Palpites (`buildTopOpportunityBoard` e `buildTrendBoards`): **OK**

## Limitação desta sessão
- não consegui rodar o build completo via Vite porque o ambiente não tinha o toolchain do projeto instalado (`vite` indisponível na sessão)
- por isso, a validação final foi feita por **transpile/sintaxe + smoke funcional das helpers novas**, não por build end-to-end completo
