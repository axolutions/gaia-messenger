# Gaia Messenger API Documentation

## Overview
Gaia Messenger is a WhatsApp integration API built using whatsapp-web.js, providing a simple interface to send WhatsApp messages programmatically through a REST API.

## Installation

```bash
# Install dependencies
bun install

# Configure environment variables
cp .env.example .env
# Edit .env file with your settings

# Start the server
bun run index.ts
```

The API server runs on port 4000 by default (configurable in .env).

## Configuration

Create a .env file with the following variables:

```
# Server configuration
PORT=4000

# Webhook configuration
WEBHOOK_URL=http://localhost:3000/api/webhook/whatsapp
```

## API Reference

### Authentication Flow
1. Start the server
2. Use the `/connect` endpoint to get a QR code
3. Scan the QR code with WhatsApp mobile app
4. Check connection status with `/status` endpoint
5. Once connected, you can send messages

### Endpoints

#### 1. Send a WhatsApp Message

**Endpoint:** `POST /send-message`

**Description:** Sends a text message to a specified WhatsApp number.

**Request Body:**
```json
{
  "to": "123456789@c.us",
  "message": "Hello from Gaia Messenger!"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| to | string | Yes | WhatsApp ID in format `{number}@c.us` |
| message | string | Yes | Text message to send |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso."
}
```

**Error Responses:**
- 400: Missing required fields
```json
{
  "error": "Os campos \"to\" e \"message\" são obrigatórios."
}
```
- 500: Server error
```json
{
  "error": "Falha ao enviar a mensagem."
}
```

#### 2. Get QR Code for Authentication

**Endpoint:** `GET /connect`

**Description:** Returns a QR code data URL to authenticate with WhatsApp.

**Success Response (200):**
```json
{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Error Response (400):**
```json
{
  "error": "QR Code ainda não gerado. Tente novamente em alguns segundos."
}
```

#### 3. Check Connection Status

**Endpoint:** `GET /status`

**Description:** Checks if the API is connected to WhatsApp.

**Response (200):**
```json
{
  "connected": true
}
```

### 4. Webhook for Incoming Messages

**Description:** Automatically forwards all incoming WhatsApp messages to a webhook.

**Webhook URL:** Configured in the .env file (`WEBHOOK_URL`)

**Request Method:** POST

**Payload sent to webhook:**
```json
{
  "messageId": "ABCDEFG123456789",
  "from": "5511999999999@c.us",
  "to": "5511888888888@c.us",
  "body": "Hello, how are you?",
  "timestamp": 1677489369,
  "chatId": "5511999999999@c.us",
  "chatName": "John Doe",
  "history": [
    {
      "id": "ABCDEFG123456789",
      "from": "5511999999999@c.us",
      "body": "Hello, how are you?",
      "timestamp": 1677489369
    },
    {
      "id": "HIJKLMN987654321",
      "from": "5511888888888@c.us",
      "body": "I'm fine, thanks!",
      "timestamp": 1677489300
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| messageId | Unique identifier of the received message |
| from | WhatsApp ID of the sender |
| to | WhatsApp ID of the recipient |
| body | Content of the message |
| timestamp | Unix timestamp when the message was sent |
| chatId | ID of the chat/conversation |
| chatName | Name of the contact/group |
| history | Array of the last 10 messages in the conversation |

## Important Notes

1. The WhatsApp client uses local authentication, storing session data locally.
2. You need to scan the QR code only once per session.
3. The number format for sending messages must be in the format `{countrycode}{number}@c.us`, e.g., `5511999999999@c.us` for a Brazilian number.
4. To receive webhooks, you must have a server listening on the configured webhook URL (set in the .env file).

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Success
- 400: Bad request (missing parameters)
- 500: Server error
