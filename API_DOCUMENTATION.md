# 📚 Documentação Completa da API RaphaGuru

## 🎯 Visão Geral

A API RaphaGuru é construída com **tRPC** e oferece endpoints para análise de artilheiros, recomendações ML, value betting e gerenciamento de bots.

**Base URL**: `https://raphaguru.manus.space/api/trpc`

---

## 🔐 Autenticação

Todos os endpoints requerem autenticação via **JWT Cookie** ou **Bearer Token**.

```bash
# Cookie (automático no navegador)
Cookie: session=eyJhbGc...

# Bearer Token (para APIs)
Authorization: Bearer eyJhbGc...
```

---

## 📊 Endpoints Principais

### 1. Autenticação

#### `auth.me` - Obter usuário atual
```typescript
// Tipo
{
  user?: {
    id: string;
    email: string;
    nome: string;
    role: 'admin' | 'user';
  };
}

// Exemplo
GET /api/trpc/auth.me

// Resposta
{
  "result": {
    "data": {
      "user": {
        "id": "user_123",
        "email": "usuario@example.com",
        "nome": "João Silva",
        "role": "user"
      }
    }
  }
}
```

#### `auth.logout` - Fazer logout
```typescript
// Tipo
{ success: boolean }

// Exemplo
POST /api/trpc/auth.logout

// Resposta
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

---

### 2. Artilheiros

#### `rapha.artilheiros.listar` - Listar artilheiros
```typescript
// Input
{
  filtro?: 'todos' | 'premium' | 'indisciplinados';
  limite?: number;
  pagina?: number;
}

// Output
{
  artilheiros: Array<{
    id: string;
    nome: string;
    time: string;
    liga: string;
    gols: number;
    forma: number;
    odds: number;
    status: string;
  }>;
  total: number;
  pagina: number;
}

// Exemplo
GET /api/trpc/rapha.artilheiros.listar?input={"filtro":"premium","limite":10}

// Resposta
{
  "result": {
    "data": {
      "artilheiros": [
        {
          "id": "art_001",
          "nome": "Neymar Jr",
          "time": "PSG",
          "liga": "Ligue 1",
          "gols": 15,
          "forma": 85,
          "odds": 2.5,
          "status": "ativo"
        }
      ],
      "total": 100,
      "pagina": 1
    }
  }
}
```

#### `rapha.artilheiros.detalhes` - Obter detalhes de um artilheiro
```typescript
// Input
{ id: string }

// Output
{
  id: string;
  nome: string;
  time: string;
  liga: string;
  gols: number;
  assistencias: number;
  forma: number;
  odds: number;
  historico: Array<{
    data: Date;
    gols: number;
    resultado: string;
  }>;
}

// Exemplo
GET /api/trpc/rapha.artilheiros.detalhes?input={"id":"art_001"}
```

---

### 3. Value Betting

#### `rapha.valueBetting.listar` - Listar oportunidades de value betting
```typescript
// Input
{
  threshold?: number; // Mínimo de value (default: 2%)
  limite?: number;
}

// Output
{
  oportunidades: Array<{
    id: string;
    artilheiro: string;
    mercado: string;
    oddBetfair: number;
    oddPinnacle: number;
    value: number;
    recomendacao: string;
    confianca: number;
  }>;
  total: number;
}

// Exemplo
GET /api/trpc/rapha.valueBetting.listar?input={"threshold":2,"limite":20}

// Resposta
{
  "result": {
    "data": {
      "oportunidades": [
        {
          "id": "vb_001",
          "artilheiro": "Neymar Jr",
          "mercado": "Gol Sim",
          "oddBetfair": 2.5,
          "oddPinnacle": 2.55,
          "value": 2.0,
          "recomendacao": "Apostar em Pinnacle",
          "confianca": 85
        }
      ],
      "total": 15
    }
  }
}
```

---

### 4. Recomendações ML

#### `rapha.recomendacoes.listar` - Listar recomendações ML
```typescript
// Input
{
  filtro?: 'todas' | 'pendentes' | 'acertadas' | 'erradas';
  limite?: number;
}

// Output
{
  recomendacoes: Array<{
    id: string;
    artilheiro: string;
    mercado: string;
    confianca: number;
    motivos: string[];
    oddRecomendada: number;
    status: string;
  }>;
  total: number;
  taxaAcerto: number;
}

// Exemplo
GET /api/trpc/rapha.recomendacoes.listar?input={"filtro":"todas","limite":10}

// Resposta
{
  "result": {
    "data": {
      "recomendacoes": [
        {
          "id": "rec_001",
          "artilheiro": "Neymar Jr",
          "mercado": "Gol Sim",
          "confianca": 85,
          "motivos": [
            "Forma em alta (85%)",
            "Últimos 5 jogos: 4 gols",
            "Odds favoráveis (2.5)"
          ],
          "oddRecomendada": 2.5,
          "status": "pendente"
        }
      ],
      "total": 6,
      "taxaAcerto": 75
    }
  }
}
```

---

### 5. Bots IA

#### `rapha.bots.listar` - Listar bots ativos
```typescript
// Output
{
  bots: Array<{
    id: string;
    nome: string;
    status: 'ativo' | 'inativo' | 'pausado';
    ultimaAtualizacao: Date;
    alertasGerados: number;
    taxaAcerto: number;
  }>;
  total: number;
}

// Exemplo
GET /api/trpc/rapha.bots.listar

// Resposta
{
  "result": {
    "data": {
      "bots": [
        {
          "id": "bot_001",
          "nome": "Bot Forma",
          "status": "ativo",
          "ultimaAtualizacao": "2026-03-25T08:30:00Z",
          "alertasGerados": 5,
          "taxaAcerto": 75
        }
      ],
      "total": 8
    }
  }
}
```

---

### 6. Alertas

#### `rapha.alertas.listar` - Listar alertas
```typescript
// Input
{
  tipo?: 'forma' | 'indisciplina' | 'lesao' | 'todos';
  status?: 'novo' | 'lido' | 'arquivado';
  limite?: number;
}

// Output
{
  alertas: Array<{
    id: string;
    artilheiro: string;
    tipo: string;
    mensagem: string;
    timestamp: Date;
    status: string;
  }>;
  total: number;
  naoLidos: number;
}

// Exemplo
GET /api/trpc/rapha.alertas.listar?input={"tipo":"forma","status":"novo"}
```

#### `rapha.alertas.marcarComoLido` - Marcar alerta como lido
```typescript
// Input
{ id: string }

// Output
{ success: boolean }

// Exemplo
POST /api/trpc/rapha.alertas.marcarComoLido
Content-Type: application/json

{
  "id": "alert_001"
}
```

---

### 7. Monitoramento ML

#### `rapha.ml.metricas` - Obter métricas do modelo
```typescript
// Output
{
  totalRecomendacoes: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
  lucroTotal: number;
  roiMedio: number;
  confiancaMedia: number;
  pesosPorFator: Record<string, number>;
}

// Exemplo
GET /api/trpc/rapha.ml.metricas

// Resposta
{
  "result": {
    "data": {
      "totalRecomendacoes": 1000,
      "acertos": 600,
      "erros": 400,
      "taxaAcerto": 60,
      "lucroTotal": 5000,
      "roiMedio": 5,
      "confiancaMedia": 78,
      "pesosPorFator": {
        "forma": 0.3,
        "mediaGols": 0.2,
        "odds": 0.15
      }
    }
  }
}
```

#### `rapha.ml.ajustarPesos` - Ajustar pesos do modelo
```typescript
// Input
{
  fator: string;
  valor: number;
}

// Output
{
  success: boolean;
  novosPesos: Record<string, number>;
}

// Exemplo (Admin only)
POST /api/trpc/rapha.ml.ajustarPesos
Content-Type: application/json

{
  "fator": "forma",
  "valor": 0.35
}
```

---

### 8. Credenciais

#### `rapha.credenciais.status` - Status das credenciais configuradas
```typescript
// Output
{
  betfair: boolean;
  pinnacle: boolean;
  firebase: boolean;
  football: boolean;
  production: boolean;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

// Exemplo
GET /api/trpc/rapha.credenciais.status

// Resposta
{
  "result": {
    "data": {
      "betfair": true,
      "pinnacle": true,
      "firebase": false,
      "football": true,
      "production": false,
      "validation": {
        "valid": true,
        "errors": [],
        "warnings": ["Firebase not configured"]
      }
    }
  }
}
```

---

## 🔄 Paginação

Todos os endpoints que retornam listas suportam paginação:

```typescript
{
  limite?: number;    // Default: 10, Max: 100
  pagina?: number;    // Default: 1
  ordenar?: string;   // Campo para ordenação
  ordem?: 'asc' | 'desc';
}
```

---

## ❌ Tratamento de Erros

```typescript
// Erro de validação
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validação falhou",
    "data": {
      "code": "PARSE_ERROR",
      "path": ["rapha", "artilheiros", "listar"],
      "issues": [
        {
          "code": "too_small",
          "minimum": 1,
          "type": "number",
          "path": ["limite"],
          "message": "Limite deve ser >= 1"
        }
      ]
    }
  }
}

// Erro de autenticação
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Não autenticado"
  }
}

// Erro de autorização
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Acesso negado"
  }
}

// Erro interno
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Erro interno do servidor"
  }
}
```

---

## 📈 Rate Limiting

- **Limite**: 1000 requisições por hora
- **Header**: `X-RateLimit-Remaining`
- **Reset**: `X-RateLimit-Reset`

```bash
HTTP/1.1 429 Too Many Requests
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1648276800
```

---

## 🔒 Segurança

- ✅ HTTPS obrigatório
- ✅ CORS configurado
- ✅ Rate limiting ativo
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF tokens

---

## 📝 Exemplos de Uso

### JavaScript/TypeScript

```typescript
import { trpc } from '@/lib/trpc';

// Listar artilheiros
const { data: artilheiros } = await trpc.rapha.artilheiros.listar.useQuery({
  filtro: 'premium',
  limite: 10,
});

// Obter recomendações
const { data: recomendacoes } = await trpc.rapha.recomendacoes.listar.useQuery({
  filtro: 'todas',
});

// Marcar alerta como lido
const mutation = trpc.rapha.alertas.marcarComoLido.useMutation();
await mutation.mutateAsync({ id: 'alert_001' });
```

### cURL

```bash
# Listar artilheiros
curl -X GET \
  'https://raphaguru.manus.space/api/trpc/rapha.artilheiros.listar?input={"filtro":"premium"}' \
  -H 'Cookie: session=eyJhbGc...'

# Obter métricas ML
curl -X GET \
  'https://raphaguru.manus.space/api/trpc/rapha.ml.metricas' \
  -H 'Cookie: session=eyJhbGc...'
```

### Python

```python
import requests

# Headers
headers = {
    'Cookie': 'session=eyJhbGc...',
    'Content-Type': 'application/json'
}

# Listar artilheiros
response = requests.get(
    'https://raphaguru.manus.space/api/trpc/rapha.artilheiros.listar',
    params={'input': '{"filtro":"premium"}'},
    headers=headers
)
print(response.json())
```

---

## 📞 Suporte

- **Documentação**: https://raphaguru.com/docs
- **Issues**: GitHub Issues
- **Email**: api-support@raphaguru.com

---

**Última atualização**: 25 de março de 2026
**Versão da API**: 1.0.0
