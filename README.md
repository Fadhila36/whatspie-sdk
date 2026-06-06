<div align="center">
  <h1>📱 Whatspie SDK</h1>
  <p><strong>The unofficial, universal TypeScript client for WhatsApp API via <a href="https://whatspie.com">Whatspie</a>.</strong></p>
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![Edge Compatible](https://img.shields.io/badge/Edge-Compatible-success.svg)](#)
</div>

---

A robust, zero-dependency Node.js and Edge-compatible SDK to seamlessly integrate WhatsApp messaging capabilities into your applications. Manage devices, verify contacts, and send rich media messages with full TypeScript safety.

## ✨ Why Choose Whatspie SDK?

Built with modern engineering standards, designed for scale:

- 🚀 **Universal & Edge-Ready**: Built natively on the `fetch` API. It runs flawlessly on Node.js (v18+), Cloudflare Workers, Vercel Edge, Deno, and Bun. No bloated `axios` dependencies.
- 🛡️ **End-to-End Type Safety**: Written entirely in TypeScript. Enjoy robust autocomplete in your IDE for all request payloads and API responses.
- ♻️ **Smart Resilience**: Built-in exponential backoff. The SDK automatically intercepts `429 Too Many Requests` and retries failed network calls gracefully.
- 🎯 **Advanced Error Handling**: Stop guessing what went wrong. We map raw HTTP errors into explicit classes like `WhatspieValidationError` and `WhatspieRateLimitError` for precise `try/catch` flows.

---

## 📦 Installation

Install the package via your favorite package manager:

```bash
# Using npm
npm install whatspie-sdk

# Using yarn
yarn add whatspie-sdk

# Using pnpm
pnpm add whatspie-sdk
```

---

## 🚀 Quick Start

Here's how to get up and running in less than 2 minutes.

### 1. Initialize the Client

The SDK is incredibly flexible. You can initialize it with zero configuration (by leveraging environment variables), or pass your settings explicitly.

```typescript
import { WhatspieClient } from 'whatspie-sdk';

// Option A: Zero-config (Automatically reads process.env.WHATSPIE_TOKEN)
const client = new WhatspieClient();

// Option B: Explicit configuration
const customClient = new WhatspieClient({ 
  token: 'YOUR_API_TOKEN', 
  logger: process.env.NODE_ENV !== 'production' // Enable internal logs during development
});
```

### 2. Send Your First Message

The SDK provides a clean, asynchronous interface for all messaging types. 

```typescript
async function sendWelcomeMessage() {
  const deviceId = '6285123456789'; // Your registered Whatspie Device ID
  const receiver = '6289876543210'; // The recipient's phone number (International format)

  try {
    // 💬 Send a simple text
    await client.messages.sendText(deviceId, receiver, 'Hello from Whatspie SDK!');
    
    // 📸 Send an image with a caption
    await client.messages.sendImage(
      deviceId, 
      receiver, 
      'https://example.com/image.jpg', 
      'Look at this amazing photo!'
    );

    // 📍 Send a geographic location
    await client.messages.sendLocation(deviceId, receiver, -6.200000, 106.816666);

    console.log('All messages were dispatched successfully!');

  } catch (error) {
    console.error('Failed to dispatch message:', error);
  }
}

sendWelcomeMessage();
```

---

## 🛡️ Robust Error Handling

For production applications, it's crucial to know *why* a request failed. The SDK throws highly specific Error classes that you can easily catch using the `instanceof` operator.

```typescript
import { 
  WhatspieRateLimitError, 
  WhatspieValidationError,
  WhatspieAuthenticationError 
} from 'whatspie-sdk';

try {
  await client.messages.sendText(deviceId, receiver, 'Hello!');
} catch (error) {
  if (error instanceof WhatspieRateLimitError) {
    // Gracefully handle rate limits using the parsed Retry-After header
    console.warn(`Rate limit hit! Please wait ${error.retryAfter} seconds before trying again.`);
  } else if (error instanceof WhatspieValidationError) {
    // Handle bad payloads (e.g., missing or invalid parameters)
    console.error('Validation failed. Please check your parameters:', error.data);
  } else if (error instanceof WhatspieAuthenticationError) {
    // Handle invalid or expired API tokens
    console.error('Critical Authorization Error: Invalid API Token.');
  } else {
    // Generic fallback for unexpected network or server errors
    console.error('An unexpected error occurred:', error.message);
  }
}
```

---

## 📚 API Reference Overview

The client organizes API endpoints into logical namespaces (*modules*), making it highly intuitive to navigate.

### `client.devices`
- `list()`: Fetch all devices registered to your account.

### `client.messages`
- `sendText(...)`: Send standard text messages.
- `sendImage(...)`: Send images with optional captions.
- `sendVideo(...)`: Send video files (.mp4).
- `sendFile(...)`: Send raw documents (PDF, DOCX, ZIP).
- `sendLocation(...)`: Send interactive map locations using Latitude and Longitude.

### `client.contacts`
- `check({ device, phones })`: Verify if an array of phone numbers are actively registered on WhatsApp.

### `client.groups`
- `list(device)`: Fetch all groups your device is a member of.
- `get(device, groupId)`: Get detailed information about a specific group.
- `update(payload)`: Update group metadata (subject, description, profile picture).
- `addMembers(payload)`: Add new participants to an existing group.

### `client.webhooks`
- `set(payload)`: Register a webhook URL to listen for incoming messages.
- `remove(device)`: Delete the active webhook configuration for a specific device.

---

## ⚙️ Advanced Configuration

You can fully customize the client's internal HTTP behavior during initialization to fit your specific network requirements:

```typescript
const client = new WhatspieClient({ 
  token: 'YOUR_API_TOKEN',
  baseUrl: 'https://api.whatspie.com', // Override the base API URL if necessary
  maxRetries: 5,                       // Max exponential backoff retries (default: 3)
  initialRetryDelayMs: 1000,           // Starting delay for backoff in milliseconds (default: 500)
  timeout: 60000,                      // Total request timeout in milliseconds (default: 30000)
  fetch: customFetchFunction,          // Pass a custom fetch implementation or proxy
  onRequest: async (url, init) => {
    console.log('Sending request to', url);
  },
  onResponse: async (response) => {
    console.log('Received response', response.status);
  }
});
```

---

## 🔒 Security Best Practices

### 1. Webhook Signature Verification
If you are exposing an endpoint to receive Whatspie webhooks, you **must** verify the cryptographic signature to prevent Server-Side Request Forgery (SSRF). The SDK provides an Edge-compatible HMAC SHA-256 verifier out of the box:

```typescript
const isValid = await client.webhooks.verifySignature(
  rawRequestBody,   // The raw stringified JSON body of the webhook
  signatureHeader,  // The signature header sent by Whatspie
  'your_webhook_secret'
);

if (!isValid) throw new Error('Invalid signature!');
```

### 2. Log Redaction
The SDK's internal logger automatically redacts sensitive keys (`token`, `password`, `secret`, `authorization`) to ensure your Datadog/CloudWatch logs never leak PII.

---

## 🚑 Troubleshooting

- **`WhatspieAuthenticationError`:** Double-check that your `process.env.WHATSPIE_TOKEN` is loaded correctly.
- **`WhatspieRateLimitError`:** Ensure your application respects the `retryAfter` property embedded in the error object. The SDK auto-retries by default, but heavy bursts will eventually throw.
- **Memory Leaks / Hanging Sockets:** By default, the SDK enforces a strict 30,000ms native `AbortController` timeout to prevent hanging connections. You can configure this via the `timeout` config.

---

## 🌐 Runtime Compatibility

| Runtime | Status | Notes |
|---------|--------|-------|
| Node.js (18+) | ✅ Supported | Uses global `fetch` |
| Cloudflare Workers | ✅ Supported | Zero Node dependencies |
| Vercel Edge / Next.js | ✅ Supported | Fully compatible |
| Deno / Bun | ✅ Supported | Native compatibility |

---

## 📄 License

This project is open-sourced software licensed under the MIT License.

---

<div align="center">
  <p>Developed with ❤️ by <strong>Muhammad Fadhila Abiyyu Faris</strong> (<a href="https://github.com/fadhila36">@fadhila36</a>).</p>
  <p><i>The unofficial, universal TypeScript client for WhatsApp API integration via Whatspie.</i></p>
</div>
