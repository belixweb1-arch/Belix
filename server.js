/* =========================================================
   BELIX — static file server + contact form endpoint
   Serves this folder's static files (index.html, css/, js/,
   images/) and exposes POST /api/contact, which emails
   submitted quote requests to belixweb1@gmail.com via Gmail SMTP.

   Required environment variables (set these in Hostinger's
   Node.js app "Environment variables" panel, not in this file):
     GMAIL_USER          e.g. belixweb1@gmail.com
     GMAIL_APP_PASSWORD  a Google Account "App Password" (NOT your
                          normal Gmail password) — generate one at
                          https://myaccount.google.com/apppasswords
     CONTACT_TO          (optional) recipient address, defaults to GMAIL_USER
   ========================================================= */

const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        fs.readFile(path.join(ROOT, 'index.html'), (fallbackErr, fallbackData) => {
          if (fallbackErr) {
            res.writeHead(404);
            res.end('Not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end(fallbackData);
          }
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

function handleContact(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy(); // guard against oversized payloads
  });

  req.on('end', async () => {
    const fields = Object.fromEntries(new URLSearchParams(body));
    const { fullName, email, phone, company, websiteType, budget, message, consent } = fields;

    if (!fullName || !email || !consent) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Missing required fields.' }));
      return;
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Email is not configured on the server yet.' }));
      return;
    }

    try {
      await transporter.sendMail({
        from: `"Belix Website" <${process.env.GMAIL_USER}>`,
        to: process.env.CONTACT_TO || process.env.GMAIL_USER,
        replyTo: email,
        subject: `New quote request from ${fullName}`,
        html: `
          <h2>New quote request</h2>
          <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone || '—')}</p>
          <p><strong>Company:</strong> ${escapeHtml(company || '—')}</p>
          <p><strong>Website type:</strong> ${escapeHtml(websiteType || '—')}</p>
          <p><strong>Budget:</strong> ${escapeHtml(budget || '—')}</p>
          <p><strong>Message:</strong><br>${escapeHtml(message || '—').replace(/\n/g, '<br>')}</p>
        `,
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error('Failed to send contact email:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Failed to send email.' }));
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/api/contact')) {
    handleContact(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Belix site running on port ${PORT}`);
});
