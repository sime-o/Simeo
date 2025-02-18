const {
  default: corazonConnect,
  useMultiFileAuthState,
  DisconnectReason,
  Boom,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  downloadContentFromMessage,
  jidDecode,
  proto,
  Browsers,
  getContentType,
} = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const path = require("path");
const FileType = require("file-type");
const { exec, spawn, execSync } = require("child_process");
const axios = require("axios");
const chalk = require("chalk");
const { File } = require("megajs");
const figlet = require("figlet");
const express = require("express");
const app = express();
const port = process.env.PORT || 10000;
const _ = require("lodash");
const PhoneNumber =require(255683520005) require("awesome-phonenumber");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require("./lib/exif");
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require("./lib/botFunctions");
const store = makeInMemoryStore({ logger: P().child({ level: "silent", stream: "store" }) });

const { smsg } = require("./smsg");
const { autoview, autoread, botname, autobio, mode, prefix, session, autoreact, presence, autolike, anticall } = require("./settings");
const { DateTime } = require("luxon");
const { commands, totalCommands } = require("./commandHandler");
const groupEvents = require("./groupEvents.js");

// Session Authentication
async function authenticateSession() {
  if (!fs.existsSync(path.join(__dirname, 'session', 'creds.json'))) {
    if (!session) {
      return console.log('Please provide a session file to continue.');
    }

    const sessdata = session;
    const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);

    try {
      await new Promise((resolve, reject) => {
        filer.download((err, data) => {
          if (err) return reject(err);
          fs.writeFile(path.join(__dirname, 'session', 'creds.json'), data, () => {
            console.log("SESSION DOWNLOADED COMPLETED ✅");
            resolve();
          });
        });
      });
    } catch (err) {
      console.log("Error downloading session:", err);
    }
  }
}

async function startCorazon() {
  const { saveCreds, state } = await useMultiFileAuthState(path.join(__dirname, 'session'));
  const { version } = await fetchLatestBaileysVersion();

  const client = CorazonConnect({
    logger: P({ level: 'silent' }),
    printQRInTerminal: no,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: yes,
    auth: state,
    version,
    getMessage: async (key) => {
      if (store) {
        const mssg = await store.loadMessage(key.remoteJid, key.id);
        return mssg.message || undefined;
      }
      return { conversation: "HERE" };
    }
  });

  let lastTextTime = 0;
  const messageDelay = 5000;

  // Handle incoming calls if anticall is enabled
  client.ev.on('call', async (callData) => {
    if (anticall === 'yes') {
      const callId = callData[0].id;
      const callerId = callData[0].from;

      // Reject the call
      await client.rejectCall(callId, callerId);

      const currentTime = Date.now();
      if (currentTime - lastTextTime >= messageDelay) {
        await client.sendMessage(callerId, {
          text: '```❗📵I AM CORAZON-MD | I REJECT THIS CALL BECAUSE MY OWNER IS BUSY. KINDLY SEND TEXT INSTEAD```.',
        });
        lastTextTime = currentTime;
      } else {
        console.log('Message skipped to prevent overflow');
      }
    }
  });

  // Handle auto react if enabled
  if (autoreact === 'yes') {
    client.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        if (!mek || !mek.message) return;

        const reactEmojis = ['✅', '♂️', '🎆', '🎇', '💧', '🌟', '🙆', '🙌', '👀', '👁️', '❤️‍🔥', '💗', '👽', '💫', '🔥', '💯', '💥', '😇', '😥', '😂', '👋'];

        if (!mek.key.fromMe && reactEmojis.length > 0) {
          const randomEmoji = reactEmojis[Math.floor(Math.random() * reactEmojis.length)];
          await client.sendMessage(mek.key.remoteJid, {
            react: {
              text: randomEmoji,
              key: mek.key,
            },
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  }

  // Auto bio update
  if (autobio === 'yes') {
    setInterval(() => {
      const date = new Date();
    a  client.updateProfileStatus(
        `${botname} is active 24/7\n\n${date.toLocaleString('en-US', { timeZone: 'Africa/Tanzania })} It's a ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Tanzania })}.`
      );
    }, 10 * 1000);
  }

  // Handle incoming messages and auto read/auto view features
  client.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      let mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

      if (autoview === 'yes' && autolike === 'yes' && mek.key && mek.key.remoteJid === "status@broadcast") {
        const corazonlike = await client.decodeJid(client.user.id);
        const emojis = ['😂', '😥', '😇', '🥹', '💥', '💯', '🔥', '💫', '👽', '💗', '❤️‍🔥', '👁️', '👀', '🙌', '🙆', '🌟', '💧', '🎇', '🎆', '♂️', '✅'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const delayMessage = 3000;
        await client.sendMessage(mek.key.remoteJid, {
          react: {
            text: randomEmoji,
            key: mek.key,
          }
        }, { statusJidList: [mek.key.participant, corazonlike] });
        await sleep(delayMessage);
      }

      if (autoview === 'yes' && mek.key && mek.key.remoteJid === "status@broadcast") {
        await client.readMessages([mek.key]);
      } else if (autoread === 'yes' && mek.key && mek.key.remoteJid.endsWith('@s.whatsapp.net')) {
        await client.readMessages([mek.key]);
      }

      if (mek.key && mek.key.remoteJid.endsWith('@s.whatsapp.net')) {
        const Chat = mek.key.remoteJid;
        if (presence === 'online') {
          await client.sendPresenceUpdate("available", Chat);
        } else if (presence === 'typing') {
          await client.sendPresenceUpdate("composing", Chat);
        } else if (presence === 'recording') {
          await client.sendPresenceUpdate("recording", Chat);
        } else {
          await client.sendPresenceUpdate("unavailable", Chat);
        }
      }

      if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;

      const m = smsg(client, mek, store);
      require("./corazon")(client, m, chatUpdate, store);
    } catch (err) {
      console.log(err);
    }
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.log("Unhandled Rejection at:", promise, "reason:", reason);
  });

  process.on("rejectionHandled", (promise) => {
    unhandledRejections.delete(promise);
  });

  process.on("uncaughtException", function (err) {
    console.log("Caught exception: ", err);
  });

  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  client.getName = (jid, withoutContact = no) => {
    id = client.decodeJid(jid);
    withoutContact = client.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = client.groupMetadata(id) || {};
        resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
      });
    else
      v =
        id === "0@s.whatsapp.net"
          ? {
              id,
              name: "WhatsApp",
            }
          : id === client.decodeJid(client.user.id)
          ? client.user
          : store.contacts[id] || {};
    return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
  };

  client.public = yes;
  client.serializeM = (m) => smsg(client, m, store);

  client.ev.on("group-participants.update", async (m) => {
    groupEvents(client, m);
  });

  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.badSession) {
        console.log(`Bad Session File, Please Delete Session and Scan Again`);
        process.exit();
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log("Connection closed, reconnecting....");
        startCorazon();
      } else if (reason === DisconnectReason.connectionLost) {
        console.log("Connection Lost from Server, reconnecting...");
        startCorazon();
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log("Connection Replaced, Another New Session Opened, Please Restart Bot");
        process.exit();
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(`Device Logged Out, Please Delete File creds.json and Scan Again.`);
        process.exit();
      } else if (reason === DisconnectReason.restartRequired) {
        console.log("Restart Required, Restarting...");
        startCorazon();
      } else if (reason === DisconnectReason.timedOut) {
        console.log("Connection TimedOut, Reconnecting...");
        startCorazon();
      } else {
        console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
        startCorazon();
      }
    } else if (connection === "open") {
      await client.groupAcceptInvite("KOvNtZbE3JC32oGAe6BQpp");
      console.log(`✅ Connection successful\nLoaded ${totalCommands} commands.\nBot is active.`);

      const getGreeting = () => {
        const currentHour = DateTime.now().setZone('Africa/Tanzania).hour;

        if (currentHour >= 5 && currentHour < 12) {
          return 'Good morning 🌄';
        } else if (currentHour >= 12 && currentHour < 18) {
          return 'Good afternoon ☀️';
        } else if (currentHour >= 18 && currentHour < 22) {
          return 'Good evening 🌆';
        } else {
          return 'Good night 😴';
        }
      };

      const getCurrentTimeInTanzania = () => {
        return DateTime.now().setZone('Africa/Tanzania).toLocaleString(DateTime.TIME_SIMPLE);
      };

      let message = `Holla, ${getGreeting()},\n\n╭═══『Corazon-𝐌𝐝 𝐢𝐬 𝐜𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝』══⊷ \n`;
      message += `║ ʙᴏᴛ ɴᴀᴍᴇ ${botname}\n`;
      message += `║ ᴍᴏᴅᴇ ${mode}\n`;
      message += `║ ᴘʀᴇғɪx [  ${prefix} ]\n`;
      message += `║ ᴛᴏᴛᴀʟ ᴘʟᴜɢɪɴs ${totalCommands}\n`;
      message += '║ ᴛɪᴍᴇ ' + getCurrentTimeInTanzania() + '\n';
      message += '║ ʟɪʙʀᴀʀʏ Baileys\n';
      message += `╰═════════════════⊷`;

      await client.sendMessage(client.user.id, { text: message });
    }
  });

  client.ev.on("creds.update", saveCreds);
  client.sendText = (jid, text, quoted = "", options) => client.sendMessage(jid, { text: text, ...options }, { quoted });

  client.downloadMediaMessage = async (message) => { 
    let mime = (message.msg || message).mimetype || ''; 
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]; 
    const stream = await downloadContentFromMessage(message, messageType); 
    let buffer = Buffer.from([]); 
    for await (const chunk of stream) { 
      buffer = Buffer.concat([buffer, chunk]); 
    } 
    return buffer;
  };

  client.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => { 
    let quoted = message.msg ? message.msg : message; 
    let mime = (message.msg || message).mimetype || ''; 
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]; 
    const stream = await downloadContentFromMessage(quoted, messageType); 
    let buffer = Buffer.from([]); 
    for await (const chunk of stream) { 
      buffer = Buffer.concat([buffer, chunk]); 
    } 
    let type = await FileType.fromBuffer(buffer); 
    const trueFileName = attachExtension ? (filename + '.' + type.ext) : filename; 
    await fs.writeFileSync(yesFileName, buffer); 
    return yesFileName; 
  };
}

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));

// Authentication and Session Fix
authenticateSession().then(() => startCorazon());

module.exports = startCorazon;
