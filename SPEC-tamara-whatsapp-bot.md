# ESPECIFICAÇÃO — tamara-whatsapp-bot

> Documento de build para o Claude Code. Leia inteiro antes de começar.
> Objetivo: criar um repositório NOVO (`tamara-whatsapp-bot`) com um bot de
> atendimento WhatsApp, em Node.js/Express, para deploy no Railway.

---

## 0. CONTEXTO CRÍTICO (leia com atenção)

Existe um repo chamado `bicalho743/Tamara_bot`. **APESAR DO NOME, esse repo é uma
automação de Twitter/X que está EM PRODUÇÃO e NÃO PODE SER TOCADA.** Ele só serve
aqui como REFERÊNCIA de estilo de código e como fonte da "Alma" (o brain/persona).

Este projeto cria um bot SEPARADO e NOVO, para WhatsApp. NÃO modifique o
`Tamara_bot`. Apenas leia-o para entender:
- Como o `src/modules/brainLoader.js` carrega a Alma
- O formato dos arquivos da pasta `brain/`
- O estilo dos módulos `openai.js`, `telegram.js`, `db.js`

## 1. PASSO A PASSO ESPERADO

1. Clonar `https://github.com/bicalho743/Tamara_bot` para uma pasta temporária
   APENAS PARA LEITURA (referência). Não commitar nada nele.
2. Inspecionar: `src/modules/brainLoader.js`, pasta `brain/` inteira,
   `src/modules/openai.js`, `src/modules/telegram.js`, `src/modules/db.js`,
   `src/index.js`, `package.json`, `railway.json`, `nixpacks.toml`, `.env.example`.
3. Criar a estrutura do projeto novo `tamara-whatsapp-bot` (seção 3 abaixo).
4. Adaptar a Alma para ATENDIMENTO (não para postagem em X) — seção 5.
5. Inicializar git, criar o repo no GitHub do usuário (`bicalho743/tamara-whatsapp-bot`),
   fazer o push inicial.
6. Imprimir no final: a lista de variáveis de ambiente que o usuário precisa
   configurar no Railway, e os próximos passos manuais.

## 2. STACK

- Node.js >= 18, Express
- `openai` (brain da Tâmara)
- `axios` (chamadas HTTP — Supabase, Z-API)
- `node-telegram-bot-api` OU axios puro para Telegram (seguir o que o Tamara_bot usa)
- `dotenv`
- NÃO incluir: `twitter-api-v2`, `node-cron`, `mentions`/`twitter` modules.
  Este bot NÃO posta em lugar nenhum e NÃO roda cron. Ele é REATIVO: responde a
  requisições HTTP que chegam do Make.com.

## 3. ESTRUTURA DE PASTAS

```
tamara-whatsapp-bot/
├── src/
│   ├── index.js                 # servidor Express, registra rotas
│   ├── modules/
│   │   ├── brainLoader.js        # carrega a Alma de brain/ (adaptar do ref)
│   │   ├── openai.js             # gera resposta com contexto WhatsApp
│   │   ├── telegram.js           # notifica Solano em escalonamento
│   │   ├── supabase.js           # NOVO: lê/grava CRM via REST do Supabase
│   │   └── intencao.js           # NOVO: classifica intenção/sentimento/escalar
│   └── routes/
│       └── whatsapp.js           # POST /whatsapp + GET /health
├── brain/                        # a Alma adaptada para atendimento
│   └── (mesmos arquivos do ref, com conteúdo adaptado — ver seção 5)
├── package.json
├── railway.json
├── nixpacks.toml
├── .env.example
├── .gitignore
└── README.md
```

## 4. ENDPOINT PRINCIPAL — POST /whatsapp

O Make.com chama este endpoint. Contrato:

ENTRADA (JSON):
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
(historico vem do Supabase, array de objetos; pode vir vazio)

SAÍDA (JSON):
```json
{
  "resposta": "texto que será enviado ao cliente via Z-API",
  "intencao": "agendamento|preco|duvida|reclamacao|elogio|outro",
  "sentimento": "positivo|neutro|frustrado",
  "escalar": false
}
```

LÓGICA:
1. Receber mensagem + telefone + historico.
2. Formatar as últimas ~5 mensagens do historico como contexto.
3. Chamar openai.js passando: a Alma (system prompt) + histórico + mensagem atual.
4. O openai deve retornar resposta + classificação (intenção, sentimento, escalar).
5. Determinar `escalar=true` se QUALQUER um:
   - cliente demonstra frustração ("não funcionou", "péssimo", "absurdo", "errado")
   - cliente pede proposta personalizada
   - cliente escreve "humano" / "atendente" / "falar com alguém"
   - 3+ mensagens recebidas sem resolução (checar no histórico)
6. Retornar o JSON de saída.

GET /health → `{"status":"ok"}` (para validar o domínio Railway).

## 5. A ALMA (brain) — ADAPTAÇÃO

A Alma do repo de referência é a persona da Tâmara para POSTAR no X (perfil de
dicas e compras — tom público, conteúdo, engajamento). Aqui ela precisa virar a
persona de ATENDIMENTO no WhatsApp:

- Mantenha a ESSÊNCIA/voz da Tâmara (mesmo tom de marca, valores, jeito de falar).
- Mude o COMPORTAMENTO: de "criadora de conteúdo" para "atendente que acolhe,
  qualifica o lead, tira dúvidas e conduz para agendamento/proposta".
- O system prompt deve instruir o modelo a:
  - responder de forma curta e natural (é WhatsApp, não post)
  - identificar intenção e sentimento
  - sinalizar quando deve escalar para humano (Solano)
  - nunca inventar preços fechados — direcionar para cotação/atendente
  - respeitar o funil: lead_novo → qualificação → lead_quente → oportunidade

Preserve o MECANISMO de carregamento (brainLoader.js) — se o ref lê arquivos .md/.txt/.json
de brain/, faça igual. Só o CONTEÚDO muda.

## 6. INTEGRAÇÃO SUPABASE (src/modules/supabase.js)

O bot pode precisar consultar/gravar no CRM diretamente (além do que o Make já faz).
Por ora, implemente funções utilitárias prontas mas opcionais:
- `buscarContato(telefone)` → GET /rest/v1/contatos?telefone=eq.X
- `salvarMensagem({conteudo, direcao, telefone, intencao, sentimento})` → POST /rest/v1/mensagens
- `atualizarContato(telefone, campos)` → PATCH /rest/v1/contatos?telefone=eq.X

Auth: headers apikey + Authorization Bearer com SUPABASE_SERVICE_KEY.
Base URL: SUPABASE_URL.
(Observação: hoje o Make.com já faz a maior parte das gravações no CRM. Estas
funções existem para o bot poder enriquecer dados quando necessário. Deixe-as
implementadas mas não obrigatórias no fluxo principal.)

## 7. VARIÁVEIS DE AMBIENTE (.env.example)

```
PORT=3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_KEY=
TELEGRAM_BOT_TOKEN=8794106196:...   # já existe, do Solano
TELEGRAM_CHAT_ID=693420212          # já existe, do Solano
```
(NÃO colocar valores reais no .env.example, só os nomes. Os valores de Telegram
acima são só para o usuário saber quais usar — deixe vazios no arquivo de exemplo.)

## 8. DEPLOY (railway.json / nixpacks.toml)

Replicar o padrão do repo de referência (mesmo start command: `node src/index.js`,
engines node >=18). O Express deve escutar em `process.env.PORT`.

## 9. README.md

Incluir: o que o bot faz, o contrato do /whatsapp, como rodar local, as variáveis
de ambiente, e como conectar ao Railway + gerar domínio público.

## 10. AO FINAL, IMPRIMIR PARA O USUÁRIO

- Confirmação de que `Tamara_bot` (X) NÃO foi tocado.
- URL do novo repo criado.
- Lista das variáveis de ambiente a configurar no Railway.
- Passos manuais restantes:
  1. Railway → New Project → Deploy from GitHub → tamara-whatsapp-bot
  2. Configurar as variáveis de ambiente
  3. Settings → Networking → Generate Domain
  4. Copiar a URL pública → entregar ao usuário para colar no módulo 31 do Make
