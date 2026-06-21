const PALAVRAS_FRUSTRACAO = ['não funcionou', 'pessimo', 'péssimo', 'absurdo', 'errado'];
const PALAVRAS_HUMANO = ['humano', 'atendente', 'falar com alguém', 'falar com alguem'];
const PALAVRAS_PROPOSTA_PERSONALIZADA = ['proposta personalizada', 'orçamento personalizado', 'orcamento personalizado'];

function normalizar(texto = '') {
  return texto.toLowerCase();
}

function contemAlguma(texto, palavras) {
  const normalizado = normalizar(texto);
  return palavras.some(palavra => normalizado.includes(palavra));
}

function mensagensRecebidasSemResolucao(historico = []) {
  if (historico.length < 2) return false;

  // Contamos quantas mensagens consecutivas 'recebida' existem no final do histórico
  let consecutivas = 0;
  for (let i = historico.length - 1; i >= 0; i--) {
    if (historico[i].direcao === 'recebida') {
      consecutivas++;
    } else {
      break;
    }
  }

  // Se já existem 2 mensagens consecutivas do cliente no histórico,
  // e o cliente está mandando mais uma agora, isso completa 3+ consecutivas sem resposta.
  return consecutivas >= 2;
}

function deveEscalar(mensagem, historico, escalarSugeridoPeloModelo) {
  if (escalarSugeridoPeloModelo) return true;
  if (contemAlguma(mensagem, PALAVRAS_FRUSTRACAO)) return true;
  if (contemAlguma(mensagem, PALAVRAS_HUMANO)) return true;
  if (contemAlguma(mensagem, PALAVRAS_PROPOSTA_PERSONALIZADA)) return true;
  if (mensagensRecebidasSemResolucao(historico)) return true;
  return false;
}

module.exports = { deveEscalar };
