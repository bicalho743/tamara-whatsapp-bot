const OpenAI = require('openai');
const { getSystemPrompt } = require('./brainLoader');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function formatarHistorico(historico = []) {
  const ultimas = historico.slice(-6);
  if (ultimas.length === 0) return '';
  const linhas = ultimas
    .map(item => `${item.direcao === 'recebida' ? 'Cliente' : 'Tâmara'}: ${item.conteudo}`)
    .join('\n');
  return `HISTÓRICO RECENTE DA CONVERSA:\n${linhas}\n\n`;
}

async function gerarRespostaAtendimento(mensagem, historico = []) {
  const contextoHistorico = formatarHistorico(historico);

  // User prompt = APENAS contexto, sem instruções de persona (isso está no system prompt)
  const userMessage = `${contextoHistorico}MENSAGEM ATUAL DA CLIENTE:
"${mensagem}"

INSTRUÇÕES DE SAÍDA:
1. Primeiro, escreva a resposta como Tâmara escreveria no WhatsApp — curta, acolhedora, com personalidade. Esta é a parte mais importante.
2. Siga as regras de QUALIFICAÇÃO CONVERSACIONAL do brain: identifique a etapa do funil e, quando for o momento certo, colete dados do lead de forma natural (máximo 1-2 perguntas por mensagem).
3. Retorne APENAS um JSON com estas chaves:
   - "resposta": o texto que será enviado à cliente (1-4 frases curtas, tom Tâmara)
   - "intencao": "agendamento" | "preco" | "duvida" | "reclamacao" | "elogio" | "outro"
   - "sentimento": "positivo" | "neutro" | "frustrado"
   - "escalar": true ou false (true se: frustração clara, pedido de proposta personalizada, pedido por humano/atendente, ou caso fora do escopo)
   - "etapa_funil": "lead_novo" | "qualificacao" | "lead_quente" | "oportunidade"
   - "dados_coletados": objeto com APENAS os dados que a cliente informou NESTA mensagem (chaves possíveis: nome, email, endereco_atual, endereco_destino, membros_familia, criancas, qtd_criancas, pets, qtd_pets, m2_atual, m2_destino, comodos, expectativa, origem). Se nenhum dado foi informado, retorne {}
   - "dados_agendamento": objeto com dados de agendamento SE a conversa estiver nesse fluxo (chaves: tipo_consulta, data_preferida, horario_preferido, agendamento_pronto). Se não houver fluxo de agendamento, não inclua este campo`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: getSystemPrompt('whatsapp') },
      { role: 'user', content: userMessage }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8
  });

  const resultado = JSON.parse(response.choices[0].message.content.trim());
  return resultado;
}

module.exports = { gerarRespostaAtendimento };

