const OpenAI = require('openai');
const { getSystemPrompt } = require('./brainLoader');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function formatarHistorico(historico = []) {
  const ultimas = historico.slice(-5);
  return ultimas
    .map(item => `${item.direcao === 'recebida' ? 'Cliente' : 'Tâmara'}: ${item.conteudo}`)
    .join('\n');
}

async function gerarRespostaAtendimento(mensagem, historico = []) {
  const contextoHistorico = formatarHistorico(historico);

  const prompt = `${contextoHistorico ? `HISTÓRICO RECENTE DA CONVERSA:\n${contextoHistorico}\n\n` : ''}MENSAGEM ATUAL DA CLIENTE:\n"${mensagem}"

Responda como TÂMARA CAVALCANTE atendendo esta cliente no WhatsApp.

Retorne APENAS um objeto JSON com as chaves:
- "resposta": texto curto e natural para enviar à cliente via WhatsApp
- "intencao": uma destas exatas: "agendamento", "preco", "duvida", "reclamacao", "elogio", "outro"
- "sentimento": uma destas exatas: "positivo", "neutro", "frustrado"
- "escalar": true ou false — true se esta conversa precisa de atendimento humano (frustração clara, pedido de proposta personalizada, pedido explícito por humano/atendente, ou caso fora do que pode ser resolvido automaticamente)`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: getSystemPrompt('whatsapp') },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7
  });

  const resultado = JSON.parse(response.choices[0].message.content.trim());
  return resultado;
}

module.exports = { gerarRespostaAtendimento };
