import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { parse } from 'url';

type Client = WebSocket & {
  userId?: string;
  rooms: Set<string>;
  isAlive: boolean;
};

class SocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<Client> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const client = ws as Client;
      client.rooms = new Set();
      client.isAlive = true;

      // Simple keep-alive
      client.on('pong', () => { client.isAlive = true; });

      // Handle query params for simple auth/room joining
      const { query } = parse(req.url || '', true);
      if (typeof query.userId === 'string') {
        client.userId = query.userId;
      }

      this.clients.add(client);

      client.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(client, message);
        } catch (e) {
          console.error("WS Message Error:", e);
        }
      });

      client.on('close', () => {
        this.clients.delete(client);
      });
    });

    // Heartbeat
    setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        const client = ws as Client;
        if (!client.isAlive) return client.terminate();
        client.isAlive = false;
        client.ping();
      });
    }, 30000);
  }

  private handleMessage(client: Client, message: any) {
    switch (message.type) {
      case 'join_room':
        if (message.roomId) {
          client.rooms.add(message.roomId);
        //   console.log(`User ${client.userId} joined room ${message.roomId}`);
        }
        break;
      case 'leave_room':
        if (message.roomId) {
          client.rooms.delete(message.roomId);
        }
        break;
      case 'ping':
        client.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  public broadcastToRoom(roomId: string, event: string, payload: any) {
    const message = JSON.stringify({ type: event, payload });
    this.clients.forEach(client => {
      if (client.rooms.has(roomId) && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public broadcastToUser(userId: string, event: string, payload: any) {
    const message = JSON.stringify({ type: event, payload });
    this.clients.forEach(client => {
      if (client.userId === userId && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

export const wsManager = new SocketManager();
