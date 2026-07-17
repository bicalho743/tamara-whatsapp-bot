const OpenAI = require('openai');
const { getSystemPrompt } = require('./brainLoader');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Normaliza e formata o histórico de mensagens, suportando tanto o formato
 * simplificado de objeto quanto o formato completo retornado pelo Airtable.
 * Como o Airtable retorna em ordem decrescente (Data desc), inverte a ordem
 * para que o prompt receba em ordem cronológica (mais antiga para mais nova).
 */
function formatarHistorico(historico = []) {
  const records = Array.isArray(historico) ? historico : (historico.records || []);
  if (records.length === 0) return '';

  const mapeadas = records.map(item => {
    const fields = item.fields || item;
    const conteudo = fields.Conteúdo || fields.conteudo || fields.Content || '';
    const direcao = fields.Direção || fields.direcao || fields.Direction || 'recebida';
    if (!conteudo) return null;
    const remetente = direcao === 'recebida' ? 'Cliente' : 'Clara';
    return { remetente, conteudo, data: fields.Data || fields.data || '' };
  }).filter(Boolean);

  // Se vier ordenado do mais novo para o mais antigo, inverte para cronológico
  // A query do Airtable no Make ordena por "Data" desc, então o primeiro é o mais recente.
  mapeadas.reverse();

  // Pega as últimas 8 mensagens para dar contexto suficiente
  const ultimas = mapeadas.slice(-8);
  const linhas = ultimas
    .map(item => `${item.remetente}: ${item.conteudo}`)
    .join('\n');
  return `HISTÓRICO RECENTE DA CONVERSA:\n${linhas}\n\n`;
}

/**
 * Formata os dados de contato do CRM (Airtable) para serem injetados no prompt.
 */
function formatarDadosContato(contato = {}) {
  const fields = contato.fields || contato;
  const nome = fields.Nome || fields.nome || '';
  const etapaFunil = fields['Etapa Funil'] || fields.etapa_funil || fields.etapaFunil || 'lead_novo';
  const origem = fields.Origem || fields.origem || '';

  return { nome, etapaFunil, origem };
}

async function gerarRespostaAtendimento(mensagem, historico = [], contato = {}) {
  const contextoHistorico = formatarHistorico(historico);
  const dadosContato = formatarDadosContato(contato);

  const contextoContatoStr = `DADOS DO CLIENTE ATUAL (Histórico do CRM):
- Nome da Cliente: ${dadosContato.nome || 'Não identificado ainda'}
- Etapa Atual do Funil: ${dadosContato.etapaFunil}
- Origem do lead: ${dadosContato.origem || 'Não identificada'}
\n`;

  // User prompt = APENAS contexto, sem instruções de persona (isso está no system prompt)
  const userMessage = `${contextoContatoStr}${contextoHistorico}MENSAGEM ATUAL DA CLIENTE:
"${mensagem}"

INSTRUÇÕES DE SAÍDA:
1. Primeiro, escreva a resposta como Clara (assistente da Tâmara) escreveria no WhatsApp — curta, acolhedora, com personalidade. Se o Nome da cliente já estiver identificado nos "DADOS DO CLIENTE ATUAL", use-o para falar com ela de forma natural. Se ela se apresentar agora, retorne o nome em "dados_coletados.nome".
2. Siga as regras de QUALIFICAÇÃO CONVERSACIONAL do brain: identifique a etapa do funil e, quando for o momento certo, colete dados do lead de forma natural (máximo 1-2 perguntas por mensagem).
3. Retorne APENAS um JSON com estas chaves:
   - "resposta": o texto que será enviado à cliente (1-4 frases curtas, tom Clara)
   - "intencao": "agendamento" | "preco" | "duvida" | "reclamacao" | "elogio" | "outro"
   - "sentimento": "positivo" | "neutro" | "frustrado"
   - "escalar": true ou false (true se: frustração clara, pedido de proposta personalizada, pedido por humano/atendente, ou caso fora do escopo)
   - "etapa_funil": "lead_novo" | "qualificacao" | "lead_quente" | "oportunidade"
   - "dados_coletados": objeto com APENAS os dados que a cliente informou NESTA mensagem ou novos dados confirmados (chaves possíveis: nome, email, endereco_atual, endereco_destino, membros_familia, criancas, qtd_criancas, pets, qtd_pets, m2_atual, m2_destino, comodos, expectativa, origem). Se nenhum dado novo foi informado, retorne {} ou mantenha os existentes se confirmados.
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

