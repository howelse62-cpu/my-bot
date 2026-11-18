const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require("@whiskeysockets/baileys");
const axios = require('axios');
const pino = require('pino');

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }), printQRInTerminal: false });

  const MY_NUMBER = "2349163699750";

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(MY_NUMBER);
        console.log("\n=== YOUR PAIRING CODE ===");
        console.log(code);
        console.log("Go WhatsApp > Linked Devices > Link with phone number > Enter this code ===\n");
      } catch(e){ console.log("Pairing error:", e.message); }
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === 'open') console.log('NEON DEX V2 ONLINE! Type .menu');
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) start();
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase().trim();
    const from = msg.key.remoteJid;
    const reply = (t) => sock.sendMessage(from, { text: t }, { quoted: msg });

    if (text === '.menu' || text === 'hi' || text === 'hello') return reply('NEON DEX MENU:\n.ping .joke .quote .time .date .owner .info .help');
    if (text === '.ping') return reply('Pong! NEON DEX dey fast die!');
    if (text === '.joke') return reply('Why did phone go to school? To get smarter!');
    if (text === '.quote') return reply('No be who first start dey win, na who no give up.');
    if (text === '.time') return reply('Time for Abuja: ' + new Date().toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos' }));
    if (text === '.date') return reply('Date: ' + new Date().toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' }));
    if (text === '.owner') return reply('Owner: Boss fo Auwal, Creator of NEON DEX V2');
    if (text === '.info') return reply('NEON DEX V2 Running on Tecno Spark 7 | 100% FREE!');
    if (text === '.help') return reply('Type .menu to see all commands boss!');
if (text.startsWith('.ai ')) {
  let q = text.replace('.ai ', '');
  try {
    let res = await axios.get('https://text.pollinations.ai/' + encodeURIComponent(q));
    await reply('🤖 NEON AI: ' + res.data);
  } catch { await reply('AI busy, try again boss'); }
}
if (text.startsWith('.weather')) {
  let city = text.replace('.weather', '').trim() || 'Abuja';
  try {
    let res = await axios.get(`https://wttr.in/${city}?format=j1`);
    let c = res.data.current_condition[0];
    await reply(`🌦️ Weather for ${city}\nTemp: ${c.temp_C}°C\nFeels Like: ${c.FeelsLikeC}°C\nCondition: ${c.weatherDesc[0].value}\nHumidity: ${c.humidity}%`);
  } catch { await reply('Weather no gree, try .weather Lagos'); }
}
if (text.startsWith('.song ')) {
  let song = text.replace('.song ', '');
  await reply(`🎵 You search: ${song}\n\nDownload am here:\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(song)}`);
}
if (text === '.sticker' && msg.message.imageMessage) {
  try {
    let buffer = await downloadMediaMessage(msg, 'buffer', {});
    await sock.sendMessage(from, { sticker: buffer });
  } catch { await reply('Send picture with caption .sticker'); }
}
  });
}
start();
import http from 'http';
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('NEON DEX V2 ONLINE');
}).listen(PORT, () => console.log('Port running on ' + PORT));