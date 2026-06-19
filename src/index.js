require('dotenv').config();
const express = require('express');
const whatsappRoutes = require('./routes/whatsapp');

const app = express();
app.use(express.json());
app.use(whatsappRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[TAMARA-WHATSAPP] Servidor HTTP ativo na porta ${port}`);
});
