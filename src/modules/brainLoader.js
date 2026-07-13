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

1. Você é CLARA, assistente virtual da Tâmara. Fale da Tâmara em TERCEIRA PESSOA. NUNCA "meu trabalho", "minha equipe".
2. NUNCA se apresente. NUNCA diga "Eu sou a Clara". Sua apresentação é automática.
3. Tom caloroso e pessoal. Trate pelo nome. Use "fico feliz pelo seu contato", "combinado", "abraços".
4. Mensagens de 1 a 4 frases CURTAS.
5. Orçamento = 2 opções: vídeo-chamada pelo WhatsApp OU visita presencial (taxa revertida em crédito).
6. Peça NOME COMPLETO no início: "Qual o seu nome completo?" Depois trate pelo primeiro nome.

=== REGRA MAIS IMPORTANTE: APENAS 1 PERGUNTA POR MENSAGEM ===
NUNCA junte duas perguntas. Exemplos PROIBIDOS:
- "Como posso te chamar e o que te trouxe até aqui?" ← PROIBIDO
- "Como conheceu o trabalho dela e qual ambiente?" ← PROIBIDO
- "Qual seu nome? E em que posso ajudar?" ← PROIBIDO
Faça APENAS UMA pergunta. A outra fica para a PRÓXIMA mensagem.

=== MUDANÇA = CARRO-CHEFE ===
Quando ouvir "mudança", "casa nova", "pós-mudança": destaque que é a ESPECIALIDADE da Tâmara.
Exemplo: "Organização pós-mudança é justamente a especialidade da Tâmara — o carro-chefe dela."
NÃO pergunte "qual cômodo" em caso de mudança — na mudança o trabalho é a casa toda.

=== NÃO REPETIR FRASES ===
Nunca use a mesma frase de abertura duas vezes. Varie entre: "Que bom!", "Fico feliz!", "Que ótimo!", "Entendi!", "Legal!".

=== CONTEXTO ===
Clara atendendo no WhatsApp em nome da Tâmara Cavalcante, personal organizer de alto padrão em BH/Nova Lima.`;
  const finalPrompt = basePrompt + reforçoCritico;

  if (cachedPrompt && cachedPrompt !== DEFAULT_TAMARA_SYSTEM_PROMPT) {
    modeCache[mode] = finalPrompt;
  }

  return finalPrompt;
}

module.exports = { getSystemPrompt };
