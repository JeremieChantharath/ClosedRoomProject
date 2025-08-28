export type Vector2 = { x: number; y: number };

export type StoryMeta = {
  title: string;
  version: number;
};

export type Tileset = {
  tileSize: number; // pixels used to render
  theme: 'mono' | 'color';
  // Optional external image-based tileset
  image?: string; // e.g., '/assets/tiles.png'
  frameWidth?: number; // e.g., 16, 24, 32
  frameHeight?: number;
  margin?: number;
  spacing?: number;
  // Default frames
  floorFrame?: number; // base tile frame index
  wallFrame?: number; // frame for '#'
  // Per-symbol mapping from grid char to frame index
  symbolFrames?: Record<string, number>;
};

export type SceneGridRow = string; // e.g., "#..o.."

export type BaseObject = {
  id: string;
  type: string;
  x: number;
  y: number;
};

export type NoteObject = BaseObject & {
  type: 'note';
  text: string;
};

export type KeyObject = BaseObject & {
  type: 'key';
  keyId: string;
};

export type DoorObject = BaseObject & {
  type: 'door';
  locked: boolean;
  keyId?: string;
  toScene: string;
  to: Vector2;
};

export type ExitObject = BaseObject & {
  type: 'exit';
  text?: string;
};

export type SceneObject = NoteObject | KeyObject | DoorObject | ExitObject;

export type Scene = {
  id: string;
  name: string;
  width: number;
  height: number;
  playerStart: Vector2;
  grid: SceneGridRow[]; // width chars each, height rows
  objects: SceneObject[];
};

export type Story = {
  meta: StoryMeta;
  tileset: Tileset;
  scenes: Scene[];
};

export type Inventory = {
  keys: Set<string>;
};

export type GameState = {
  story: Story;
  currentSceneId: string;
  player: Vector2;
  inventory: Inventory;
};

