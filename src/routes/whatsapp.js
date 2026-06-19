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

    res.json({
      resposta: resultado.resposta,
      intencao: resultado.intencao,
      sentimento: resultado.sentimento,
      escalar
    });
  } catch (err) {
    console.error('[whatsapp] Erro ao processar mensagem:', err.message);
    res.status(500).json({ error: 'Erro ao processar a mensagem.' });
  }
});

module.exports = router;
