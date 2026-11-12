require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del scheduler (cron) - ejemplo: cada día a las 09:00
cron.schedule('0 9 * * *', async () => {
  console.log('Ejecutando recopilación y filtrado diario...');
  try {
    const info = await obtenerYFiltrarInfo();
    await enviarATelegram(info);
    console.info('Información enviada a Telegram.');
  } catch (err) {
    console.error('Error en el proceso:', err);
  }
});

// Función que usa IA gratuita de OpenRouter para filtrar hardware/software/IA
async function obtenerYFiltrarInfo() {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nano:free', // modelo gratuito y ligero
      messages: [
        {
          role: 'user',
          content: 'Extrae únicamente los datos relevantes sobre hardware, software e inteligencia artificial de las siguientes fuentes (simuladas). Devuelve un JSON compacto con arrays: hardware, software, ia. No incluyas comentarios ni texto extra.',
        }
      ],
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  // Parsear la respuesta del modelo (asumiendo JSON válido)
  const content = data.choices?.[0]?.message?.content || '[]';
  try {
    return JSON.parse(content);
  } catch {
    return { hardware: [], software: [], ia: [] };
  }
}

// Función para enviar mensaje a Telegram
async function enviarATelegram(mensaje) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const text = `🛠️ Hardware:\n${mensaje.hardware.join(', ')}\n\n💻 Software:\n${mensaje.software.join(', ')}\n\n🤖 IA:\n${mensaje.ia.join(', ')}`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text,
    }),
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = { obtenerYFiltrarInfo, enviarATelegram };