import type * as Party from 'partykit/server';
import {
  GameState, ClientMessage, ServerMessage,
} from '../lib/game/types';
import {
  createInitialState, addPlayer, removePlayer, handleInput, processTick, startGame,
} from '../lib/game/logic';
import { TICK_INTERVAL_MS } from '../lib/game/constants';

export default class BombermanRoom implements Party.Server {
  state: GameState;
  interval: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {
    this.state = createInitialState();
  }

  onConnect(conn: Party.Connection) {
    if (Object.keys(this.state.players).length >= 4 && this.state.phase !== 'lobby') {
      conn.send(JSON.stringify({ type: 'full' } satisfies ServerMessage));
      conn.close();
      return;
    }
    const added = addPlayer(this.state, conn.id);
    if (!added) {
      conn.send(JSON.stringify({ type: 'full' } satisfies ServerMessage));
      conn.close();
      return;
    }
    conn.send(JSON.stringify({
      type: 'joined',
      playerId: conn.id,
      state: this.state,
    } satisfies ServerMessage));
    this.room.broadcast(
      JSON.stringify({ type: 'state', state: this.state } satisfies ServerMessage),
      [conn.id],
    );
  }

  onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== 'string') return;
    const msg = JSON.parse(message) as ClientMessage;

    switch (msg.type) {
      case 'setName': {
        const p = this.state.players[sender.id];
        if (p) p.name = msg.name.slice(0, 16);
        this.broadcast({ type: 'state', state: this.state });
        break;
      }
      case 'setMaxLives': {
        if (sender.id === this.state.hostId && this.state.phase === 'lobby') {
          this.state.maxLives = Math.max(1, Math.min(5, msg.lives));
          for (const p of Object.values(this.state.players)) p.lives = this.state.maxLives;
          this.broadcast({ type: 'state', state: this.state });
        }
        break;
      }
      case 'startGame': {
        if (sender.id === this.state.hostId && this.state.phase === 'lobby') {
          startGame(this.state);
          this.broadcast({ type: 'state', state: this.state });
          this.startLoop();
        }
        break;
      }
      case 'input': {
        handleInput(this.state, sender.id, msg.keys);
        break;
      }
      case 'restartGame': {
        if (sender.id === this.state.hostId && this.state.phase === 'gameover') {
          this.stopLoop();
          this.state = createInitialState();
          for (const id of this.room.getConnections ? [...this.room.getConnections()].map((c: Party.Connection) => c.id) : [sender.id]) {
            addPlayer(this.state, id);
          }
          this.broadcast({ type: 'state', state: this.state });
        }
        break;
      }
    }
  }

  onClose(conn: Party.Connection) {
    removePlayer(this.state, conn.id);
    if (Object.keys(this.state.players).length === 0) {
      this.stopLoop();
    } else {
      this.broadcast({ type: 'state', state: this.state });
    }
  }

  startLoop() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      processTick(this.state);
      this.broadcast({ type: 'tick', state: this.state });
      if (this.state.phase === 'gameover') this.stopLoop();
    }, TICK_INTERVAL_MS);
  }

  stopLoop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg));
  }
}
