import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameState, Scene, Story, Vector2 } from './types';

const TILE_COLORS: Record<string, string> = {
  '#': '#2a2d39',
  '.': '#151724',
  'o': '#404457',
  'D': '#7a4a2a',
  'E': '#2c6e49',
};

function getScene(story: Story, id: string): Scene {
  const s = story.scenes.find((sc) => sc.id === id);
  if (!s) throw new Error(`Scene not found: ${id}`);
  return s;
}

function isWalkable(ch: string): boolean {
  if (ch === '#') return false;
  return true;
}

function clampToGrid(pos: Vector2, scene: Scene): Vector2 {
  return {
    x: Math.max(0, Math.min(scene.width - 1, pos.x)),
    y: Math.max(0, Math.min(scene.height - 1, pos.y)),
  };
}

export function GameCanvas({ story }: { story: Story }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<GameState>(() => {
    const first = story.scenes[0];
    return {
      story,
      currentSceneId: first.id,
      player: { ...first.playerStart },
      inventory: { keys: new Set<string>() },
    };
  });

  const scene = useMemo(() => getScene(state.story, state.currentSceneId), [state.story, state.currentSceneId]);
  const tileSize = story.tileset.tileSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = scene.width * tileSize;
    canvas.height = scene.height * tileSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw grid with checker floor and shaded walls
    for (let y = 0; y < scene.height; y++) {
      const row = scene.grid[y];
      for (let x = 0; x < scene.width; x++) {
        const ch = row[x] ?? '.';
        if (ch === '#') {
          // wall block with top highlight and side shadow
          ctx.fillStyle = TILE_COLORS['#'];
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, 3);
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(x * tileSize + tileSize - 3, y * tileSize, 3, tileSize);
        } else {
          // floor checker
          const base = TILE_COLORS['.'];
          ctx.fillStyle = base;
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          }
        }
      }
    }

    // Draw objects as bright squares
    for (const obj of scene.objects) {
      const color = obj.type === 'door' ? '#c1864a' : obj.type === 'key' ? '#f0e45a' : obj.type === 'note' ? '#5ab0ff' : '#55cc88';
      // outline
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(obj.x * tileSize + 1, obj.y * tileSize + 1, tileSize - 2, tileSize - 2);
      ctx.fillStyle = color;
      ctx.fillRect(obj.x * tileSize + 3, obj.y * tileSize + 3, tileSize - 6, tileSize - 6);
    }

    // Draw player
    // Player with dark outline
    const px = state.player.x * tileSize;
    const py = state.player.y * tileSize;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(px + 3, py + 3, tileSize - 6, tileSize - 6);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(px + 4, py + 4, tileSize - 8, tileSize - 8);
  }, [scene, state.player, tileSize]);

  const tryMove = useCallback((dx: number, dy: number) => {
    setState((prev) => {
      const sc = getScene(prev.story, prev.currentSceneId);
      const target = clampToGrid({ x: prev.player.x + dx, y: prev.player.y + dy }, sc);
      const ch = sc.grid[target.y][target.x];
      if (!isWalkable(ch)) return prev;
      return { ...prev, player: target };
    });
  }, []);

  const interact = useCallback(() => {
    setState((prev) => {
      const sc = getScene(prev.story, prev.currentSceneId);
      const near = sc.objects.find((o) => Math.abs(o.x - prev.player.x) + Math.abs(o.y - prev.player.y) === 1);
      if (!near) return prev;

      if (near.type === 'note') {
        alert(near.text);
        return prev;
      }

      if (near.type === 'key') {
        const keys = new Set(prev.inventory.keys);
        keys.add(near.keyId);
        const newScene = { ...sc, objects: sc.objects.filter((o) => o.id !== near.id) };
        const story = { ...prev.story, scenes: prev.story.scenes.map((s) => (s.id === sc.id ? newScene : s)) };
        return { ...prev, story, inventory: { keys } };
      }

      if (near.type === 'door') {
        const hasKey = near.keyId ? prev.inventory.keys.has(near.keyId) : true;
        if (near.locked && !hasKey) {
          alert("La porte est verrouillée.");
          return prev;
        }
        const nextScene = getScene(prev.story, near.toScene);
        return { ...prev, currentSceneId: near.toScene, player: { ...near.to } };
      }

      if (near.type === 'exit') {
        alert(near.text ?? 'Sortie');
        return prev;
      }

      return prev;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') tryMove(0, -1);
      else if (e.key === 'ArrowDown' || e.key === 's') tryMove(0, 1);
      else if (e.key === 'ArrowLeft' || e.key === 'a') tryMove(-1, 0);
      else if (e.key === 'ArrowRight' || e.key === 'd') tryMove(1, 0);
      else if (e.key === 'e' || e.key === 'Enter') interact();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tryMove]);

  return (
    <canvas
      ref={canvasRef}
      style={{ imageRendering: 'pixelated', border: '1px solid #333' }}
    />
  );
}

