const PORT = process.env.PORT || 1453
const http = require('http');
const https = require('https');
const { URL } = require('url');
const express = require('express')
const app = express()
const server = http.Server(app);
const crypto = require('crypto');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



// This file must be under market.topluyo.com/ > App > API
APPLICATION_KEY = "XXXXXXXXXXX x32 length";             // APPLICATION KEY from, market.topluyo.com
CLIENT_KEY      = "XXXXXXXXXXXXXXXXXXXXXX x64 length";  // CLIENT KEY from topluyo.com > Profile > Settings (Ayarlar) > Devices (Cihazlaar)


// Decryption with checksum verification
function decrypt(data, password) {
  const method = 'aes-256-cbc';
  const passwordHash = crypto.createHash('sha256').update(password).digest();
  const iv = Buffer.alloc(16, 0); // 16-byte zeroed buffer
  try {
    const decipher = crypto.createDecipheriv(method, passwordHash, iv);
    let decrypted = decipher.update(data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    let checksum = decrypted.substring(0,4);
    let message  = decrypted.substring(4);
    if(crypto.createHash('md5').update(message).digest('hex').substring(0,4)==checksum){
      return message;
    }else{
      return "";
    }
  } catch (e) {
    return '';
  }
}


function api(url, token, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const lib = parsedUrl.protocol === 'https:' ? https : http;

    const req = lib.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          resolve({ error: 'Invalid JSON response', raw: responseData });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.write(postData);
    req.end();
  });
}


// --- Webhook endpoint ---
app.all('/', async (req, res) => {
  const encryptedWebhook = req.body.webhook || req.query.webhook;
  if (!encryptedWebhook) return res.status(400).send('Missing webhook');

  const decrypted = decrypt(encryptedWebhook, APPLICATION_KEY);
  if (!decrypted) return res.status(400).send('Invalid webhook checksum');

  let webhook;
  try {
    webhook = JSON.parse(decrypted);
  } catch {
    return res.status(400).send('Invalid JSON inside webhook');
  }

  const { action, data } = webhook;

  if (action === 'post/add') {
    let text = null;
    
    if (data.post === '!selam') {
      text = `selam ${data.user}`;
    } else if (data.post === '!naber') {
      text = `iyidir ${data.user} kanka senden naber =)`;
    }

    if (text) {
      const url = `https://topluyo.com/!api/post/add/${data.group}/${data.channel}`;
      const response = await api(url, CLIENT_KEY, { text });
      return res.json(response);
    }
  }

  res.send('OK');
});


// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
