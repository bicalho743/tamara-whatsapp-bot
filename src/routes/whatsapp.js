const express = require('express');
const { gerarRespostaAtendimento } = require('../modules/openai');
const { deveEscalar } = require('../modules/intencao');
const { notificarEscalonamento } = require('../modules/telegram');
const { bufferizar } = require('../modules/messageBuffer');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.post('/whatsapp', async (req, res) => {
  console.log('[whatsapp] Requisição recebida. Body:', JSON.stringify(req.body, null, 2));
  const { mensagem, telefone, historico = [], contato = {}, primeiro_contato } = req.body;

  if (!mensagem || !telefone) {
    return res.status(400).json({ error: 'Campos "mensagem" e "telefone" são obrigatórios.' });
  }

  try {
    // Bufferiza a mensagem — aguarda debounce para consolidar mensagens rápidas
    const resultado_buffer = await bufferizar(telefone, mensagem, historico, contato, primeiro_contato === true);

    if (!resultado_buffer) {
      console.log(`[whatsapp] Mensagem de ${telefone} consolidada com outra em andamento.`);
      // Esta mensagem foi consolidada com outra — o primeiro request já está processando
      return res.json({
        resposta: null,
        consolidada: true,
        nota: 'Esta mensagem foi consolidada com outras mensagens recentes e será respondida em conjunto.'
      });
    }

    // Este é o request principal — processa a mensagem consolidada
    const { mensagemConsolidada, historico: historicoFinal, contato: contatoFinal, primeiro_contato: primeiroContatoFinal } = resultado_buffer;

    console.log(`[whatsapp] Processando resposta para ${telefone} com mensagem consolidada: "${mensagemConsolidada}"`);
    const resultado = await gerarRespostaAtendimento(mensagemConsolidada, historicoFinal, contatoFinal);
    const escalar = deveEscalar(mensagemConsolidada, historicoFinal, resultado.escalar);

    if (escalar) {
      console.log(`[whatsapp] Encaminhando escalonamento para o Telegram para o número ${telefone}`);
      await notificarEscalonamento({
        telefone,
        mensagem: mensagemConsolidada,
        intencao: resultado.intencao,
        sentimento: resultado.sentimento
      });
    }

    // Apresentação da Clara: APENAS quando primeiro_contato/primeiroContatoFinal for true
    let respostaFinal = resultado.resposta;
    if (primeiroContatoFinal === true) {
      respostaFinal = `Oi! Eu sou a Clara, assistente virtual da Tâmara Cavalcante. Vou te ajudar com as primeiras informações e, se precisar, te conecto direto com ela ou com o time.\n\n${resultado.resposta}`;
    }

    const resposta = {
      resposta: respostaFinal,
      intencao: resultado.intencao,
      sentimento: resultado.sentimento,
      escalar,
      etapa_funil: resultado.etapa_funil || 'lead_novo',
      dados_coletados: resultado.dados_coletados || {}
    };

    // Incluir dados de agendamento apenas quando existirem
    if (resultado.dados_agendamento) {
      resposta.dados_agendamento = resultado.dados_agendamento;
    }

    console.log(`[whatsapp] Resposta gerada com sucesso para ${telefone}:`, resposta);
    res.json(resposta);
  } catch (err) {
    console.error('[whatsapp] Erro crítico ao processar mensagem:', err);
    res.status(500).json({ error: 'Erro ao processar a mensagem.' });
  }
});

module.exports = router;

