import { createServer } from 'node:http';
import { resolve } from 'node:path';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { createApp } from './app.js';
import { verifyToken } from './auth.js';

const port = Number(process.env.PORT) || 4000;
const clients = new Map<string, Set<WebSocket>>();

const app = createApp({
  onTaskChange(userId, event) {
    for (const client of clients.get(userId) ?? []) {
      if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(event));
    }
  }
});

if (process.env.NODE_ENV === 'production') {
  const clientPath = resolve('dist');
  app.use(express.static(clientPath));
  app.use((_request, response) => response.sendFile(resolve(clientPath, 'index.html')));
}

const server = createServer(app);
const webSockets = new WebSocketServer({ server, path: '/ws' });

webSockets.on('connection', (socket, request) => {
  try {
    const url = new URL(request.url ?? '', `http://${request.headers.host}`);
    const userId = verifyToken(url.searchParams.get('token') ?? '');
    const userClients = clients.get(userId) ?? new Set<WebSocket>();
    userClients.add(socket);
    clients.set(userId, userClients);
    socket.on('close', () => {
      userClients.delete(socket);
      if (!userClients.size) clients.delete(userId);
    });
  } catch {
    socket.close(1008, 'Unauthorized');
  }
});

server.listen(port, () => {
  console.log(`Taskflow server running at http://localhost:${port}`);
});

