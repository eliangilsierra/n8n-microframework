'use strict';
const http = require('http');

const PORT = parseInt(process.env.PORT || '3001', 10);

function randomTicketId() {
  return 'TICKET-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    const ts = new Date().toISOString();
    const contentType = req.headers['content-type'] || '';

    // Health check
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // Mock InfluxDB write endpoint (IoT as-is redirige aquí)
    if (req.method === 'POST' && (req.url.includes('/api/v2/write') || contentType.includes('text/plain'))) {
      console.log(JSON.stringify({ ts, method: req.method, path: req.url, type: 'influxdb-write', body_len: body.length }));
      res.writeHead(204);
      res.end();
      return;
    }

    // Historial de usuario (Bot as-is consulta GET /api/user/:userId/tickets)
    if (req.method === 'GET' && req.url.startsWith('/api/user/')) {
      const userId = req.url.split('/')[3] || 'unknown';
      console.log(JSON.stringify({ ts, method: 'GET', path: req.url, type: 'user-history', user_id: userId }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        user_id: userId,
        status: 'activo',
        tickets_activos: 2,
        tickets: [
          { id: 'TKT-001', categoria: 'facturacion', prioridad: 'media', ts: '2026-04-01T10:00:00Z' },
          { id: 'TKT-002', categoria: 'soporte_tecnico', prioridad: 'baja', ts: '2026-04-10T14:30:00Z' }
        ]
      }));
      return;
    }

    // Mock sistema de tickets (Bot)
    const ticketId = randomTicketId();
    let bodyPreview = '';
    try {
      const parsed = JSON.parse(body);
      bodyPreview = JSON.stringify(Object.fromEntries(Object.entries(parsed).slice(0, 3)));
    } catch (_) {
      bodyPreview = body.slice(0, 100);
    }

    console.log(JSON.stringify({ ts, method: req.method, path: req.url, body_preview: bodyPreview, response_ticket_id: ticketId }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', ticket_id: ticketId, ts }));
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'start', port: PORT, role: 'mock-bot' }));
});
