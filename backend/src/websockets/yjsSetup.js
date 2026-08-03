const { WebSocketServer } = require('ws');
const { setupWSConnection, setPersistence } = require('y-websocket/bin/utils');
const Y = require('yjs');
const prisma = require('../prisma');

function setupYjsWebsockets(server) {
  // Yjs persistence hook
  setPersistence({
    bindState: async (docName, ydoc) => {
      try {
        const document = await prisma.document.findUnique({ where: { id: docName } });
        if (document && document.content) {
          Y.applyUpdate(ydoc, new Uint8Array(document.content));
        }
      } catch (err) {
        console.error('Failed to bind state for doc:', docName, err);
      }
    },
    writeState: async (docName, ydoc) => {
      try {
        const content = Y.encodeStateAsUpdate(ydoc);
        await prisma.document.update({
          where: { id: docName },
          data: { content: Buffer.from(content) }
        });
      } catch (err) {
        console.error('Failed to save state for doc:', docName, err);
      }
    }
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    // Let socket.io handle its own upgrades
    if (request.url.startsWith('/socket.io/')) {
      return;
    }
    
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (conn, req) => {
    setupWSConnection(conn, req);
  });

  console.log('Yjs WebSocket Server initialized on the same port.');
}

module.exports = setupYjsWebsockets;
