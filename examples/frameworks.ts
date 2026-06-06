import { WhatspieClient } from '../src/index';

/**
 * Examples for different runtimes and frameworks.
 * This file is for demonstration purposes.
 */

// 1. Plain Node.js / Bun
async function nodeExample() {
  const client = new WhatspieClient({ token: 'YOUR_API_TOKEN' });
  const res = await client.messages.sendText('1234567890', '0987654321', 'Hello Node/Bun!');
  console.log(res);
}

// 2. Express.js
import express from 'express';
function expressExample() {
  const app = express();
  const client = new WhatspieClient({ token: 'YOUR_API_TOKEN' });

  app.post('/send', async (req: express.Request, res: express.Response) => {
    try {
      const response = await client.messages.sendImage(
        '123', '456', 'https://example.com/img.jpg', 'Beautiful image!'
      );
      res.json(response);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}

// 3. NestJS Service
// @Injectable()
class NestjsServiceExample {
  private whatspie = new WhatspieClient({ token: process.env.WHATSPIE_TOKEN! });
  async sendNotification(number: string, text: string) {
    return this.whatspie.messages.sendText('DEVICE_ID', number, text);
  }
}

// 4. Next.js API Route (App Router)
// export async function POST(request: Request) {
//   const client = new WhatspieClient({ token: process.env.WHATSPIE_TOKEN! });
//   const data = await request.json();
//   const res = await client.groups.addMembers({ group_id: data.groupId, device: '123', participants: data.members });
//   return Response.json(res);
// }

// 5. Cloudflare Worker (Hono)
// import { Hono } from 'hono'
// const app = new Hono()
// app.post('/webhook', async (c) => {
//   const client = new WhatspieClient({ token: c.env.WHATSPIE_TOKEN });
//   await client.contacts.check({ device: '123', numbers: ['456'] });
//   return c.text('Checked');
// })
