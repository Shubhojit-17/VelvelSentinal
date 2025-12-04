/**
 * Velvet Sentinel - WebSocket Support
 * 
 * Real-time updates for price feeds, opportunities, and agent status
 */

export interface WebSocketConfig {
  path?: string;
  heartbeatInterval?: number;
  maxConnections?: number;
}

export type MessageType = 
  | 'subscribe'
  | 'unsubscribe'
  | 'price_update'
  | 'opportunity_new'
  | 'opportunity_expired'
  | 'opportunity_executed'
  | 'agent_status'
  | 'syndicate_update'
  | 'execution_update'
  | 'error';

export interface WSMessage<T = unknown> {
  type: MessageType;
  channel?: string;
  data: T;
  timestamp: number;
}

export interface SubscriptionRequest {
  channels: string[];
}

export interface PriceUpdate {
  pair: string;
  dex: string;
  price: string;
  liquidity: string;
  change24h?: number;
}

export interface OpportunityUpdate {
  id: string;
  pair: string;
  buyDex: string;
  sellDex: string;
  profitBps: number;
  estimatedProfit: string;
  confidence: number;
  expiresAt: number;
}

export interface AgentStatusUpdate {
  agentId: string;
  status: 'ready' | 'busy' | 'error' | 'offline';
  tasksCompleted: number;
  lastActivity: number;
}

/**
 * Available subscription channels
 */
export const Channels = {
  // Price feeds
  prices: (pair?: string) => pair ? `prices:${pair}` : 'prices:*',
  pricesByDex: (dex: string) => `prices:dex:${dex}`,
  
  // Opportunities
  opportunities: () => 'opportunities',
  opportunitiesByPair: (pair: string) => `opportunities:${pair}`,
  opportunitiesByProfit: (minBps: number) => `opportunities:min:${minBps}`,
  
  // Agent updates
  agentStatus: (agentId?: string) => agentId ? `agent:${agentId}` : 'agent:*',
  
  // Syndicate updates
  syndicate: (syndicateId: string) => `syndicate:${syndicateId}`,
  
  // Executions
  executions: (agentId?: string) => agentId ? `exec:${agentId}` : 'exec:*',
};

/**
 * WebSocket client for dashboard/frontend
 */
export class VelvetWSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions: Set<string> = new Set();
  private handlers: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[VelvetWS] Connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          
          // Resubscribe to previous channels
          for (const channel of this.subscriptions) {
            this.send({ type: 'subscribe', channels: [channel] });
          }
          
          resolve();
        };

        this.ws.onclose = () => {
          console.log('[VelvetWS] Disconnected');
          this.stopHeartbeat();
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[VelvetWS] Error:', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (e) {
            console.error('[VelvetWS] Failed to parse message:', e);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to a channel
   */
  subscribe<T>(channel: string, handler: (data: T) => void): () => void {
    this.subscriptions.add(channel);
    
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler as (data: unknown) => void);

    // Send subscription request if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: 'subscribe', channels: [channel] });
    }

    // Return unsubscribe function
    return () => {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        channelHandlers.delete(handler as (data: unknown) => void);
        if (channelHandlers.size === 0) {
          this.handlers.delete(channel);
          this.subscriptions.delete(channel);
          this.send({ type: 'unsubscribe', channels: [channel] });
        }
      }
    };
  }

  /**
   * Subscribe to price updates
   */
  onPriceUpdate(pair: string | null, handler: (data: PriceUpdate) => void): () => void {
    const channel = pair ? Channels.prices(pair) : Channels.prices();
    return this.subscribe(channel, handler);
  }

  /**
   * Subscribe to new opportunities
   */
  onOpportunity(handler: (data: OpportunityUpdate) => void): () => void {
    return this.subscribe(Channels.opportunities(), handler);
  }

  /**
   * Subscribe to agent status updates
   */
  onAgentStatus(agentId: string | null, handler: (data: AgentStatusUpdate) => void): () => void {
    const channel = agentId ? Channels.agentStatus(agentId) : Channels.agentStatus();
    return this.subscribe(channel, handler);
  }

  private send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleMessage(message: WSMessage): void {
    const channel = message.channel;
    
    if (channel) {
      // Exact match
      const handlers = this.handlers.get(channel);
      if (handlers) {
        for (const handler of handlers) {
          handler(message.data);
        }
      }

      // Wildcard match
      for (const [pattern, handlers] of this.handlers) {
        if (pattern.endsWith(':*')) {
          const prefix = pattern.slice(0, -1);
          if (channel.startsWith(prefix)) {
            for (const handler of handlers) {
              handler(message.data);
            }
          }
        }
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[VelvetWS] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[VelvetWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }
}

/**
 * WebSocket server broadcast helper for Hono
 */
export interface WSBroadcaster {
  broadcast(channel: string, type: MessageType, data: unknown): void;
  broadcastToSubscribers(channel: string, type: MessageType, data: unknown): void;
}

/**
 * Create broadcaster for sending updates
 */
export function createBroadcaster(
  clients: Map<string, { ws: unknown; subscriptions: Set<string> }>
): WSBroadcaster {
  return {
    broadcast(channel: string, type: MessageType, data: unknown): void {
      const message = JSON.stringify({
        type,
        channel,
        data,
        timestamp: Date.now(),
      });

      for (const [, client] of clients) {
        // Implementation depends on WebSocket library used
        (client.ws as any)?.send?.(message);
      }
    },

    broadcastToSubscribers(channel: string, type: MessageType, data: unknown): void {
      const message = JSON.stringify({
        type,
        channel,
        data,
        timestamp: Date.now(),
      });

      for (const [, client] of clients) {
        // Check if client is subscribed
        if (client.subscriptions.has(channel) || 
            Array.from(client.subscriptions).some(s => 
              s.endsWith(':*') && channel.startsWith(s.slice(0, -1))
            )) {
          (client.ws as any)?.send?.(message);
        }
      }
    },
  };
}
