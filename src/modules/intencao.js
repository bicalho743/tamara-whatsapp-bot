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
  const recebidas = historico.filter(item => item.direcao === 'recebida');
  return recebidas.length >= 3;
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
