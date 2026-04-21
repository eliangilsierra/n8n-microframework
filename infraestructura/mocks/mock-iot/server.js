'use strict';
const http = require('http');

const PORT = parseInt(process.env.PORT || '3002', 10);

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    const ts = new Date().toISOString();

    // Health check
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    let nivel = 'unknown';
    let sensorId = 'unknown';
    try {
      const parsed = JSON.parse(body);
      nivel = parsed.nivel || parsed.level || 'unknown';
      sensorId = parsed.sensor_id || 'unknown';
    } catch (_) {}

    console.log(JSON.stringify({ ts, method: req.method, path: req.url, nivel, sensor_id: sensorId }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', notificacion_enviada: true, nivel, ts }));
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'start', port: PORT, role: 'mock-iot' }));
});
