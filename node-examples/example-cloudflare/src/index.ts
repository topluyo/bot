/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request:Request, env:Env, ctx:ExecutionContext) {
    const url = new URL(request.url);
    const method = request.method;

    let encryptedWebhook = null;

    if (method === 'POST') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await request.json();
        if (typeof body === 'object' && body !== null && 'webhook' in body) {
          encryptedWebhook = (body as { webhook: string }).webhook;
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        encryptedWebhook = formData.get('webhook');
      }
    } else if (method === 'GET') {
      encryptedWebhook = url.searchParams.get('webhook');
    }

    if (!encryptedWebhook) {
      return new Response('Missing webhook', { status: 400 });
    }

    const decrypted = await decrypt(
      typeof encryptedWebhook === 'string'
        ? encryptedWebhook
        : typeof encryptedWebhook === 'object' && encryptedWebhook instanceof File
          ? await encryptedWebhook.text()
          : '',
      env.APPLICATION_KEY as unknown as string
    );
    if (!decrypted) {
      return new Response('Invalid webhook checksum', { status: 400 });
    }

    let webhook;
    try {
      webhook = JSON.parse(decrypted);
    } catch {
      return new Response('Invalid JSON inside webhook', { status: 400 });
    }

    const { action, user, message, channel, group } = webhook;

    if (action === 'post/add') {
      let text = null;

      if (message === '!selam') {
        text = `selam ${user}`;
      } else if (message === '!naber') {
        text = `iyidir ${user} kanka senden naber =)`; 
      }

      if (text) {
        const postUrl = `https://topluyo.com/!api/post/add/${group}/${channel}`;
        const apiRes = await fetch(postUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.CLIENT_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        });

        const apiJson = await apiRes.json().catch(() => ({ error: "Invalid JSON response" }));
        return new Response(JSON.stringify(apiJson), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    return new Response('OK');
  }
};


async function decrypt(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const passwordBuffer = encoder.encode(password);
  const passwordHash = await crypto.subtle.digest('SHA-256', passwordBuffer);

  const key = await crypto.subtle.importKey(
    'raw',
    passwordHash,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  );

  const iv = new Uint8Array(16); // 16-byte zeroed IV

  try {
    const encryptedBytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv,
      },
      key,
      encryptedBytes
    );

    const decryptedText = decoder.decode(decryptedBuffer);
    const checksum = decryptedText.substring(0, 4);
    const message = decryptedText.substring(4);

    const md5 = await md5Hash(message);
    if (md5.substring(0, 4) === checksum) {
      return message;
    } else {
      return '';
    }
  } catch (e) {
    return '';
  }
}

async function md5Hash(message:string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
