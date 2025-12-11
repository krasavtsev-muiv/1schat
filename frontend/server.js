// Custom server для Next.js с поддержкой WebSocket проксирования
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const httpProxy = require('http-proxy');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '80', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// URL бэкенда из переменной окружения или дефолтный
const backendUrl = process.env.BACKEND_URL || 'http://backend:3001';

// Создаем proxy сервер
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true,
});

// Обработка ошибок proxy
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (res && !res.headersSent) {
    res.statusCode = 502;
    res.end('Bad Gateway');
  }
});

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Проксирование WebSocket для Socket.IO
      if (pathname.startsWith('/socket.io')) {
        proxy.web(req, res, { target: backendUrl });
        return;
      }

      // Проксирование API запросов
      if (pathname.startsWith('/api')) {
        proxy.web(req, res, { target: backendUrl });
        return;
      }

      // Проксирование health check
      if (pathname === '/health') {
        proxy.web(req, res, { target: backendUrl });
        return;
      }

      // Остальные запросы обрабатывает Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Поддержка WebSocket upgrade
  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url, true);
    
    if (pathname.startsWith('/socket.io')) {
      proxy.ws(req, socket, head, { target: backendUrl });
    } else {
      socket.destroy();
    }
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
