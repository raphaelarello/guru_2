/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RAPHA GURU — Dicionário Completo de Ligas
 *  Tradução PT-BR + Bandeira (emoji) + País
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface InfoLiga {
  id: number;
  nome: string;         // Nome em português
  nomePais: string;     // País em português
  bandeira: string;     // Emoji da bandeira
  tipo: "liga" | "copa" | "continental" | "mundial";
  destaque?: boolean;   // Ligas principais
}

/** Mapa de ID da API Football → dados em PT-BR */
export const LIGAS: Record<number, InfoLiga> = {
  // ── BRASIL ──────────────────────────────────────────────────────────────
  71:  { id: 71,  nome: "Brasileirão Série A",       nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         destaque: true },
  72:  { id: 72,  nome: "Brasileirão Série B",       nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         destaque: true },
  73:  { id: 73,  nome: "Brasileirão Série C",       nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  74:  { id: 74,  nome: "Brasileirão Série D",       nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  75:  { id: 75,  nome: "Copa do Brasil",            nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "copa",         destaque: true },
  76:  { id: 76,  nome: "Copa do Nordeste",          nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "copa" },
  735: { id: 735, nome: "Campeonato Paulista",       nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  736: { id: 736, nome: "Campeonato Carioca",        nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  737: { id: 737, nome: "Campeonato Mineiro",        nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  738: { id: 738, nome: "Campeonato Gaúcho",         nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  739: { id: 739, nome: "Campeonato Baiano",         nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  740: { id: 740, nome: "Campeonato Pernambucano",   nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  741: { id: 741, nome: "Campeonato Paranaense",     nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  742: { id: 742, nome: "Campeonato Cearense",       nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  743: { id: 743, nome: "Campeonato Alagoano",       nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  744: { id: 744, nome: "Campeonato Paraibano",      nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  745: { id: 745, nome: "Campeonato Maranhense",     nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  746: { id: 746, nome: "Campeonato Potiguar",       nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  747: { id: 747, nome: "Campeonato Capixaba",       nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  748: { id: 748, nome: "Campeonato Amapaense",      nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  749: { id: 749, nome: "Campeonato Acreano",        nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  750: { id: 750, nome: "Campeonato Amazonense",     nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  751: { id: 751, nome: "Campeonato Mato-Grossense", nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  752: { id: 752, nome: "Campeonato Goiano",         nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  753: { id: 753, nome: "Campeonato Tocantinense",   nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  754: { id: 754, nome: "Campeonato Piauiense",      nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  755: { id: 755, nome: "Campeonato Sergipano",      nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  756: { id: 756, nome: "Campeonato Mato-Grosso do Sul", nomePais: "Brasil",   bandeira: "🇧🇷", tipo: "liga" },
  757: { id: 757, nome: "Campeonato Rondoniense",    nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  758: { id: 758, nome: "Campeonato Roraimense",     nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },
  759: { id: 759, nome: "Campeonato Paraense",       nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga" },

  // ── CONTINENTAIS ────────────────────────────────────────────────────────
  2:   { id: 2,   nome: "Liga dos Campeões UEFA",    nomePais: "Europa",       bandeira: "🏆", tipo: "continental",  destaque: true },
  3:   { id: 3,   nome: "Liga Europa UEFA",          nomePais: "Europa",       bandeira: "🏆", tipo: "continental",  destaque: true },
  848: { id: 848, nome: "Liga Conferência UEFA",     nomePais: "Europa",       bandeira: "🏆", tipo: "continental" },
  11:  { id: 11,  nome: "Copa Libertadores",         nomePais: "América do Sul", bandeira: "🏆", tipo: "continental", destaque: true },
  13:  { id: 13,  nome: "Copa Sul-Americana",        nomePais: "América do Sul", bandeira: "🏆", tipo: "continental" },
  1:   { id: 1,   nome: "Copa do Mundo FIFA",        nomePais: "Mundial",      bandeira: "🌍", tipo: "mundial",      destaque: true },
  9:   { id: 9,   nome: "Copa América",              nomePais: "América do Sul", bandeira: "🌎", tipo: "continental" },
  6:   { id: 6,   nome: "Eurocopa",                  nomePais: "Europa",       bandeira: "🇪🇺", tipo: "continental" },

  // ── INGLATERRA ──────────────────────────────────────────────────────────
  39:  { id: 39,  nome: "Premier League",            nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "liga", destaque: true },
  40:  { id: 40,  nome: "Championship",              nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "liga" },
  41:  { id: 41,  nome: "Liga 1 (Inglaterra)",       nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "liga" },
  42:  { id: 42,  nome: "Liga 2 (Inglaterra)",       nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "liga" },
  45:  { id: 45,  nome: "Copa da FA",                nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "copa" },
  48:  { id: 48,  nome: "Copa da Liga Inglesa",      nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "copa" },

  // ── ESPANHA ─────────────────────────────────────────────────────────────
  140: { id: 140, nome: "La Liga",                   nomePais: "Espanha",      bandeira: "🇪🇸", tipo: "liga", destaque: true },
  141: { id: 141, nome: "Segunda División",          nomePais: "Espanha",      bandeira: "🇪🇸", tipo: "liga" },
  143: { id: 143, nome: "Copa del Rey",              nomePais: "Espanha",      bandeira: "🇪🇸", tipo: "copa" },

  // ── ALEMANHA ────────────────────────────────────────────────────────────
  78:  { id: 78,  nome: "Bundesliga",                nomePais: "Alemanha",     bandeira: "🇩🇪", tipo: "liga", destaque: true },
  79:  { id: 79,  nome: "2. Bundesliga",             nomePais: "Alemanha",     bandeira: "🇩🇪", tipo: "liga" },
  80:  { id: 80,  nome: "3. Liga",                   nomePais: "Alemanha",     bandeira: "🇩🇪", tipo: "liga" },
  81:  { id: 81,  nome: "Copa da Alemanha (DFB-Pokal)", nomePais: "Alemanha",  bandeira: "🇩🇪", tipo: "copa" },

  // ── ITÁLIA ──────────────────────────────────────────────────────────────
  135: { id: 135, nome: "Serie A",                   nomePais: "Itália",       bandeira: "🇮🇹", tipo: "liga", destaque: true },
  136: { id: 136, nome: "Serie B",                   nomePais: "Itália",       bandeira: "🇮🇹", tipo: "liga" },
  137: { id: 137, nome: "Serie C",                   nomePais: "Itália",       bandeira: "🇮🇹", tipo: "liga" },
  138: { id: 138, nome: "Copa da Itália (Coppa Italia)", nomePais: "Itália",   bandeira: "🇮🇹", tipo: "copa" },

  // ── FRANÇA ──────────────────────────────────────────────────────────────
  61:  { id: 61,  nome: "Ligue 1",                   nomePais: "França",       bandeira: "🇫🇷", tipo: "liga", destaque: true },
  62:  { id: 62,  nome: "Ligue 2",                   nomePais: "França",       bandeira: "🇫🇷", tipo: "liga" },
  66:  { id: 66,  nome: "Copa da França",            nomePais: "França",       bandeira: "🇫🇷", tipo: "copa" },

  // ── PORTUGAL ────────────────────────────────────────────────────────────
  94:  { id: 94,  nome: "Primeira Liga",             nomePais: "Portugal",     bandeira: "🇵🇹", tipo: "liga", destaque: true },
  95:  { id: 95,  nome: "Segunda Liga",              nomePais: "Portugal",     bandeira: "🇵🇹", tipo: "liga" },
  96:  { id: 96,  nome: "Copa de Portugal",          nomePais: "Portugal",     bandeira: "🇵🇹", tipo: "copa" },

  // ── ARGENTINA ───────────────────────────────────────────────────────────
  128: { id: 128, nome: "Liga Profissional Argentina", nomePais: "Argentina",  bandeira: "🇦🇷", tipo: "liga", destaque: true },
  130: { id: 130, nome: "Primera Nacional (Argentina)", nomePais: "Argentina", bandeira: "🇦🇷", tipo: "liga" },
  131: { id: 131, nome: "Copa Argentina",            nomePais: "Argentina",    bandeira: "🇦🇷", tipo: "copa" },

  // ── OUTROS PAÍSES EUROPEUS ──────────────────────────────────────────────
  88:  { id: 88,  nome: "Eredivisie",                nomePais: "Holanda",      bandeira: "🇳🇱", tipo: "liga", destaque: true },
  89:  { id: 89,  nome: "Eerste Divisie",            nomePais: "Holanda",      bandeira: "🇳🇱", tipo: "liga" },
  144: { id: 144, nome: "Pro League (Bélgica)",      nomePais: "Bélgica",      bandeira: "🇧🇪", tipo: "liga" },
  169: { id: 169, nome: "Super Liga (Turquia)",      nomePais: "Turquia",      bandeira: "🇹🇷", tipo: "liga" },
  179: { id: 179, nome: "Premiership (Escócia)",     nomePais: "Escócia",      bandeira: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", tipo: "liga" },
  197: { id: 197, nome: "Super Liga (Grécia)",       nomePais: "Grécia",       bandeira: "🇬🇷", tipo: "liga" },
  203: { id: 203, nome: "Süper Lig (Turquia)",       nomePais: "Turquia",      bandeira: "🇹🇷", tipo: "liga" },
  207: { id: 207, nome: "Primeira Liga (Suíça)",     nomePais: "Suíça",        bandeira: "🇨🇭", tipo: "liga" },
  210: { id: 210, nome: "Bundesliga Austríaca",      nomePais: "Áustria",      bandeira: "🇦🇹", tipo: "liga" },
  218: { id: 218, nome: "Ekstraklasa (Polônia)",     nomePais: "Polônia",      bandeira: "🇵🇱", tipo: "liga" },
  235: { id: 235, nome: "Premier Liga Russa",        nomePais: "Rússia",       bandeira: "🇷🇺", tipo: "liga" },
  244: { id: 244, nome: "Allsvenskan (Suécia)",      nomePais: "Suécia",       bandeira: "🇸🇪", tipo: "liga" },
  119: { id: 119, nome: "Superliga Dinamarquesa",    nomePais: "Dinamarca",    bandeira: "🇩🇰", tipo: "liga" },
  113: { id: 113, nome: "Veikkausliiga (Finlândia)", nomePais: "Finlândia",    bandeira: "🇫🇮", tipo: "liga" },
  103: { id: 103, nome: "Eliteserien (Noruega)",     nomePais: "Noruega",      bandeira: "🇳🇴", tipo: "liga" },
  283: { id: 283, nome: "Liga Sérvia",               nomePais: "Sérvia",       bandeira: "🇷🇸", tipo: "liga" },
  271: { id: 271, nome: "HNL (Croácia)",             nomePais: "Croácia",      bandeira: "🇭🇷", tipo: "liga" },
  332: { id: 332, nome: "Fortuna Liga (Rep. Checa)", nomePais: "Rep. Checa",   bandeira: "🇨🇿", tipo: "liga" },
  345: { id: 345, nome: "Fortuna Liga (Eslováquia)", nomePais: "Eslováquia",   bandeira: "🇸🇰", tipo: "liga" },
  292: { id: 292, nome: "Nemzeti Bajnokság (Hungria)", nomePais: "Hungria",    bandeira: "🇭🇺", tipo: "liga" },
  172: { id: 172, nome: "Liga I (Romênia)",          nomePais: "Romênia",      bandeira: "🇷🇴", tipo: "liga" },
  182: { id: 182, nome: "Jupiler Pro League (Bélgica)", nomePais: "Bélgica",   bandeira: "🇧🇪", tipo: "liga" },

  // ── AMÉRICAS ────────────────────────────────────────────────────────────
  239: { id: 239, nome: "Primera División (Uruguai)", nomePais: "Uruguai",     bandeira: "🇺🇾", tipo: "liga" },
  241: { id: 241, nome: "Primera División (Chile)",  nomePais: "Chile",        bandeira: "🇨🇱", tipo: "liga" },
  242: { id: 242, nome: "Liga MX (México)",          nomePais: "México",       bandeira: "🇲🇽", tipo: "liga", destaque: true },
  253: { id: 253, nome: "MLS (EUA)",                 nomePais: "EUA",          bandeira: "🇺🇸", tipo: "liga" },
  255: { id: 255, nome: "Liga 1 (Peru)",             nomePais: "Peru",         bandeira: "🇵🇪", tipo: "liga" },
  259: { id: 259, nome: "Primera División (Colômbia)", nomePais: "Colômbia",   bandeira: "🇨🇴", tipo: "liga" },
  265: { id: 265, nome: "Primera División (Venezuela)", nomePais: "Venezuela", bandeira: "🇻🇪", tipo: "liga" },
  266: { id: 266, nome: "Primera División (Paraguai)", nomePais: "Paraguai",   bandeira: "🇵🇾", tipo: "liga" },
  267: { id: 267, nome: "Primera División (Bolívia)", nomePais: "Bolívia",     bandeira: "🇧🇴", tipo: "liga" },
  268: { id: 268, nome: "Primera División (Equador)", nomePais: "Equador",     bandeira: "🇪🇨", tipo: "liga" },

  // ── ÁSIA / OCEANIA ──────────────────────────────────────────────────────
  98:  { id: 98,  nome: "J-League (Japão)",          nomePais: "Japão",        bandeira: "🇯🇵", tipo: "liga" },
  293: { id: 293, nome: "K-League (Coreia do Sul)",  nomePais: "Coreia do Sul", bandeira: "🇰🇷", tipo: "liga" },
  170: { id: 170, nome: "Super Liga Chinesa",        nomePais: "China",        bandeira: "🇨🇳", tipo: "liga" },
  307: { id: 307, nome: "Liga Saudita (Pro League)", nomePais: "Arábia Saudita", bandeira: "🇸🇦", tipo: "liga" },
  188: { id: 188, nome: "A-League (Austrália)",      nomePais: "Austrália",    bandeira: "🇦🇺", tipo: "liga" },

  // ── ÁFRICA ──────────────────────────────────────────────────────────────
  233: { id: 233, nome: "Premier League Sul-Africana", nomePais: "África do Sul", bandeira: "🇿🇦", tipo: "liga" },
  200: { id: 200, nome: "Premier League Egípcia",    nomePais: "Egito",        bandeira: "🇪🇬", tipo: "liga" },
  202: { id: 202, nome: "Premier League Marroquina", nomePais: "Marrocos",     bandeira: "🇲🇦", tipo: "liga" },
};

/** Retorna nome PT-BR da liga ou o nome original se não encontrado */
export function getNomeLiga(id: number, nomeOriginal?: string): string {
  return LIGAS[id]?.nome ?? nomeOriginal ?? `Liga ${id}`;
}

/** Retorna bandeira da liga */
export function getBandeiraLiga(id: number): string {
  return LIGAS[id]?.bandeira ?? "🏳️";
}

/** Retorna nome do país da liga */
export function getPaisLiga(id: number): string {
  return LIGAS[id]?.nomePais ?? "Internacional";
}

/** Retorna info completa da liga */
export function getInfoLiga(id: number, nomeOriginal?: string): { nome: string; bandeira: string; pais: string } {
  const info = LIGAS[id];
  return {
    nome: info?.nome ?? nomeOriginal ?? `Liga ${id}`,
    bandeira: info?.bandeira ?? "🏳️",
    pais: info?.nomePais ?? "Internacional",
  };
}

/** Lista de ligas em destaque para filtros rápidos */
export const LIGAS_DESTAQUE = Object.values(LIGAS).filter(l => l.destaque);

/** Agrupa ligas por país */
export function getLigasPorPais(): Record<string, InfoLiga[]> {
  const grupos: Record<string, InfoLiga[]> = {};
  for (const liga of Object.values(LIGAS)) {
    if (!grupos[liga.nomePais]) grupos[liga.nomePais] = [];
    grupos[liga.nomePais].push(liga);
  }
  return grupos;
}
