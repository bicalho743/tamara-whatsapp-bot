# tamara-whatsapp-bot

Bot de atendimento via WhatsApp da Tâmara Cavalcante (Personal Organizer). Recebe
mensagens encaminhadas pelo Make.com (a partir do Z-API), gera resposta com IA
mantendo a persona da marca, classifica intenção/sentimento e sinaliza quando o
atendimento deve ser escalado para um humano (Solano via Telegram).

Este bot é **reativo**: não posta em nenhuma rede social e não roda cron. Ele só
responde a requisições HTTP.

## Contrato — POST /whatsapp

**Entrada:**
```json
{
  "mensagem": "texto da mensagem do cliente",
  "telefone": "5531920411112",
  "historico": [
    {"conteudo": "...", "direcao": "recebida", "data": "..."},
    {"conteudo": "...", "direcao": "enviada", "data": "..."}
  ]
}
```
`historico` é opcional (pode vir vazio) e contém as mensagens anteriores da conversa.

**Saída:**
```json
{
  "resposta": "texto que será enviado ao cliente via Z-API",
  "intencao": "agendamento|preco|duvida|reclamacao|elogio|outro",
  "sentimento": "positivo|neutro|frustrado",
  "escalar": false
}
```

`escalar=true` quando: a cliente demonstra frustração, pede proposta
personalizada, pede para falar com um humano/atendente, ou já enviou 3+
mensagens sem resolução no histórico. Quando isso ocorre, o bot notifica
automaticamente o Solano via Telegram.

## GET /health

Retorna `{"status":"ok"}` — usado para validar o domínio no Railway.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha as variáveis
npm run dev
```

O servidor escuta em `process.env.PORT` (padrão 3000).

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `PORT` | porta do servidor (Railway define automaticamente) |
| `OPENAI_API_KEY` | chave da API da OpenAI |
| `OPENAI_MODEL` | modelo usado (padrão `gpt-4o-mini`) |
| `SUPABASE_URL` | URL do projeto Supabase (CRM) |
| `SUPABASE_SERVICE_KEY` | service key do Supabase |
| `TELEGRAM_BOT_TOKEN` | token do bot do Telegram (notificação de escalonamento) |
| `TELEGRAM_CHAT_ID` | chat ID do Solano no Telegram |

## Deploy no Railway

1. Railway → **New Project** → **Deploy from GitHub** → selecione `tamara-whatsapp-bot`.
2. Configure as variáveis de ambiente acima em **Variables**.
3. **Settings** → **Networking** → **Generate Domain**.
4. Copie a URL pública gerada e cole no módulo correspondente do Make.com (que faz o POST para `/whatsapp`).
