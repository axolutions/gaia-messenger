const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const cors = require('cors'); // Import CORS
const axios = require('axios'); // Add axios for webhook requests
// Load environment variables
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000; // Use PORT from env or default to 4000
const webhookUrl = process.env.WEBHOOK_URL; // Get webhook URL from environment variables
let qrCodeData = null;
let isConnected = false;

// Inicializa o WhatsApp Client com autenticação local
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
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

// Evento para receber mensagens e enviar para o webhook
client.on('message', async (message) => {
    try {
        // Obter informações do chat
        const chat = await message.getChat();

        // Buscar as mensagens do histórico (fetchMessages retorna as mensagens, não as adiciona ao chat)
        const messages = await chat.fetchMessages({ limit: 10 });

        // Preparar dados para enviar ao webhook
        const webhookData = {
            messageId: message.id._serialized,
            from: message.from,
            to: message.to,
            body: message.body,
            timestamp: message.timestamp,
            chatId: chat.id._serialized,
            chatName: chat.name,
            history: messages.map(msg => ({
                id: msg.id._serialized,
                from: msg.from,
                body: msg.body,
                timestamp: msg.timestamp
            }))
        };

        console.log(`📤 Enviando mensagem recebida para webhook: ${webhookUrl}`);
        if (webhookUrl) {
            await axios.post(webhookUrl, webhookData);
        } else {
            console.warn('⚠️ WEBHOOK_URL não definida no arquivo .env');
        }

    } catch (error) {
        console.error('❌ Erro ao processar mensagem para webhook:', error);
    }
});

app.listen(port, () => {
    console.log(`🌐 API rodando em http://localhost:${port}`);
});

// Evento de desconexão
client.on('disconnected', () => {
    console.log('⚠️ Cliente desconectado!');
    isConnected = false;
    qrCodeData = null;
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

// Endpoint para desconectar a sessão atual e permitir novo login
app.post('/disconnect', async (req, res) => {
    try {
        console.log('🔄 Desconectando sessão WhatsApp atual...');

        // Desconectar cliente atual
        await client.logout();

        // Reinicializar cliente para gerar novo QR code
        setTimeout(() => {
            console.log('🔄 Reiniciando cliente WhatsApp...');
            client.initialize();
        }, 1000);

        res.json({ success: true, message: 'Sessão desconectada com sucesso. Um novo QR code será gerado.' });
    } catch (error) {
        console.error('❌ Erro ao desconectar sessão:', error);

        // Mesmo com erro, tentar forçar a reinicialização
        isConnected = false;
        qrCodeData = null;

        setTimeout(() => {
            console.log('🔄 Tentando reiniciar cliente após erro...');
            client.initialize();
        }, 1000);

        res.status(500).json({
            error: 'Erro ao desconectar, mas um novo QR code será gerado mesmo assim.',
            success: true
        });
    }
});

// Inicializa o cliente do WhatsApp
client.initialize();