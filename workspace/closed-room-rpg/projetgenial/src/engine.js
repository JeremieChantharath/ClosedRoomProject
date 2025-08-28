// Un mini moteur data‑driven. Il lit data/world.json et rend le jeu.

export class GameEngine {
  constructor({ onRender }) {
    this.state = {
      world: null,
      currentRoomId: null,
      flags: {},
    };
    this.onRender = onRender;
  }

  async loadWorld(url = "./data/world.json") {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Impossible de charger le monde: " + res.status);
    const world = await res.json();
    this.state.world = world;
    this.state.currentRoomId = world.startRoomId;
    this.state.flags = world.flags || {};
    this.render();
  }

  get room() {
    return this.state.world.rooms.find(r => r.id === this.state.currentRoomId);
  }

  get npcsInRoom() {
    const ids = this.room.npcIds || [];
    return this.state.world.npcs.filter(n => ids.includes(n.id));
  }

  perform(action) {
    if (action.setFlag) {
      this.state.flags[action.setFlag.key] = action.setFlag.value;
    }
    if (action.moveTo) {
      this.state.currentRoomId = action.moveTo;
    }
    if (action.appendDialogue) {
      const d = this.room.dialogue || [];
      d.push(...action.appendDialogue);
      this.room.dialogue = d;
    }
    if (action.if && !this.evaluateCondition(action.if)) {
      // condition non satisfaite: ignorer les sous-actions
      return;
    }
    if (action.then) {
      for (const sub of action.then) this.perform(sub);
    }
    this.render();
  }

  evaluateCondition(cond) {
    // cond: { flagEquals: { key: string, value: any } }
    if (!cond) return true;
    if (cond.flagEquals) {
      const { key, value } = cond.flagEquals;
      return this.state.flags[key] === value;
    }
    return true;
  }

  render() {
    this.onRender({
      world: this.state.world,
      room: this.room,
      npcs: this.npcsInRoom,
      flags: this.state.flags,
    });
  }
}