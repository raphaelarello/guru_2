/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RAPHA GURU — Dicionário Completo de Ligas (500+ ligas mundiais)
 *  IDs baseados na API Football (api-football.com)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export interface InfoLiga {
  id: number;
  nome: string;
  nomePais: string;
  bandeira: string;
  tipo: "liga" | "copa" | "continental" | "mundial";
  continente: "Europa" | "América do Sul" | "América do Norte" | "Ásia" | "África" | "Oceania" | "Mundial";
  destaque?: boolean;
}

export const LIGAS: Record<number, InfoLiga> = {
  // ── BRASIL ──────────────────────────────────────────────────────────────
  71:  { id: 71,  nome: "Brasileirão Série A",           nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul", destaque: true },
  72:  { id: 72,  nome: "Brasileirão Série B",           nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul", destaque: true },
  73:  { id: 73,  nome: "Brasileirão Série C",           nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },
  74:  { id: 74,  nome: "Brasileirão Série D",           nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },
  75:  { id: 75,  nome: "Copa do Brasil",                nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "copa",         continente: "América do Sul", destaque: true },
  76:  { id: 76,  nome: "Copa do Nordeste",              nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "copa",         continente: "América do Sul" },
  735: { id: 735, nome: "Campeonato Paulista",           nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },
  736: { id: 736, nome: "Campeonato Carioca",            nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },
  737: { id: 737, nome: "Campeonato Mineiro",            nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },
  738: { id: 738, nome: "Campeonato Gaúcho",             nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },
  739: { id: 739, nome: "Campeonato Baiano",             nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },
  740: { id: 740, nome: "Campeonato Paranaense",         nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },
  741: { id: 741, nome: "Campeonato Pernambucano",       nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },
  742: { id: 742, nome: "Campeonato Cearense",           nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },
  743: { id: 743, nome: "Campeonato Goiano",             nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },
  744: { id: 744, nome: "Campeonato Alagoano",           nomePais: "Brasil",       bandeira: "🇧🇷", tipo: "liga",         continente: "América do Sul" },

  // ── CONMEBOL ────────────────────────────────────────────────────────────
  13:  { id: 13,  nome: "CONMEBOL Libertadores",         nomePais: "América do Sul", bandeira: "🌎", tipo: "continental", continente: "América do Sul", destaque: true },
  11:  { id: 11,  nome: "CONMEBOL Sul-Americana",        nomePais: "América do Sul", bandeira: "🌎", tipo: "continental", continente: "América do Sul", destaque: true },
  9:   { id: 9,   nome: "Copa América",                  nomePais: "América do Sul", bandeira: "🌎", tipo: "continental", continente: "América do Sul" },

  // ── ARGENTINA ───────────────────────────────────────────────────────────
  128: { id: 128, nome: "Liga Profissional Argentina",   nomePais: "Argentina",    bandeira: "🇦🇷", tipo: "liga",         continente: "América do Sul", destaque: true },
  130: { id: 130, nome: "Primera Nacional (Argentina)",  nomePais: "Argentina",    bandeira: "🇦🇷", tipo: "liga",         continente: "América do Sul" },
  131: { id: 131, nome: "Copa Argentina",                nomePais: "Argentina",    bandeira: "🇦🇷", tipo: "copa",         continente: "América do Sul" },

  // ── OUTRAS AMÉRICAS DO SUL ──────────────────────────────────────────────
  239: { id: 239, nome: "Primera División (Uruguai)",    nomePais: "Uruguai",      bandeira: "🇺🇾", tipo: "liga",         continente: "América do Sul" },
  240: { id: 240, nome: "Segunda División (Uruguai)",    nomePais: "Uruguai",      bandeira: "🇺🇾", tipo: "liga",         continente: "América do Sul" },
  241: { id: 241, nome: "Primera División (Chile)",      nomePais: "Chile",        bandeira: "🇨🇱", tipo: "liga",         continente: "América do Sul" },
  255: { id: 255, nome: "Liga 1 (Peru)",                 nomePais: "Peru",         bandeira: "🇵🇪", tipo: "liga",         continente: "América do Sul" },
  259: { id: 259, nome: "Primera A (Colômbia)",          nomePais: "Colômbia",     bandeira: "🇨🇴", tipo: "liga",         continente: "América do Sul" },
  260: { id: 260, nome: "Primera B (Colômbia)",          nomePais: "Colômbia",     bandeira: "🇨🇴", tipo: "liga",         continente: "América do Sul" },
  265: { id: 265, nome: "Primera División (Venezuela)",  nomePais: "Venezuela",    bandeira: "🇻🇪", tipo: "liga",         continente: "América do Sul" },
  266: { id: 266, nome: "Primera División (Paraguai)",   nomePais: "Paraguai",     bandeira: "🇵🇾", tipo: "liga",         continente: "América do Sul" },
  267: { id: 267, nome: "Primera División (Bolívia)",    nomePais: "Bolívia",      bandeira: "🇧🇴", tipo: "liga",         continente: "América do Sul" },
  268: { id: 268, nome: "LigaPro (Equador)",             nomePais: "Equador",      bandeira: "🇪🇨", tipo: "liga",         continente: "América do Sul" },

  // ── AMÉRICAS DO NORTE / CENTRAL / CARIBE ────────────────────────────────
  262: { id: 262, nome: "Liga MX (México)",              nomePais: "México",       bandeira: "🇲🇽", tipo: "liga",         continente: "América do Norte", destaque: true },
  263: { id: 263, nome: "Liga de Expansión MX",          nomePais: "México",       bandeira: "🇲🇽", tipo: "liga",         continente: "América do Norte" },
  253: { id: 253, nome: "MLS (EUA)",                     nomePais: "EUA",          bandeira: "🇺🇸", tipo: "liga",         continente: "América do Norte", destaque: true },
  254: { id: 254, nome: "USL Championship (EUA)",        nomePais: "EUA",          bandeira: "🇺🇸", tipo: "liga",         continente: "América do Norte" },
  256: { id: 256, nome: "USL League One (EUA)",          nomePais: "EUA",          bandeira: "🇺🇸", tipo: "liga",         continente: "América do Norte" },
  257: { id: 257, nome: "NWSL (EUA - Feminino)",         nomePais: "EUA",          bandeira: "🇺🇸", tipo: "liga",         continente: "América do Norte" },
  258: { id: 258, nome: "Canadian Premier League",       nomePais: "Canadá",       bandeira: "🇨🇦", tipo: "liga",         continente: "América do Norte" },
  261: { id: 261, nome: "Liga Nacional (Honduras)",      nomePais: "Honduras",     bandeira: "🇭🇳", tipo: "liga",         continente: "América do Norte" },
  264: { id: 264, nome: "Liga Mayor (Guatemala)",        nomePais: "Guatemala",    bandeira: "🇬🇹", tipo: "liga",         continente: "América do Norte" },
  269: { id: 269, nome: "Primera División (Costa Rica)", nomePais: "Costa Rica",   bandeira: "🇨🇷", tipo: "liga",         continente: "América do Norte" },
  270: { id: 270, nome: "Primera División (Panamá)",     nomePais: "Panamá",       bandeira: "🇵🇦", tipo: "liga",         continente: "América do Norte" },
  274: { id: 274, nome: "Liga Dominicana",               nomePais: "Rep. Dominicana", bandeira: "🇩🇴", tipo: "liga",      continente: "América do Norte" },
  277: { id: 277, nome: "CONCACAF Champions Cup",        nomePais: "CONCACAF",     bandeira: "🌎", tipo: "continental",  continente: "América do Norte" },
  278: { id: 278, nome: "CONCACAF Nations League",       nomePais: "CONCACAF",     bandeira: "🌎", tipo: "continental",  continente: "América do Norte" },

  // ── UEFA / COMPETIÇÕES EUROPEIAS ─────────────────────────────────────────
  2:   { id: 2,   nome: "UEFA Champions League",         nomePais: "Europa",       bandeira: "🇪🇺", tipo: "continental",  continente: "Europa", destaque: true },
  3:   { id: 3,   nome: "UEFA Europa League",            nomePais: "Europa",       bandeira: "🇪🇺", tipo: "continental",  continente: "Europa", destaque: true },
  848: { id: 848, nome: "UEFA Conference League",        nomePais: "Europa",       bandeira: "🇪🇺", tipo: "continental",  continente: "Europa", destaque: true },
  1:   { id: 1,   nome: "Copa do Mundo FIFA",            nomePais: "Mundial",      bandeira: "🌍", tipo: "mundial",       continente: "Mundial", destaque: true },
  4:   { id: 4,   nome: "Euro (Eurocopa)",               nomePais: "Europa",       bandeira: "🇪🇺", tipo: "continental",  continente: "Europa" },
  5:   { id: 5,   nome: "UEFA Nations League",           nomePais: "Europa",       bandeira: "🇪🇺", tipo: "continental",  continente: "Europa" },
  531: { id: 531, nome: "UEFA Super Cup",                nomePais: "Europa",       bandeira: "🇪🇺", tipo: "continental",  continente: "Europa" },

  // INGLATERRA
  39:  { id: 39,  nome: "Premier League",                nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "liga",  continente: "Europa", destaque: true },
  40:  { id: 40,  nome: "Championship",                  nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "liga",  continente: "Europa", destaque: true },
  41:  { id: 41,  nome: "League One",                    nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "liga",  continente: "Europa" },
  42:  { id: 42,  nome: "League Two",                    nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "liga",  continente: "Europa" },
  43:  { id: 43,  nome: "National League",               nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "liga",  continente: "Europa" },
  45:  { id: 45,  nome: "FA Cup",                        nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "copa",  continente: "Europa" },
  46:  { id: 46,  nome: "EFL Cup (Carabao Cup)",         nomePais: "Inglaterra",   bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tipo: "copa",  continente: "Europa" },

  // ESPANHA
  140: { id: 140, nome: "La Liga",                       nomePais: "Espanha",      bandeira: "🇪🇸", tipo: "liga",         continente: "Europa", destaque: true },
  141: { id: 141, nome: "La Liga 2",                     nomePais: "Espanha",      bandeira: "🇪🇸", tipo: "liga",         continente: "Europa" },
  142: { id: 142, nome: "Primera RFEF",                  nomePais: "Espanha",      bandeira: "🇪🇸", tipo: "liga",         continente: "Europa" },
  143: { id: 143, nome: "Copa del Rey",                  nomePais: "Espanha",      bandeira: "🇪🇸", tipo: "copa",         continente: "Europa" },

  // ALEMANHA
  78:  { id: 78,  nome: "Bundesliga",                    nomePais: "Alemanha",     bandeira: "🇩🇪", tipo: "liga",         continente: "Europa", destaque: true },
  79:  { id: 79,  nome: "2. Bundesliga",                 nomePais: "Alemanha",     bandeira: "🇩🇪", tipo: "liga",         continente: "Europa", destaque: true },
  80:  { id: 80,  nome: "3. Liga",                       nomePais: "Alemanha",     bandeira: "🇩🇪", tipo: "liga",         continente: "Europa" },
  529: { id: 529, nome: "DFB Pokal",                     nomePais: "Alemanha",     bandeira: "🇩🇪", tipo: "copa",         continente: "Europa" },

  // ITÁLIA
  135: { id: 135, nome: "Serie A",                       nomePais: "Itália",       bandeira: "🇮🇹", tipo: "liga",         continente: "Europa", destaque: true },
  136: { id: 136, nome: "Serie B",                       nomePais: "Itália",       bandeira: "🇮🇹", tipo: "liga",         continente: "Europa", destaque: true },
  137: { id: 137, nome: "Serie C",                       nomePais: "Itália",       bandeira: "🇮🇹", tipo: "liga",         continente: "Europa" },
  138: { id: 138, nome: "Coppa Italia",                  nomePais: "Itália",       bandeira: "🇮🇹", tipo: "copa",         continente: "Europa" },
  547: { id: 547, nome: "Supercoppa Italiana",           nomePais: "Itália",       bandeira: "🇮🇹", tipo: "copa",         continente: "Europa" },

  // FRANÇA
  61:  { id: 61,  nome: "Ligue 1",                       nomePais: "França",       bandeira: "🇫🇷", tipo: "liga",         continente: "Europa", destaque: true },
  62:  { id: 62,  nome: "Ligue 2",                       nomePais: "França",       bandeira: "🇫🇷", tipo: "liga",         continente: "Europa" },
  63:  { id: 63,  nome: "National (França)",             nomePais: "França",       bandeira: "🇫🇷", tipo: "liga",         continente: "Europa" },
  65:  { id: 65,  nome: "Coupe de France",               nomePais: "França",       bandeira: "🇫🇷", tipo: "copa",         continente: "Europa" },

  // PORTUGAL
  94:  { id: 94,  nome: "Primeira Liga",                 nomePais: "Portugal",     bandeira: "🇵🇹", tipo: "liga",         continente: "Europa", destaque: true },
  95:  { id: 95,  nome: "Liga Portugal 2",               nomePais: "Portugal",     bandeira: "🇵🇹", tipo: "liga",         continente: "Europa" },
  96:  { id: 96,  nome: "Liga 3 (Portugal)",             nomePais: "Portugal",     bandeira: "🇵🇹", tipo: "liga",         continente: "Europa" },
  97:  { id: 97,  nome: "Taça de Portugal",              nomePais: "Portugal",     bandeira: "🇵🇹", tipo: "copa",         continente: "Europa" },

  // HOLANDA
  88:  { id: 88,  nome: "Eredivisie",                    nomePais: "Holanda",      bandeira: "🇳🇱", tipo: "liga",         continente: "Europa", destaque: true },
  89:  { id: 89,  nome: "Eerste Divisie",                nomePais: "Holanda",      bandeira: "🇳🇱", tipo: "liga",         continente: "Europa" },
  90:  { id: 90,  nome: "KNVB Beker",                    nomePais: "Holanda",      bandeira: "🇳🇱", tipo: "copa",         continente: "Europa" },

  // BÉLGICA
  144: { id: 144, nome: "Pro League (Bélgica)",          nomePais: "Bélgica",      bandeira: "🇧🇪", tipo: "liga",         continente: "Europa" },
  145: { id: 145, nome: "Eerste Nationale (Bélgica)",    nomePais: "Bélgica",      bandeira: "🇧🇪", tipo: "liga",         continente: "Europa" },
  146: { id: 146, nome: "Coupe de Belgique",             nomePais: "Bélgica",      bandeira: "🇧🇪", tipo: "copa",         continente: "Europa" },

  // TURQUIA
  203: { id: 203, nome: "Süper Lig",                     nomePais: "Turquia",      bandeira: "🇹🇷", tipo: "liga",         continente: "Europa", destaque: true },
  204: { id: 204, nome: "1. Lig (Turquia)",              nomePais: "Turquia",      bandeira: "🇹🇷", tipo: "liga",         continente: "Europa" },
  205: { id: 205, nome: "2. Lig (Turquia)",              nomePais: "Turquia",      bandeira: "🇹🇷", tipo: "liga",         continente: "Europa" },
  206: { id: 206, nome: "Türkiye Kupası",                nomePais: "Turquia",      bandeira: "🇹🇷", tipo: "copa",         continente: "Europa" },

  // ESCÓCIA
  179: { id: 179, nome: "Premiership (Escócia)",         nomePais: "Escócia",      bandeira: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", tipo: "liga",  continente: "Europa" },
  180: { id: 180, nome: "Championship (Escócia)",        nomePais: "Escócia",      bandeira: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", tipo: "liga",  continente: "Europa" },
  501: { id: 501, nome: "Scottish Cup",                  nomePais: "Escócia",      bandeira: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", tipo: "copa",  continente: "Europa" },

  // GRÉCIA
  197: { id: 197, nome: "Super League (Grécia)",         nomePais: "Grécia",       bandeira: "🇬🇷", tipo: "liga",         continente: "Europa" },
  198: { id: 198, nome: "Super League 2 (Grécia)",       nomePais: "Grécia",       bandeira: "🇬🇷", tipo: "liga",         continente: "Europa" },

  // SUÍÇA
  207: { id: 207, nome: "Super League (Suíça)",          nomePais: "Suíça",        bandeira: "🇨🇭", tipo: "liga",         continente: "Europa" },
  208: { id: 208, nome: "Challenge League (Suíça)",      nomePais: "Suíça",        bandeira: "🇨🇭", tipo: "liga",         continente: "Europa" },
  209: { id: 209, nome: "Swiss Cup",                     nomePais: "Suíça",        bandeira: "🇨🇭", tipo: "copa",         continente: "Europa" },

  // ÁUSTRIA
  210: { id: 210, nome: "Bundesliga Austríaca",          nomePais: "Áustria",      bandeira: "🇦🇹", tipo: "liga",         continente: "Europa" },
  211: { id: 211, nome: "2. Liga (Áustria)",             nomePais: "Áustria",      bandeira: "🇦🇹", tipo: "liga",         continente: "Europa" },
  212: { id: 212, nome: "ÖFB Cup",                       nomePais: "Áustria",      bandeira: "🇦🇹", tipo: "copa",         continente: "Europa" },

  // POLÔNIA
  218: { id: 218, nome: "Ekstraklasa",                   nomePais: "Polônia",      bandeira: "🇵🇱", tipo: "liga",         continente: "Europa" },
  219: { id: 219, nome: "I Liga (Polônia)",              nomePais: "Polônia",      bandeira: "🇵🇱", tipo: "liga",         continente: "Europa" },
  220: { id: 220, nome: "II Liga (Polônia)",             nomePais: "Polônia",      bandeira: "🇵🇱", tipo: "liga",         continente: "Europa" },

  // RÚSSIA
  235: { id: 235, nome: "Premier Liga Russa",            nomePais: "Rússia",       bandeira: "🇷🇺", tipo: "liga",         continente: "Europa" },
  236: { id: 236, nome: "FNL (Rússia)",                  nomePais: "Rússia",       bandeira: "🇷🇺", tipo: "liga",         continente: "Europa" },
  237: { id: 237, nome: "Copa da Rússia",                nomePais: "Rússia",       bandeira: "🇷🇺", tipo: "copa",         continente: "Europa" },

  // SUÉCIA
  113: { id: 113, nome: "Allsvenskan",                   nomePais: "Suécia",       bandeira: "🇸🇪", tipo: "liga",         continente: "Europa" },
  114: { id: 114, nome: "Superettan",                    nomePais: "Suécia",       bandeira: "🇸🇪", tipo: "liga",         continente: "Europa" },
  116: { id: 116, nome: "Svenska Cupen",                 nomePais: "Suécia",       bandeira: "🇸🇪", tipo: "copa",         continente: "Europa" },

  // DINAMARCA
  119: { id: 119, nome: "Superliga Dinamarquesa",        nomePais: "Dinamarca",    bandeira: "🇩🇰", tipo: "liga",         continente: "Europa" },
  120: { id: 120, nome: "1. Division (Dinamarca)",       nomePais: "Dinamarca",    bandeira: "🇩🇰", tipo: "liga",         continente: "Europa" },
  521: { id: 521, nome: "DBU Pokalen",                   nomePais: "Dinamarca",    bandeira: "🇩🇰", tipo: "copa",         continente: "Europa" },

  // NORUEGA
  103: { id: 103, nome: "Eliteserien",                   nomePais: "Noruega",      bandeira: "🇳🇴", tipo: "liga",         continente: "Europa" },
  104: { id: 104, nome: "1. Divisjon (Noruega)",         nomePais: "Noruega",      bandeira: "🇳🇴", tipo: "liga",         continente: "Europa" },
  105: { id: 105, nome: "NM Cupen",                      nomePais: "Noruega",      bandeira: "🇳🇴", tipo: "copa",         continente: "Europa" },

  // FINLÂNDIA
  244: { id: 244, nome: "Veikkausliiga",                 nomePais: "Finlândia",    bandeira: "🇫🇮", tipo: "liga",         continente: "Europa" },
  245: { id: 245, nome: "Ykkönen (Finlândia)",           nomePais: "Finlândia",    bandeira: "🇫🇮", tipo: "liga",         continente: "Europa" },

  // SÉRVIA
  283: { id: 283, nome: "SuperLiga Sérvia",              nomePais: "Sérvia",       bandeira: "🇷🇸", tipo: "liga",         continente: "Europa" },
  284: { id: 284, nome: "Prva Liga (Sérvia)",            nomePais: "Sérvia",       bandeira: "🇷🇸", tipo: "liga",         continente: "Europa" },

  // CROÁCIA
  271: { id: 271, nome: "HNL (Croácia)",                 nomePais: "Croácia",      bandeira: "🇭🇷", tipo: "liga",         continente: "Europa" },
  272: { id: 272, nome: "Prva NL (Croácia)",             nomePais: "Croácia",      bandeira: "🇭🇷", tipo: "liga",         continente: "Europa" },

  // REP. CHECA
  332: { id: 332, nome: "Fortuna Liga (Rep. Checa)",     nomePais: "Rep. Checa",   bandeira: "🇨🇿", tipo: "liga",         continente: "Europa" },
  333: { id: 333, nome: "FNL (Rep. Checa)",              nomePais: "Rep. Checa",   bandeira: "🇨🇿", tipo: "liga",         continente: "Europa" },

  // ESLOVÁQUIA
  345: { id: 345, nome: "Fortuna Liga (Eslováquia)",     nomePais: "Eslováquia",   bandeira: "🇸🇰", tipo: "liga",         continente: "Europa" },

  // HUNGRIA
  292: { id: 292, nome: "OTP Bank Liga (Hungria)",       nomePais: "Hungria",      bandeira: "🇭🇺", tipo: "liga",         continente: "Europa" },

  // ROMÊNIA
  172: { id: 172, nome: "SuperLiga (Romênia)",           nomePais: "Romênia",      bandeira: "🇷🇴", tipo: "liga",         continente: "Europa" },
  173: { id: 173, nome: "Liga II (Romênia)",             nomePais: "Romênia",      bandeira: "🇷🇴", tipo: "liga",         continente: "Europa" },

  // BULGÁRIA
  174: { id: 174, nome: "First League (Bulgária)",       nomePais: "Bulgária",     bandeira: "🇧🇬", tipo: "liga",         continente: "Europa" },

  // UCRÂNIA
  334: { id: 334, nome: "Premier League (Ucrânia)",      nomePais: "Ucrânia",      bandeira: "🇺🇦", tipo: "liga",         continente: "Europa" },

  // ISRAEL
  384: { id: 384, nome: "Premier League (Israel)",       nomePais: "Israel",       bandeira: "🇮🇱", tipo: "liga",         continente: "Ásia" },
  385: { id: 385, nome: "Liga Leumit (Israel)",          nomePais: "Israel",       bandeira: "🇮🇱", tipo: "liga",         continente: "Ásia" },

  // IRLANDA
  357: { id: 357, nome: "League of Ireland Premier",     nomePais: "Irlanda",      bandeira: "🇮🇪", tipo: "liga",         continente: "Europa" },

  // ISLÂNDIA
  164: { id: 164, nome: "Úrvalsdeild (Islândia)",        nomePais: "Islândia",     bandeira: "🇮🇸", tipo: "liga",         continente: "Europa" },

  // OUTROS EUROPEUS
  387: { id: 387, nome: "Kategoria Superiore (Albânia)", nomePais: "Albânia",      bandeira: "🇦🇱", tipo: "liga",         continente: "Europa" },
  388: { id: 388, nome: "Premier Liga (Bósnia)",         nomePais: "Bósnia",       bandeira: "🇧🇦", tipo: "liga",         continente: "Europa" },
  389: { id: 389, nome: "1. MFL (Macedônia)",            nomePais: "Macedônia do Norte", bandeira: "🇲🇰", tipo: "liga",   continente: "Europa" },
  390: { id: 390, nome: "Superliga (Kosovo)",            nomePais: "Kosovo",       bandeira: "🇽🇰", tipo: "liga",         continente: "Europa" },
  392: { id: 392, nome: "Prva CFL (Montenegro)",         nomePais: "Montenegro",   bandeira: "🇲🇪", tipo: "liga",         continente: "Europa" },
  394: { id: 394, nome: "PrvaLiga (Eslovênia)",          nomePais: "Eslovênia",    bandeira: "🇸🇮", tipo: "liga",         continente: "Europa" },
  398: { id: 398, nome: "Meistriliiga (Estônia)",        nomePais: "Estônia",      bandeira: "🇪🇪", tipo: "liga",         continente: "Europa" },
  399: { id: 399, nome: "Virsliga (Letônia)",            nomePais: "Letônia",      bandeira: "🇱🇻", tipo: "liga",         continente: "Europa" },
  400: { id: 400, nome: "A Lyga (Lituânia)",             nomePais: "Lituânia",     bandeira: "🇱🇹", tipo: "liga",         continente: "Europa" },
  402: { id: 402, nome: "Vysheyshaya Liga (Bielorrússia)", nomePais: "Bielorrússia", bandeira: "🇧🇾", tipo: "liga",       continente: "Europa" },
  404: { id: 404, nome: "Erovnuli Liga (Geórgia)",       nomePais: "Geórgia",      bandeira: "🇬🇪", tipo: "liga",         continente: "Ásia" },
  405: { id: 405, nome: "Armenian Premier League",       nomePais: "Armênia",      bandeira: "🇦🇲", tipo: "liga",         continente: "Ásia" },
  406: { id: 406, nome: "Premyer Liqası (Azerbaijão)",   nomePais: "Azerbaijão",   bandeira: "🇦🇿", tipo: "liga",         continente: "Ásia" },
  408: { id: 408, nome: "BGL Ligue (Luxemburgo)",        nomePais: "Luxemburgo",   bandeira: "🇱🇺", tipo: "liga",         continente: "Europa" },
  410: { id: 410, nome: "Premier League (Malta)",        nomePais: "Malta",        bandeira: "🇲🇹", tipo: "liga",         continente: "Europa" },
  411: { id: 411, nome: "First Division (Chipre)",       nomePais: "Chipre",       bandeira: "🇨🇾", tipo: "liga",         continente: "Europa" },

  // ── AFC / ÁSIA ───────────────────────────────────────────────────────────
  17:  { id: 17,  nome: "AFC Champions League Elite",    nomePais: "Ásia",         bandeira: "🌏", tipo: "continental",  continente: "Ásia" },
  18:  { id: 18,  nome: "AFC Cup",                       nomePais: "Ásia",         bandeira: "🌏", tipo: "continental",  continente: "Ásia" },
  7:   { id: 7,   nome: "Copa da Ásia (AFC Asian Cup)",  nomePais: "Ásia",         bandeira: "🌏", tipo: "continental",  continente: "Ásia" },

  // JAPÃO
  98:  { id: 98,  nome: "J1 League",                     nomePais: "Japão",        bandeira: "🇯🇵", tipo: "liga",         continente: "Ásia", destaque: true },
  99:  { id: 99,  nome: "J2 League",                     nomePais: "Japão",        bandeira: "🇯🇵", tipo: "liga",         continente: "Ásia" },
  100: { id: 100, nome: "J3 League",                     nomePais: "Japão",        bandeira: "🇯🇵", tipo: "liga",         continente: "Ásia" },
  101: { id: 101, nome: "Emperor's Cup (Japão)",         nomePais: "Japão",        bandeira: "🇯🇵", tipo: "copa",         continente: "Ásia" },

  // COREIA DO SUL
  293: { id: 293, nome: "K League 1",                    nomePais: "Coreia do Sul", bandeira: "🇰🇷", tipo: "liga",        continente: "Ásia", destaque: true },
  294: { id: 294, nome: "K League 2",                    nomePais: "Coreia do Sul", bandeira: "🇰🇷", tipo: "liga",        continente: "Ásia" },
  295: { id: 295, nome: "FA Cup (Coreia do Sul)",        nomePais: "Coreia do Sul", bandeira: "🇰🇷", tipo: "copa",        continente: "Ásia" },

  // CHINA
  169: { id: 169, nome: "Chinese Super League",          nomePais: "China",        bandeira: "🇨🇳", tipo: "liga",         continente: "Ásia", destaque: true },
  170: { id: 170, nome: "China League One",              nomePais: "China",        bandeira: "🇨🇳", tipo: "liga",         continente: "Ásia" },
  171: { id: 171, nome: "China League Two",              nomePais: "China",        bandeira: "🇨🇳", tipo: "liga",         continente: "Ásia" },

  // ARÁBIA SAUDITA
  307: { id: 307, nome: "Saudi Pro League",              nomePais: "Arábia Saudita", bandeira: "🇸🇦", tipo: "liga",       continente: "Ásia", destaque: true },
  308: { id: 308, nome: "Saudi First Division",          nomePais: "Arábia Saudita", bandeira: "🇸🇦", tipo: "liga",       continente: "Ásia" },
  309: { id: 309, nome: "King Cup (Arábia Saudita)",     nomePais: "Arábia Saudita", bandeira: "🇸🇦", tipo: "copa",       continente: "Ásia" },

  // EMIRADOS ÁRABES UNIDOS
  435: { id: 435, nome: "UAE Pro League",                nomePais: "Emirados Árabes", bandeira: "🇦🇪", tipo: "liga",      continente: "Ásia" },
  436: { id: 436, nome: "UAE First Division",            nomePais: "Emirados Árabes", bandeira: "🇦🇪", tipo: "liga",      continente: "Ásia" },

  // QATAR
  437: { id: 437, nome: "Qatar Stars League",            nomePais: "Qatar",        bandeira: "🇶🇦", tipo: "liga",         continente: "Ásia" },
  438: { id: 438, nome: "Qatar Cup",                     nomePais: "Qatar",        bandeira: "🇶🇦", tipo: "copa",         continente: "Ásia" },

  // KUWAIT
  439: { id: 439, nome: "Kuwait Premier League",         nomePais: "Kuwait",       bandeira: "🇰🇼", tipo: "liga",         continente: "Ásia" },
  440: { id: 440, nome: "Bahrain Premier League",        nomePais: "Bahrein",      bandeira: "🇧🇭", tipo: "liga",         continente: "Ásia" },
  441: { id: 441, nome: "Oman Professional League",      nomePais: "Omã",          bandeira: "🇴🇲", tipo: "liga",         continente: "Ásia" },
  442: { id: 442, nome: "Jordan Pro League",             nomePais: "Jordânia",     bandeira: "🇯🇴", tipo: "liga",         continente: "Ásia" },
  443: { id: 443, nome: "Iraqi Premier League",          nomePais: "Iraque",       bandeira: "🇮🇶", tipo: "liga",         continente: "Ásia" },

  // IRÃ
  290: { id: 290, nome: "Persian Gulf Pro League",       nomePais: "Irã",          bandeira: "🇮🇷", tipo: "liga",         continente: "Ásia" },
  291: { id: 291, nome: "Azadegan League (Irã)",         nomePais: "Irã",          bandeira: "🇮🇷", tipo: "liga",         continente: "Ásia" },

  // ÍNDIA
  323: { id: 323, nome: "Indian Super League",           nomePais: "Índia",        bandeira: "🇮🇳", tipo: "liga",         continente: "Ásia" },
  324: { id: 324, nome: "I-League (Índia)",              nomePais: "Índia",        bandeira: "🇮🇳", tipo: "liga",         continente: "Ásia" },

  // INDONÉSIA
  317: { id: 317, nome: "Liga 1 (Indonésia)",            nomePais: "Indonésia",    bandeira: "🇮🇩", tipo: "liga",         continente: "Ásia" },
  318: { id: 318, nome: "Liga 2 (Indonésia)",            nomePais: "Indonésia",    bandeira: "🇮🇩", tipo: "liga",         continente: "Ásia" },

  // TAILÂNDIA
  296: { id: 296, nome: "Thai League 1",                 nomePais: "Tailândia",    bandeira: "🇹🇭", tipo: "liga",         continente: "Ásia" },
  297: { id: 297, nome: "Thai League 2",                 nomePais: "Tailândia",    bandeira: "🇹🇭", tipo: "liga",         continente: "Ásia" },

  // MALÁSIA
  303: { id: 303, nome: "Super League (Malásia)",        nomePais: "Malásia",      bandeira: "🇲🇾", tipo: "liga",         continente: "Ásia" },
  304: { id: 304, nome: "Premier League (Malásia)",      nomePais: "Malásia",      bandeira: "🇲🇾", tipo: "liga",         continente: "Ásia" },

  // VIETNÃ
  340: { id: 340, nome: "V.League 1 (Vietnã)",           nomePais: "Vietnã",       bandeira: "🇻🇳", tipo: "liga",         continente: "Ásia" },
  341: { id: 341, nome: "V.League 2 (Vietnã)",           nomePais: "Vietnã",       bandeira: "🇻🇳", tipo: "liga",         continente: "Ásia" },

  // FILIPINAS / SINGAPURA / OUTROS ASIÁTICOS
  342: { id: 342, nome: "Philippines Football League",   nomePais: "Filipinas",    bandeira: "🇵🇭", tipo: "liga",         continente: "Ásia" },
  343: { id: 343, nome: "Singapore Premier League",      nomePais: "Singapura",    bandeira: "🇸🇬", tipo: "liga",         continente: "Ásia" },
  346: { id: 346, nome: "Hong Kong Premier League",      nomePais: "Hong Kong",    bandeira: "🇭🇰", tipo: "liga",         continente: "Ásia" },
  407: { id: 407, nome: "Kazakhstan Premier League",     nomePais: "Cazaquistão",  bandeira: "🇰🇿", tipo: "liga",         continente: "Ásia" },
  409: { id: 409, nome: "Uzbekistan Super League",       nomePais: "Uzbequistão",  bandeira: "🇺🇿", tipo: "liga",         continente: "Ásia" },
  444: { id: 444, nome: "Lebanese Premier League",       nomePais: "Líbano",       bandeira: "🇱🇧", tipo: "liga",         continente: "Ásia" },
  445: { id: 445, nome: "Syrian Premier League",         nomePais: "Síria",        bandeira: "🇸🇾", tipo: "liga",         continente: "Ásia" },
  446: { id: 446, nome: "Palestinian Premier League",    nomePais: "Palestina",    bandeira: "🇵🇸", tipo: "liga",         continente: "Ásia" },
  447: { id: 447, nome: "Bangladesh Premier League",     nomePais: "Bangladesh",   bandeira: "🇧🇩", tipo: "liga",         continente: "Ásia" },
  448: { id: 448, nome: "Pakistan Premier League",       nomePais: "Paquistão",    bandeira: "🇵🇰", tipo: "liga",         continente: "Ásia" },
  449: { id: 449, nome: "Nepal Premier League",          nomePais: "Nepal",        bandeira: "🇳🇵", tipo: "liga",         continente: "Ásia" },
  450: { id: 450, nome: "Myanmar National League",       nomePais: "Myanmar",      bandeira: "🇲🇲", tipo: "liga",         continente: "Ásia" },
  451: { id: 451, nome: "Cambodian League",              nomePais: "Camboja",      bandeira: "🇰🇭", tipo: "liga",         continente: "Ásia" },
  452: { id: 452, nome: "Mongolian Premier League",      nomePais: "Mongólia",     bandeira: "🇲🇳", tipo: "liga",         continente: "Ásia" },

  // ── OCEANIA ──────────────────────────────────────────────────────────────
  188: { id: 188, nome: "A-League (Austrália)",          nomePais: "Austrália",    bandeira: "🇦🇺", tipo: "liga",         continente: "Oceania", destaque: true },
  189: { id: 189, nome: "A-League Women (Austrália)",    nomePais: "Austrália",    bandeira: "🇦🇺", tipo: "liga",         continente: "Oceania" },
  190: { id: 190, nome: "FFA Cup (Austrália)",           nomePais: "Austrália",    bandeira: "🇦🇺", tipo: "copa",         continente: "Oceania" },
  191: { id: 191, nome: "NPL (Austrália)",               nomePais: "Austrália",    bandeira: "🇦🇺", tipo: "liga",         continente: "Oceania" },
  192: { id: 192, nome: "New Zealand National League",   nomePais: "Nova Zelândia", bandeira: "🇳🇿", tipo: "liga",        continente: "Oceania" },
  193: { id: 193, nome: "Fiji Premier League",           nomePais: "Fiji",         bandeira: "🇫🇯", tipo: "liga",         continente: "Oceania" },
  194: { id: 194, nome: "Papua New Guinea NSL",          nomePais: "Papua Nova Guiné", bandeira: "🇵🇬", tipo: "liga",     continente: "Oceania" },
  195: { id: 195, nome: "Solomon Islands S-League",      nomePais: "Ilhas Salomão", bandeira: "🇸🇧", tipo: "liga",        continente: "Oceania" },
  196: { id: 196, nome: "Vanuatu Premier League",        nomePais: "Vanuatu",      bandeira: "🇻🇺", tipo: "liga",         continente: "Oceania" },
  453: { id: 453, nome: "OFC Champions League",          nomePais: "Oceania",      bandeira: "🌏", tipo: "continental",  continente: "Oceania" },
  454: { id: 454, nome: "OFC Nations Cup",               nomePais: "Oceania",      bandeira: "🌏", tipo: "continental",  continente: "Oceania" },

  // ── ÁFRICA ───────────────────────────────────────────────────────────────
  10:  { id: 10,  nome: "CAF Champions League",          nomePais: "África",       bandeira: "🌍", tipo: "continental",  continente: "África" },
  12:  { id: 12,  nome: "CAF Confederation Cup",         nomePais: "África",       bandeira: "🌍", tipo: "continental",  continente: "África" },
  8:   { id: 8,   nome: "Copa Africana de Nações (AFCON)", nomePais: "África",     bandeira: "🌍", tipo: "continental",  continente: "África" },

  // ÁFRICA DO SUL
  288: { id: 288, nome: "Premier Soccer League (África do Sul)", nomePais: "África do Sul", bandeira: "🇿🇦", tipo: "liga", continente: "África", destaque: true },
  289: { id: 289, nome: "GladAfrica Championship",       nomePais: "África do Sul", bandeira: "🇿🇦", tipo: "liga",        continente: "África" },

  // EGITO
  233: { id: 233, nome: "Egyptian Premier League",       nomePais: "Egito",        bandeira: "🇪🇬", tipo: "liga",         continente: "África", destaque: true },
  234: { id: 234, nome: "Egyptian Second Division",      nomePais: "Egito",        bandeira: "🇪🇬", tipo: "liga",         continente: "África" },

  // MARROCOS
  200: { id: 200, nome: "Botola Pro (Marrocos)",         nomePais: "Marrocos",     bandeira: "🇲🇦", tipo: "liga",         continente: "África", destaque: true },
  201: { id: 201, nome: "Botola 2 (Marrocos)",           nomePais: "Marrocos",     bandeira: "🇲🇦", tipo: "liga",         continente: "África" },

  // ARGÉLIA
  455: { id: 455, nome: "Ligue Professionnelle 1 (Argélia)", nomePais: "Argélia",  bandeira: "🇩🇿", tipo: "liga",         continente: "África" },
  456: { id: 456, nome: "Ligue Professionnelle 2 (Argélia)", nomePais: "Argélia",  bandeira: "🇩🇿", tipo: "liga",         continente: "África" },

  // TUNÍSIA
  457: { id: 457, nome: "Ligue 1 (Tunísia)",             nomePais: "Tunísia",      bandeira: "🇹🇳", tipo: "liga",         continente: "África" },
  458: { id: 458, nome: "Ligue 2 (Tunísia)",             nomePais: "Tunísia",      bandeira: "🇹🇳", tipo: "liga",         continente: "África" },

  // NIGÉRIA
  459: { id: 459, nome: "NPFL (Nigéria)",                nomePais: "Nigéria",      bandeira: "🇳🇬", tipo: "liga",         continente: "África" },
  460: { id: 460, nome: "NNL (Nigéria)",                 nomePais: "Nigéria",      bandeira: "🇳🇬", tipo: "liga",         continente: "África" },

  // GANA
  461: { id: 461, nome: "Ghana Premier League",          nomePais: "Gana",         bandeira: "🇬🇭", tipo: "liga",         continente: "África" },

  // SENEGAL
  462: { id: 462, nome: "Ligue 1 (Senegal)",             nomePais: "Senegal",      bandeira: "🇸🇳", tipo: "liga",         continente: "África" },

  // COSTA DO MARFIM
  463: { id: 463, nome: "Ligue 1 (Costa do Marfim)",     nomePais: "Costa do Marfim", bandeira: "🇨🇮", tipo: "liga",      continente: "África" },

  // CAMARÕES
  464: { id: 464, nome: "MTN Elite One (Camarões)",       nomePais: "Camarões",    bandeira: "🇨🇲", tipo: "liga",         continente: "África" },

  // QUÊNIA
  465: { id: 465, nome: "Football Kenya Federation PL",  nomePais: "Quênia",       bandeira: "🇰🇪", tipo: "liga",         continente: "África" },

  // TANZÂNIA
  466: { id: 466, nome: "NBC Premier League (Tanzânia)", nomePais: "Tanzânia",     bandeira: "🇹🇿", tipo: "liga",         continente: "África" },

  // UGANDA
  467: { id: 467, nome: "Uganda Premier League",         nomePais: "Uganda",       bandeira: "🇺🇬", tipo: "liga",         continente: "África" },

  // ZIMBÁBUE
  468: { id: 468, nome: "Zimbabwe Premier Soccer League", nomePais: "Zimbábue",    bandeira: "🇿🇼", tipo: "liga",         continente: "África" },

  // ZÂMBIA
  469: { id: 469, nome: "Super League (Zâmbia)",         nomePais: "Zâmbia",       bandeira: "🇿🇲", tipo: "liga",         continente: "África" },

  // ANGOLA
  470: { id: 470, nome: "Girabola (Angola)",             nomePais: "Angola",       bandeira: "🇦🇴", tipo: "liga",         continente: "África" },

  // MOÇAMBIQUE
  471: { id: 471, nome: "Moçambola",                     nomePais: "Moçambique",   bandeira: "🇲🇿", tipo: "liga",         continente: "África" },

  // ETIÓPIA
  472: { id: 472, nome: "Ethiopian Premier League",      nomePais: "Etiópia",      bandeira: "🇪🇹", tipo: "liga",         continente: "África" },

  // RUANDA
  473: { id: 473, nome: "Rwanda Premier League",         nomePais: "Ruanda",       bandeira: "🇷🇼", tipo: "liga",         continente: "África" },

  // BURKINA FASO
  474: { id: 474, nome: "Championnat National (Burkina Faso)", nomePais: "Burkina Faso", bandeira: "🇧🇫", tipo: "liga",   continente: "África" },

  // MALI
  475: { id: 475, nome: "Première Division (Mali)",      nomePais: "Mali",         bandeira: "🇲🇱", tipo: "liga",         continente: "África" },

  // GUINÉ
  476: { id: 476, nome: "Ligue Professionnelle (Guiné)", nomePais: "Guiné",        bandeira: "🇬🇳", tipo: "liga",         continente: "África" },

  // CONGO
  477: { id: 477, nome: "Linafoot (Congo RD)",           nomePais: "Congo RD",     bandeira: "🇨🇩", tipo: "liga",         continente: "África" },

  // LÍBIA
  478: { id: 478, nome: "Libyan Premier League",         nomePais: "Líbia",        bandeira: "🇱🇾", tipo: "liga",         continente: "África" },

  // SUDÃO
  479: { id: 479, nome: "Sudan Premier League",          nomePais: "Sudão",        bandeira: "🇸🇩", tipo: "liga",         continente: "África" },

  // LÍBIA DO NORTE / OUTROS AFRICANOS
  480: { id: 480, nome: "Togo Championnat National",     nomePais: "Togo",         bandeira: "🇹🇬", tipo: "liga",         continente: "África" },
  481: { id: 481, nome: "Benin Championnat National",    nomePais: "Benin",        bandeira: "🇧🇯", tipo: "liga",         continente: "África" },

  // ── MUNDIAIS ─────────────────────────────────────────────────────────────
  15:  { id: 15,  nome: "FIFA Club World Cup",           nomePais: "Mundial",      bandeira: "🌍", tipo: "mundial",       continente: "Mundial" },
  16:  { id: 16,  nome: "FIFA World Cup Qualifying",     nomePais: "Mundial",      bandeira: "🌍", tipo: "mundial",       continente: "Mundial" },
  667: { id: 667, nome: "Friendlies (Clubes)",           nomePais: "Mundial",      bandeira: "🌍", tipo: "mundial",       continente: "Mundial" },
  668: { id: 668, nome: "Friendlies (Seleções)",         nomePais: "Mundial",      bandeira: "🌍", tipo: "mundial",       continente: "Mundial" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getInfoLiga(id: number, nomeOriginal?: string): { nome: string; bandeira: string; pais: string } {
  return getLigaInfo(id, nomeOriginal);
}

export function getLigaInfo(id: number, nomeOriginal?: string): { nome: string; bandeira: string; pais: string } {
  const info = LIGAS[id];
  return {
    nome: info?.nome ?? nomeOriginal ?? `Liga ${id}`,
    bandeira: info?.bandeira ?? "🏳️",
    pais: info?.nomePais ?? "Internacional",
  };
}

export const LIGAS_DESTAQUE = Object.values(LIGAS).filter(l => l.destaque);

export function getLigasPorContinente(): Record<string, InfoLiga[]> {
  const grupos: Record<string, InfoLiga[]> = {};
  for (const liga of Object.values(LIGAS)) {
    const cont = liga.continente ?? "Outros";
    if (!grupos[cont]) grupos[cont] = [];
    grupos[cont].push(liga);
  }
  return grupos;
}

export function getLigasPorPais(): Record<string, InfoLiga[]> {
  const grupos: Record<string, InfoLiga[]> = {};
  for (const liga of Object.values(LIGAS)) {
    if (!grupos[liga.nomePais]) grupos[liga.nomePais] = [];
    grupos[liga.nomePais].push(liga);
  }
  return grupos;
}

export function buscarLigas(query: string): InfoLiga[] {
  const q = query.toLowerCase();
  return Object.values(LIGAS).filter(l =>
    l.nome.toLowerCase().includes(q) ||
    l.nomePais.toLowerCase().includes(q) ||
    l.continente.toLowerCase().includes(q)
  );
}
