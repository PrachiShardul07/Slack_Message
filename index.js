// index.js
require('dotenv').config();
const fs = require('fs');
const express = require('express');
const axios = require('axios');
const { WebClient } = require('@slack/web-api');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const CLIENT_ID = process.env.SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;

// tokens.json is a tiny file to persist token in this demo (don't use in prod)
const TOKENS_FILE = path.join(__dirname, 'tokens.json');
function saveTokens(obj) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(obj, null, 2));
}
function loadTokens() {
  try { return JSON.parse(fs.readFileSync(TOKENS_FILE)); }
  catch(e){ return {}; }
}

// helper returns a WebClient using stored or env token
function getWebClient() {
  const tokens = loadTokens();
  const token = tokens.bot_token || process.env.SLACK_BOT_TOKEN;
   console.log('Using Slack token:', token ? 'FOUND' : 'MISSING');
  if (!token) throw new Error('Slack bot token not found. Install the app or set SLACK_BOT_TOKEN.');
  return new WebClient(token);
}

/*
  ---------- Minimal web UI ----------
*/
app.get('/', (req, res) => {
  const installUrl = `https://slack.com/oauth/v2/authorize?client_id=${CLIENT_ID}&scope=chat:write,channels:read,channels:history,chat:write.public&redirect_uri=${encodeURIComponent(BASE_URL + '/slack/oauth/callback')}`;
  res.send(`
    <h2>Slack Sandbox Demo</h2>
    <p><a href="${installUrl}">Install to Slack (OAuth)</a></p>
    <p>Use the API endpoints (curl / Postman) once installed.</p>
    <hr/>
    <p>Endpoints:</p>
    <ul>
      <li>POST /api/send-message</li>
      <li>POST /api/schedule-message</li>
      <li>GET /api/messages?channel=CHANNEL_ID</li>
      <li>POST /api/update-message</li>
      <li>POST /api/delete-message</li>
      <li>GET  /api/channels</li>
    </ul>
  `);
});

/*
  ---------- OAuth install flow ----------
*/

/*
  ---------- OAuth Install (redirects to Slack) ----------
*/
app.get('/slack/install', (req, res) => {
  const installUrl = `https://slack.com/oauth/v2/authorize?client_id=${CLIENT_ID}&scope=chat:write,channels:read,channels:history,chat:write.public&redirect_uri=${encodeURIComponent(BASE_URL + '/slack/oauth/callback')}`;
  res.redirect(installUrl);
});

app.get('/slack/oauth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code parameter.');

  try {
    // exchange code for token (oauth.v2.access)
    const resp = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${BASE_URL}/slack/oauth/callback`
      }
    });

    const data = resp.data;
    if (!data.ok) {
      return res.status(500).send('OAuth failed: ' + JSON.stringify(data));
    }

    // store bot token (basic demo storage)
    const botToken = data.access_token || (data.bot && data.bot.bot_access_token) || null;
    const tokens = { bot_token: botToken, team: data.team, authed_user: data.authed_user || null };
    saveTokens(tokens);

    return res.send(`<p>App installed! Bot token saved (tokens.json). You can now close this window and use the demo endpoints.</p><pre>${JSON.stringify(tokens, null, 2)}</pre>`);
  } catch (err) {
    console.error('oauth callback error', err?.response?.data || err.message);
    return res.status(500).send('OAuth exchange failed. Check server logs.');
  }
});

/*
  ---------- Helper: list channels ----------
*/
app.get('/api/channels', async (req, res) => {
  try {
    const client = getWebClient();
    const list = await client.conversations.list({ limit: 200 });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message, detail: err.data || null });
  }
});

/*
  ---------- Send a message (chat.postMessage) ----------
  body: { channel: "C123...", text: "Hello world" }
*/
app.post('/api/send-message', async (req, res) => {
  try {
    const { channel, text } = req.body;
    const client = getWebClient();
    const r = await client.chat.postMessage({ channel, text });
    return res.json(r);
  } catch (err) {
    return res.status(500).json({ error: err.message, detail: err.data || null });
  }
});

/*
  ---------- Schedule a message (chat.scheduleMessage) ----------
  body: { channel: "C123...", text: "Later!", post_at: 1672531200 }
  post_at is unix timestamp (seconds)
*/
app.post('/api/schedule-message', async (req, res) => {
  try {
    const { channel, text, post_at } = req.body;
    const client = getWebClient();
    const r = await client.chat.scheduleMessage({ channel, text, post_at: Number(post_at) });
    return res.json(r);
  } catch (err) {
    return res.status(500).json({ error: err.message, detail: err.data || null });
  }
});

/*
  ---------- List scheduled messages ----------
*/
app.get('/api/scheduled', async (req, res) => {
  try {
    const client = getWebClient();
    const r = await client.chat.scheduledMessages.list();
    return res.json(r);
  } catch (err) {
    return res.status(500).json({ error: err.message, detail: err.data || null });
  }
});

/*
  ---------- Retrieve messages (conversations.history) ----------
  query params: ?channel=C123&limit=50
*/
app.get('/api/messages', async (req, res) => {
  try {
    const { channel, limit = 50 } = req.query;
    const client = getWebClient();
    const r = await client.conversations.history({ channel, limit: Number(limit) });
    return res.json(r);
  } catch (err) {
    return res.status(500).json({ error: err.message, detail: err.data || null });
  }
});

/*
  ---------- Update message (chat.update) ----------
  body: { channel: 'C123', ts: '1593473566.000200', text: 'Updated text' }
*/
app.post('/api/update-message', async (req, res) => {
  try {
    const { channel, ts, text } = req.body;
    const client = getWebClient();
    const r = await client.chat.update({ channel, ts, text });
    return res.json(r);
  } catch (err) {
    return res.status(500).json({ error: err.message, detail: err.data || null });
  }
});

/*
  ---------- Delete message (chat.delete) ----------
  body: { channel: 'C123', ts: '1593473566.000200' }
*/
app.post('/api/delete-message', async (req, res) => {
  try {
    const { channel, ts } = req.body;
    const client = getWebClient();
    const r = await client.chat.delete({ channel, ts });
    return res.json(r);
  } catch (err) {
    return res.status(500).json({ error: err.message, detail: err.data || null });
  }
});

app.listen(PORT, () => {
  console.log(`Slack sandbox demo running: ${BASE_URL} (port ${PORT})`);
});
