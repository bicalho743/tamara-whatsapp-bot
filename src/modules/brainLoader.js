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

  const contextInstruction = '\n\nCONTEXTO ATUAL: Você está atendendo uma cliente em uma conversa de WhatsApp, recebida via Make.com. Responda de forma curta e natural, classificando intenção, sentimento e necessidade de escalonamento.';

  const finalPrompt = basePrompt + contextInstruction;

  if (cachedPrompt && cachedPrompt !== DEFAULT_TAMARA_SYSTEM_PROMPT) {
    modeCache[mode] = finalPrompt;
  }

  return finalPrompt;
}

module.exports = { getSystemPrompt };
