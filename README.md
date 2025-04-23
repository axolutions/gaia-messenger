# Gaia Messenger API Documentation

## Overview
Gaia Messenger is a WhatsApp integration API built using whatsapp-web.js, providing a simple interface to send WhatsApp messages programmatically through a REST API.

## Installation

```bash
# Install dependencies
bun install

# Start the server
bun run index.ts
```

The API server runs on port 4000.

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

## Important Notes

1. The WhatsApp client uses local authentication, storing session data locally.
2. You need to scan the QR code only once per session.
3. The number format for sending messages must be in the format `{countrycode}{number}@c.us`, e.g., `5511999999999@c.us` for a Brazilian number.

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Success
- 400: Bad request (missing parameters)
- 500: Server error
