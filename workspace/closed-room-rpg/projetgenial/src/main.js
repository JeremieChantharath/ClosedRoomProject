import { GameEngine } from "./engine.js";

const $ = (sel) => document.querySelector(sel);
const appTitle = $("#game-title");
const meta = $("#meta");
const roomEl = $("#room");
const charsEl = $("#characters");
const dialogueEl = $("#dialogue");
const actionsEl = $("#actions");
const statusEl = $("#status");

const engine = new GameEngine({ onRender });

$('#reload').addEventListener('click', () => engine.loadWorld().catch(handleErr));

engine.loadWorld().catch(handleErr);

function handleErr(err) {
  console.error(err);
  statusEl.textContent = "Erreur: " + err.message;
}

function onRender({ world, room, npcs, flags }) {
  appTitle.textContent = world.title || 'Jeu web — Prompt‑driven';
  meta.textContent = world.subtitle || '';

  // Room
  roomEl.innerHTML = `<h2>${room.title}</h2><p>${room.description}</p>`;

  // NPCs
  charsEl.innerHTML = '';
  for (const n of npcs) {
    const div = document.createElement('div');
    div.className = 'npc';
    const initials = (n.name.match(/\b\p{L}/gu) || []).slice(0,2).join('').toUpperCase();
    div.innerHTML = `<div class="portrait">${initials}</div>
      <div>
        <strong>${n.name}</strong>
        <div class="role">${n.role || ''}</div>
      </div>`;
    charsEl.appendChild(div);
  }

  // Dialogue
  dialogueEl.innerHTML = '';
  for (const line of room.dialogue || []) {
    const p = document.createElement('p');
    p.className = 'line';
    p.textContent = `${line.speaker}: ${line.text}`;
    dialogueEl.appendChild(p);
  }

  // Actions
  actionsEl.innerHTML = '';
  for (const a of room.actions || []) {
    if (a.if && !engine.evaluateCondition(a.if)) continue; // actions conditionnelles
    const btn = document.createElement('button');
    btn.textContent = a.label;
    btn.addEventListener('click', () => engine.perform(a));
    actionsEl.appendChild(btn);
  }

  // Status
  statusEl.textContent = `Room: ${room.id} | Flags: ${JSON.stringify(flags)}`;
}