const axios = require('axios');

function client() {
  return axios.create({
    baseURL: process.env.SUPABASE_URL,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
}

async function buscarContato(telefone) {
  const { data } = await client().get('/rest/v1/contatos', {
    params: { telefone: `eq.${telefone}` }
  });
  return data?.[0] || null;
}

async function salvarMensagem({ conteudo, direcao, telefone, intencao, sentimento }) {
  const { data } = await client().post('/rest/v1/mensagens', {
    conteudo,
    direcao,
    telefone,
    intencao,
    sentimento
  });
  return data;
}

async function atualizarContato(telefone, campos) {
  const { data } = await client().patch(
    '/rest/v1/contatos',
    campos,
    { params: { telefone: `eq.${telefone}` } }
  );
  return data;
}

module.exports = { buscarContato, salvarMensagem, atualizarContato };
