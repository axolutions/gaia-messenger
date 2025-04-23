const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const cors = require('cors'); // Import CORS

const app = express();
const port = 4000; // Porta do servidor
let qrCodeData = null;
let isConnected = false;

// Inicializa o WhatsApp Client com autenticação local
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true } // Define se o navegador será visível ou não
});

app.use(cors());
// Middleware para JSON
app.use(express.json());

// Evento quando o QR Code for gerado
client.on('qr', (qr) => {
    console.log('\n🔹 Escaneie este QR Code para autenticar:');
    qrCodeData = qr;
    qrcode.toString(qr, { type: 'terminal', small: true }, (err, url) => {
        if (err) {
            console.error('❌ Erro ao gerar QR Code no terminal:', err);
        } else {
            console.log(url);
        }
    });
});

// Evento quando o cliente for autenticado
client.on('authenticated', () => {
    console.log('✅ Cliente autenticado com sucesso!');
});

// Evento quando o cliente estiver pronto para uso
client.on('ready', () => {
    console.log('🚀 Cliente do WhatsApp pronto para uso!');
    isConnected = true;

    // Só inicia o servidor Express depois que o WhatsApp estiver pronto
});

   app.listen(port, () => {
        console.log(`🌐 API rodando em http://localhost:${port}`);
    });

// Evento de desconexão
client.on('disconnected', () => {
    console.log('⚠️ Cliente desconectado!');
    isConnected = false;
});

// Endpoint para enviar mensagens
app.post('/send-message', async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'Os campos "to" e "message" são obrigatórios.' });
    }

    try {
        const chat = await client.getChatById(to);
        await chat.sendMessage(message);
        res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso.' });
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Falha ao enviar a mensagem.' });
    }
});

// Endpoint para obter o QR Code
app.get('/connect', async (req, res) => {
    if (!qrCodeData) {
        return res.status(400).json({ error: 'QR Code ainda não gerado. Tente novamente em alguns segundos.' });
    }
    const qrCodeImage = await qrcode.toDataURL(qrCodeData);
    res.json({ qrCode: qrCodeImage });
});

// Endpoint para verificar o status do WhatsApp
app.get('/status', (req, res) => {
    res.json({ connected: isConnected });
});

// Inicializa o cliente do WhatsApp
client.initialize();