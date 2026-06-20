# 💬 tamara-whatsapp-bot — Bot de Atendimento via WhatsApp

Servidor Node.js **reativo** de atendimento via WhatsApp para a **Personal Organizer Tâmara Cavalcante**. Recebe mensagens encaminhadas pelo Make.com (via Z-API), gera resposta com inteligência artificial mantendo a persona da marca, classifica intenção e sentimento, e sinaliza quando o atendimento deve ser escalado para humano via Telegram.

> **Este bot é puramente reativo:** não posta em nenhuma rede social, não roda cron jobs. Responde exclusivamente a requisições HTTP.

---

## 🔄 Fluxo Geral

```
WhatsApp (cliente)
       ↓
Z-API — recebe mensagem e dispara webhook
       ↓
Make.com / Coruja - WhatsApp Bot Principal — orquestra o fluxo
       ↓
Railway / tamara-whatsapp-bot — IA processa a mensagem (POST /whatsapp)
       ↓
Airtable / Coruja CRM — salva mensagem + cria/atualiza contato
       ↓
Z-API — envia resposta de volta ao WhatsApp
       ↓  (se escalar = true)
Telegram — alerta humano para assumir o atendimento
```

---

## 📡 Contrato da API

### POST /whatsapp

**Entrada:**

```json
{
  "mensagem": "texto da mensagem do cliente",
  "telefone": "5531920411112",
  "historico": [
    { "conteudo": "...", "direcao": "recebida", "data": "..." },
    { "conteudo": "...", "direcao": "enviada",  "data": "..." }
  ]
}
```

> `historico` é opcional (pode vir vazio) e contém as mensagens anteriores da conversa.

**Saída:**

```json
{
  "resposta":   "texto que será enviado ao cliente via Z-API",
  "intencao":   "agendamento|preco|duvida|reclamacao|elogio|outro",
  "sentimento": "positivo|neutro|frustrado",
  "escalar":    false
}
```

`escalar: true` quando: a cliente demonstra frustração, pede proposta personalizada, pede para falar com um humano/atendente, ou já enviou 3+ mensagens sem resolução no histórico. Quando isso ocorre, o Make.com notifica automaticamente via Telegram.

### GET /health

```json
{ "status": "ok" }
```

Usado pelo Railway para validar que o serviço está no ar.

---

## 📁 Estrutura do Repositório

```
tamara-whatsapp-bot/
├── src/
│   └── index.js        # Entry point: servidor Express + endpoint /whatsapp
├── .env.example        # Variáveis de ambiente necessárias
├── .gitignore
├── nixpacks.toml       # Configuração de build (Railway)
├── package.json
└── railway.json        # Configuração de deploy (Railway)
```

---

## ⚙️ Variáveis de Ambiente

Veja `.env.example` para todas as variáveis necessárias:

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta do servidor (Railway define automaticamente) |
| `OPENAI_API_KEY` | Chave da API da OpenAI |
| `OPENAI_MODEL` | Modelo usado (padrão: `gpt-4o-mini`) |
| `TELEGRAM_BOT_TOKEN` | Token do bot do Telegram (notificação de escalamento) |
| `TELEGRAM_CHAT_ID` | Chat ID do responsável pelo atendimento |

---

## 🚀 Deploy no Railway

### railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node src/index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### nixpacks.toml

```toml
[phases.build]
cmds = ["npm install"]

[start]
cmd = "node src/index.js"
```

### Passo a passo

1. Railway → **New Project** → **Deploy from GitHub** → selecione `tamara-whatsapp-bot`
2. Configure as variáveis de ambiente em **Variables**
3. **Settings → Networking → Generate Domain** — copie a URL pública gerada
4. Cole a URL no módulo do Make.com que faz `POST /whatsapp`

**URL de produção atual:** `https://tamara-whatsapp-bot-production.up.railway.app`

---

## 💻 Rodando Localmente

```bash
npm install
cp .env.example .env   # preencha as variáveis
npm run dev
```

O servidor escuta em `process.env.PORT` (padrão: `3000`).

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Servidor HTTP | Express.js |
| Inteligência Artificial | OpenAI API |
| Mensageria WhatsApp | Z-API + Make.com |
| CRM | Airtable (Coruja CRM) |
| Notificação de escalamento | Telegram Bot API |
| Hospedagem | Railway |
