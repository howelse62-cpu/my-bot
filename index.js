
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('NEON DEX V2 ONLINE');
}).listen(PORT, () => console.log('Port running on ' + PORT));

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const pino = require('pino');

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false
  });

  const MY_NUMBER = "2349163699750";

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(MY_NUMBER);
        console.log("\n=== YOUR PAIRING CODE ===");
        console.log(code);
        console.log("Go WhatsApp > Linked Devices > Link with phone number > Enter this code ===\n");
      } catch (e) {
        console.log('Pairing error', e.message);
      }
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === 'open') console.log('NEON DEX V2 ONLINE! Type .menu');
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      start();
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
      const lower = text.toLowerCase();
      const from = msg.key.remoteJid;
      const reply = (t) => sock.sendMessage(from, { text: t }, { quoted: msg });

      // MENU
      if (lower === '.menu' || lower === 'hi' || lower === 'hello') {
        return reply(`NEON DEX MENU:
.ping - check if bot alive
.joke - random joke
.quote - random quote
.time - time for Abuja
.date - date for Abuja
.weather Abuja - weather
.song Asake - find song
.sticker - make sticker
.ai hello - chat AI
.owner - owner
.info - bot info
.help - help`);
      }

      if (lower === '.ping') return reply('Pong! NEON DEX dey fast die!');

      if (lower === '.joke') {
        const jokes = [
          'Why did phone go to school? To get smarter!',
          'Why did chicken cross road? To reach NEON DEX!',
          'No be who first start dey win, na who no give up.'
        ];
        return reply(jokes[Math.floor(Math.random() * jokes.length)]);
      }

      if (lower === '.quote') return reply('No be who first start dey win, na who no give up.');

      if (lower === '.time') return reply('Time for Abuja: ' + new Date().toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos' }));

      if (lower === '.date') return reply('Date: ' + new Date().toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' }));

      if (lower === '.owner') return reply('Owner: ELI - Creator of NEON DEX V2');

      if (lower === '.info') return reply('NEON DEX V2 Running - 100% FREE - Made by ELI');

      if (lower === '.help') return reply('Type .menu to see all commands boss!');

      // AI
      if (lower.startsWith('.ai ')) {
        let q = text.slice(4).trim();
        if (!q) return reply('Use am like this: .ai hello');
        try {
          let res = await axios.get('https://text.pollinations.ai/' + encodeURIComponent(q));
          await reply('NEON AI: ' + res.data);
        } catch (e) {
          await reply('AI busy, try again boss');
        }
        return;
      }

      // WEATHER
      if (lower.startsWith('.weather')) {
        let city = text.slice(8).trim() || 'Abuja';
        try {
          let res = await axios.get(`https://wttr.in/${city}?format=j1`);
          let c = res.data.current_condition[0];
          await reply(`Weather for ${city}\nTemp: ${c.temp_C}C\nFeels Like: ${c.FeelsLikeC}C\nCondition: ${c.weatherDesc[0].value}\nHumidity: ${c.humidity}%`);
        } catch (e) {
          await reply('Weather no gree, try .weather Lagos');
        }
        return;
      }

      // SONG
      if (lower.startsWith('.song')) {
        let q = text.slice(5).trim();
        if (!q) return reply('Use am like this: .song Asake');
        await reply(`Your song: ${q}\nListen am here: https://www.youtube.com/results?search_query=` + encodeURIComponent(q));
        return;
      }

      // STICKER
      if (lower === '.sticker') {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = msg.message.imageMessage || quoted?.imageMessage;
        if (imageMsg) {
          try {
            const buffer = await downloadMediaMessage(msg, 'buffer', {});
            await sock.sendMessage(from, { sticker: buffer }, { quoted: msg });
          } catch (e) {
            await reply('Sticker fail, try again');
          }
        } else {
          await reply('Send picture with caption .sticker boss, I go convert am');
        }
        return;
      }

    } catch (e) {
      console.log('Message error', e.message);
    }
  });
}

start();