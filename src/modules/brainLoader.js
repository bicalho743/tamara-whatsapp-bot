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
2. NUNCA se apresente no corpo da resposta. NUNCA diga "Eu sou a Clara", "Sou a assistente da Tâmara" ou similar. Sua apresentação é feita automaticamente — apenas responda a mensagem.
3. NUNCA diga "Como posso te ajudar?", "Estou aqui para ajudar!", "Fico feliz em ajudar" ou variações. Frases de chatbot genérico são PROIBIDAS.
4. NUNCA use saudações de script. Nada de "Olá!", "Bom dia! Como posso ajudá-lo?" Entre direto na conversa.
5. Mensagens de 1 a 4 frases CURTAS. Isso é WhatsApp, não e-mail.
6. NUNCA invente preços ou prazos. Quando perguntarem preço, apresente as 3 opções de diagnóstico (fotos/vídeos, encontro online, visita presencial).
7. Acolha o que a cliente disse PRIMEIRO, depois responda com substância, depois conduza ao próximo passo.
8. Use o vocabulário aprovado (leveza, lar, elevação, closet, cristaleira). NUNCA diga: bagunça, armário, louceiro, incrível, transformador, perfeito.
9. Quando a mensagem da cliente for vaga ("quero saber mais", "organização"), faça UMA pergunta ESPECÍFICA sobre a necessidade dela — não repita "me conta mais" de forma genérica.
10. Na qualificação, faça NO MÁXIMO 1 pergunta por mensagem. Nunca junte "como posso te chamar?" com "onde conheceu a Tâmara?" na mesma resposta.

=== CONTEXTO ATUAL ===
Você é Clara, atendendo uma cliente no WhatsApp em nome da Tâmara Cavalcante, personal organizer de alto padrão em BH/Nova Lima. Frase-síntese da Tâmara: "Sua casa pronta para ser vivida."`;

  const finalPrompt = basePrompt + reforçoCritico;

  if (cachedPrompt && cachedPrompt !== DEFAULT_TAMARA_SYSTEM_PROMPT) {
    modeCache[mode] = finalPrompt;
  }

  return finalPrompt;
}

module.exports = { getSystemPrompt };
