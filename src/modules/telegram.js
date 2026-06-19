const axios = require('axios');

async function notificarEscalonamento({ telefone, mensagem, intencao, sentimento }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID não configurados — notificação ignorada.');
    return;
  }

  const texto =
    `🚨 *Escalonamento — atendimento WhatsApp*\n\n` +
    `*Telefone:* ${telefone}\n` +
    `*Intenção:* ${intencao}\n` +
    `*Sentimento:* ${sentimento}\n\n` +
    `*Mensagem da cliente:*\n"${mensagem}"`;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: texto,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error('[Telegram] Erro ao notificar:', err.message);
  }
}

module.exports = { notificarEscalonamento };
