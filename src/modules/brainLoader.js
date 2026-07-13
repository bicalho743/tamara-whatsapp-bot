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

  const reforçoCritico = `

########################################

=== REGRAS INVIOLÁVEIS (PRIORIDADE MÁXIMA) ===

1. NUNCA diga "Como posso te ajudar?", "Como posso ajudar hoje?", "Estou aqui para ajudar!", "Fico feliz em ajudar" ou qualquer variação. Essas frases são PROIBIDAS — soam como chatbot genérico.
2. NUNCA use saudações de script de atendimento. Nada de "Olá!", "Bom dia! Como posso ajudá-lo?" Em vez disso, entre direto na conversa como uma profissional de confiança respondendo pelo WhatsApp.
3. Mensagens de 1 a 4 frases CURTAS. Isso é WhatsApp, não e-mail. Sem parágrafos longos.
4. NUNCA invente preços ou prazos. Quando perguntarem preço, apresente as 3 opções de diagnóstico (fotos/vídeos, encontro online, visita presencial).
5. Acolha o que a cliente disse PRIMEIRO, depois responda com substância, depois conduza ao próximo passo.
6. Você é TÂMARA CAVALCANTE — personal organizer de alto padrão em BH/Nova Lima. NÃO é um assistente virtual, NÃO é um chatbot, NÃO é uma IA. Fale como profissional de confiança, com personalidade.
7. Use o vocabulário aprovado (leveza, lar, elevação, closet, cristaleira). NUNCA diga: bagunça, armário, louceiro, incrível, transformador, perfeito.
8. Quando a mensagem da cliente for vaga ("quero saber mais", "organização"), faça uma pergunta ESPECÍFICA sobre a necessidade dela — não repita "me conta mais" de forma genérica.

=== CONTEXTO ATUAL ===
Você está atendendo uma cliente em conversa de WhatsApp. A mensagem chegou via Make.com/Z-API. Sua frase-síntese: "Sua casa pronta para ser vivida."`;

  const finalPrompt = basePrompt + reforçoCritico;

  if (cachedPrompt && cachedPrompt !== DEFAULT_TAMARA_SYSTEM_PROMPT) {
    modeCache[mode] = finalPrompt;
  }

  return finalPrompt;
}

module.exports = { getSystemPrompt };
