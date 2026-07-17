/**
 * Buffer de mensagens por telefone.
 * Quando várias mensagens chegam do mesmo número em sequência rápida,
 * acumula todas e processa como uma única mensagem consolidada.
 */

// Map<telefone, { mensagens: string[], historico: any[], contato: any, primeiro_contato: boolean, timer: NodeJS.Timeout, resolve: Function }>
const buffers = new Map();

// Tempo de espera em ms antes de consolidar as mensagens (padrão: 3 segundos)
const DEBOUNCE_MS = parseInt(process.env.MESSAGE_BUFFER_MS, 10) || 3000;

/**
 * Adiciona uma mensagem ao buffer do telefone.
 * Retorna uma Promise que resolve quando o debounce expirar,
 * com as mensagens consolidadas.
 * 
 * @param {string} telefone - Número do telefone da cliente
 * @param {string} mensagem - Texto da mensagem
 * @param {Array} historico - Histórico da conversa
 * @param {Object} contato - Dados atuais do contato do Airtable
 * @param {boolean} primeiro_contato - Indica se é a primeira interação do contato
 * @returns {Promise<{ mensagemConsolidada: string, historico: Array, contato: Object, primeiro_contato: boolean } | null>}
 *   Retorna os dados consolidados para quem deve processar,
 *   ou null para quem deve ignorar (mensagem já será processada por outro request).
 */
function bufferizar(telefone, mensagem, historico = [], contato = {}, primeiro_contato = false) {
  return new Promise((resolve) => {
    if (buffers.has(telefone)) {
      // Já existe buffer para este telefone — adiciona mensagem e reseta timer
      const buffer = buffers.get(telefone);
      buffer.mensagens.push(mensagem);
      // Usa o histórico e contato mais recentes
      buffer.historico = historico;
      buffer.contato = contato;
      if (primeiro_contato) {
        buffer.primeiro_contato = true;
      }

      // Cancela o timer anterior e cria um novo
      clearTimeout(buffer.timer);
      buffer.timer = setTimeout(() => dispararBuffer(telefone), DEBOUNCE_MS);

      // Quem chegou depois aguarda mas receberá null (não deve processar)
      buffer.waiters.push(resolve);
    } else {
      // Primeira mensagem deste telefone — cria buffer novo
      const buffer = {
        mensagens: [mensagem],
        historico,
        contato,
        primeiro_contato,
        timer: setTimeout(() => dispararBuffer(telefone), DEBOUNCE_MS),
        principal: resolve, // O primeiro request é quem vai processar
        waiters: []         // Requests subsequentes receberão null
      };
      buffers.set(telefone, buffer);
    }
  });
}

/**
 * Disparado quando o debounce expira.
 * Consolida as mensagens e resolve as Promises.
 */
function dispararBuffer(telefone) {
  const buffer = buffers.get(telefone);
  if (!buffer) return;

  buffers.delete(telefone);

  // Consolida todas as mensagens em uma só
  const mensagemConsolidada = buffer.mensagens.join('\n');

  console.log(
    `[messageBuffer] Consolidando ${buffer.mensagens.length} mensagem(ns) de ${telefone}: "${mensagemConsolidada}"`
  );

  // O request principal recebe os dados para processar
  buffer.principal({
    mensagemConsolidada,
    historico: buffer.historico,
    contato: buffer.contato,
    primeiro_contato: buffer.primeiro_contato
  });

  // Os requests subsequentes recebem null (não devem processar)
  for (const waiter of buffer.waiters) {
    waiter(null);
  }
}

module.exports = { bufferizar };
