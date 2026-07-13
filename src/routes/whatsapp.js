const express = require('express');
const { gerarRespostaAtendimento } = require('../modules/openai');
const { deveEscalar } = require('../modules/intencao');
const { notificarEscalonamento } = require('../modules/telegram');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.post('/whatsapp', async (req, res) => {
  const { mensagem, telefone, historico = [] } = req.body;

  if (!mensagem || !telefone) {
    return res.status(400).json({ error: 'Campos "mensagem" e "telefone" são obrigatórios.' });
  }

  try {
    const resultado = await gerarRespostaAtendimento(mensagem, historico);
    const escalar = deveEscalar(mensagem, historico, resultado.escalar);

    if (escalar) {
      await notificarEscalonamento({
        telefone,
        mensagem,
        intencao: resultado.intencao,
        sentimento: resultado.sentimento
      });
    }

    // Na primeira mensagem (sem histórico), identifica como assistente virtual
    let respostaFinal = resultado.resposta;
    if (historico.length === 0) {
      respostaFinal = `Oi! Eu sou a Clara, assistente virtual da Tâmara Cavalcante. Vou te ajudar com as primeiras informações e, se precisar, te conecto direto com ela ou com o time.\n\n${resultado.resposta}`;
    }

    res.json({
      resposta: respostaFinal,
      intencao: resultado.intencao,
      sentimento: resultado.sentimento,
      escalar,
      etapa_funil: resultado.etapa_funil || 'lead_novo',
      dados_coletados: resultado.dados_coletados || {}
    });
  } catch (err) {
    console.error('[whatsapp] Erro ao processar mensagem:', err.message);
    res.status(500).json({ error: 'Erro ao processar a mensagem.' });
  }
});

module.exports = router;
