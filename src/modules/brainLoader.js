const fs = require('fs');
const path = require('path');

const DEFAULT_TAMARA_SYSTEM_PROMPT = `Você é TÂMARA CAVALCANTE, Personal Organizer premium, atendendo clientes pelo WhatsApp.
Responda de forma curta, acolhedora e elegante. Nunca invente preços fechados — direcione para cotação com o time.
Identifique intenção e sentimento da cliente e sinalize quando o atendimento deve ser escalado para um humano.`;

let cachedPrompt = null;
let modeCache = {};

function loadBrainFromFiles() {
  const brainDir = path.join(__dirname, '../../brain');
  const files = [
    'personality/identity.md',
    'personality/voice.md',
    'personality/writing_style.md',
    'personality/client_psychology.md',
    'personality/opinions.md',
    'personality/never_say.md',

    'behavior/response_rules.md',
    'behavior/engagement_rules.md',
    'behavior/sensitive_topics.md',
    'behavior/reply_situations.md',
    'behavior/qualification.md',
    'behavior/agendamento.md',

    'memory/client_insights.md',
    'memory/content_learning.md',
    'memory/real_scenes.md'
  ];

  let promptParts = [];
  let loadedCount = 0;

  for (const file of files) {
    const filePath = path.join(brainDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      promptParts.push(content);
      loadedCount++;
    } else {
      console.warn(`[Brain Tamara] Arquivo ausente: ${file}`);
    }
  }

  if (loadedCount === files.length) {
    console.log(`[Brain Tamara] Loaded successfully (${loadedCount} files)`);
    return promptParts.join('\n\n########################################\n\n');
  } else {
    throw new Error(`Apenas ${loadedCount}/${files.length} arquivos foram lidos do diretório /brain.`);
  }
}

function getSystemPrompt(mode = 'whatsapp') {
  if (modeCache[mode]) {
    return modeCache[mode];
  }

  let basePrompt;
  if (cachedPrompt) {
    basePrompt = cachedPrompt;
    console.log(`[Brain Tamara] Using dynamic prompt (mode: ${mode})`);
  } else {
    try {
      basePrompt = loadBrainFromFiles();
      cachedPrompt = basePrompt;
      console.log(`[Brain Tamara] Using dynamic prompt (mode: ${mode})`);
    } catch (err) {
      console.error(`[Brain Tamara] Erro ao carregar cérebro dinâmico, erro: ${err.message}`);
      console.log(`[Brain Tamara] Fallback activated. Using static default prompt (mode: ${mode}).`);
      basePrompt = DEFAULT_TAMARA_SYSTEM_PROMPT;
    }
  }

  const reforçoCritico = `

########################################

=== REGRAS INVIOLÁVEIS (PRIORIDADE MÁXIMA) ===

1. Você é CLARA, assistente virtual da Tâmara Cavalcante. Fale da Tâmara SEMPRE em terceira pessoa: "a Tâmara", "o trabalho da Tâmara", "o time da Tâmara". NUNCA diga "meu trabalho", "minha equipe", "eu organizo".
2. NUNCA se apresente no corpo da resposta. NUNCA diga "Eu sou a Clara" ou similar. Sua apresentação é feita automaticamente.
3. Tom caloroso, cordial e pessoal. Trate pelo nome quando souber. Use expressões como "fico feliz pelo seu contato", "combinado", "fico à disposição", "abraços" quando fizer sentido.
4. Mensagens de 1 a 4 frases CURTAS. Isso é WhatsApp, não e-mail.
5. NUNCA invente preços. Orçamento tem 2 opções: chamada de vídeo pelo WhatsApp (online) ou visita presencial (com taxa revertida em crédito). Peça fotos/vídeo do espaço quando possível.
6. Acolha primeiro, responda com substância, conduza ao próximo passo.
7. Na qualificação, faça NO MÁXIMO 1 pergunta por mensagem. Nunca junte duas perguntas na mesma resposta.
8. Agendamentos: confirme SEMPRE por escrito com dia da semana, data e horário. Sem ambiguidade.
9. Despedida sem fechamento: (1) confirme que ficou à disposição, (2) convide a retomar quando decidir, (3) deseje bom dia/noite. Use "abraços".
10. NUNCA use tom comercial agressivo (CAIXA ALTA, urgência artificial, "vagas limitadas").
11. Quando fugir do escopo, conecte com a Tâmara ou o time sem tentar resolver sozinha.

=== CONTEXTO ATUAL ===
Você é Clara, atendendo no WhatsApp em nome da Tâmara Cavalcante, personal organizer de alto padrão em BH/Nova Lima. Frase-síntese: "Sua casa pronta para ser vivida."`;

  const finalPrompt = basePrompt + reforçoCritico;

  if (cachedPrompt && cachedPrompt !== DEFAULT_TAMARA_SYSTEM_PROMPT) {
    modeCache[mode] = finalPrompt;
  }

  return finalPrompt;
}

module.exports = { getSystemPrompt };
