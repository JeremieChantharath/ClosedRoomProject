import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import type { Story } from '../types'

class ClosedRoomScene extends Phaser.Scene {
  private story!: Story
  private currentSceneId!: string
  private tileSize!: number
  private player!: Phaser.GameObjects.Image
  private playerGrid = { x: 0, y: 0 }
  private isMoving = false
  private useGeneratedTiles = true
  preload() {
    // Load external tileset if defined in story
    const ts = this.story?.tileset
    if (ts?.image && ts.frameWidth && ts.frameHeight) {
      this.load.spritesheet('tileset', ts.image, {
        frameWidth: ts.frameWidth,
        frameHeight: ts.frameHeight,
        margin: ts.margin ?? 0,
        spacing: ts.spacing ?? 0,
      })
      this.load.on(Phaser.Loader.Events.FILE_COMPLETE, (key: string) => {
        if (key === 'tileset') this.useGeneratedTiles = false
      })
      this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: any) => {
        if (file.key === 'tileset') this.useGeneratedTiles = true
      })
    }
  }

  constructor() {
    super('ClosedRoomScene')
  }

  init(data: { story: Story }) {
    this.story = data.story
    this.currentSceneId = this.story.scenes[0].id
    this.tileSize = this.story.tileset.tileSize
  }

  create() {
    this.drawScene()
    this.input.keyboard?.on('keydown', (evt: KeyboardEvent) => {
      const key = evt.key.toLowerCase()
      const d = { x: 0, y: 0 }
      if (key === 'arrowup' || key === 'w') d.y = -1
      else if (key === 'arrowdown' || key === 's') d.y = 1
      else if (key === 'arrowleft' || key === 'a') d.x = -1
      else if (key === 'arrowright' || key === 'd') d.x = 1
      if (d.x !== 0 || d.y !== 0) {
        this.tryMove(d.x, d.y)
      }
    })
  }

  private get current() {
    const sc = this.story.scenes.find(s => s.id === this.currentSceneId)
    if (!sc) throw new Error('Scene not found')
    return sc
  }

  private drawScene() {
    this.cameras.main.setBackgroundColor(0x0f1014)
    this.add.rectangle(0, 0, 10000, 10000, 0x0f1014).setOrigin(0)
    const sc = this.current
    const size = this.tileSize
    if (this.useGeneratedTiles) {
      this.createTilesTexture()
    }

    // grid
    for (let y = 0; y < sc.height; y++) {
      for (let x = 0; x < sc.width; x++) {
        const ch = sc.grid[y][x]
        // base floor
        const floorFrame = this.story.tileset.floorFrame ?? 0
        if (this.useGeneratedTiles) this.add.image(x * size + size/2, y * size + size/2, 'tiles', floorFrame)
        else this.add.image(x * size + size/2, y * size + size/2, 'tileset', floorFrame)
        // overlay according to tile type
        if (ch === '#') {
          const frame = this.story.tileset.wallFrame ?? 1
          this.add.image(x * size + size/2, y * size + size/2, this.useGeneratedTiles ? 'tiles' : 'tileset', frame)
        } else if (ch === 'C') { // couch
          const frame = this.story.tileset.symbolFrames?.['C'] ?? 7
          this.add.image(x * size + size/2, y * size + size/2, this.useGeneratedTiles ? 'tiles' : 'tileset', frame)
        } else if (ch === 'T') { // tv stand
          const frame = this.story.tileset.symbolFrames?.['T'] ?? 3
          this.add.image(x * size + size/2, y * size + size/2, this.useGeneratedTiles ? 'tiles' : 'tileset', frame)
        } else if (ch === 'S') { // shelf/books
          const frame = this.story.tileset.symbolFrames?.['S'] ?? 4
          this.add.image(x * size + size/2, y * size + size/2, this.useGeneratedTiles ? 'tiles' : 'tileset', frame)
        } else if (ch === 'R') {
          const frame = this.story.tileset.symbolFrames?.['R'] ?? 5
          this.add.image(x * size + size/2, y * size + size/2, this.useGeneratedTiles ? 'tiles' : 'tileset', frame)
        } else if (ch === 'D') { // door
          const frame = this.story.tileset.symbolFrames?.['D'] ?? 6
          this.add.image(x * size + size/2, y * size + size/2, this.useGeneratedTiles ? 'tiles' : 'tileset', frame)
        } else if (ch === 'V') { // TV screen
          const frame = this.story.tileset.symbolFrames?.['V'] ?? 8
          this.add.image(x * size + size/2, y * size + size/2, this.useGeneratedTiles ? 'tiles' : 'tileset', frame)
        } else if (ch === 'W') { // window
          const frame = this.story.tileset.symbolFrames?.['W'] ?? 9
          this.add.image(x * size + size/2, y * size + size/2, this.useGeneratedTiles ? 'tiles' : 'tileset', frame)
        }
      }
    }

    // objects
    for (const obj of sc.objects) {
      const color = obj.type === 'door' ? 0xc1864a : obj.type === 'key' ? 0xf0e45a : obj.type === 'note' ? 0x5ab0ff : 0x55cc88
      this.add.rectangle(obj.x * size + 1, obj.y * size + 1, size - 2, size - 2, 0x000000, 0.6).setOrigin(0)
      this.add.rectangle(obj.x * size + 3, obj.y * size + 3, size - 6, size - 6, color).setOrigin(0)
    }

    // player sprite (generated texture)
    this.createHeroTexture()
    const p = sc.playerStart
    this.playerGrid = { x: p.x, y: p.y }
    this.player = this.add.image(p.x * size + size / 2, p.y * size + size / 2, 'hero')
    this.player.setOrigin(0.5)
    this.player.setScale(Math.max(1, size / 16))
    this.cameras.main.setViewport(0, 0, sc.width * size, sc.height * size)
  }

  private createTilesTexture() {
    if (this.textures.exists('tiles')) return
    const unit = 16
    const cols = 10
    const rows = 1
    const tex = this.textures.createCanvas('tiles', unit * cols, unit * rows)
    const ctx = tex.getContext()
    const drawFloor = (x: number) => {
      ctx.fillStyle = '#151724'
      ctx.fillRect(x, 0, unit, unit)
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      for (let yy = 0; yy < unit; yy += 4) {
        for (let xx = 0; xx < unit; xx += 4) {
          if (((xx + yy) / 4) % 2 === 0) ctx.fillRect(x + xx, yy, 4, 4)
        }
      }
    }
    // frame 0: floor
    drawFloor(0)
    // frame 1: wall
    ctx.fillStyle = '#2a2d39'; ctx.fillRect(unit * 1, 0, unit, unit)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(unit * 1, 0, unit, 3)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(unit * 1 + unit - 3, 0, 3, unit)
    // frame 2: bed
    drawFloor(unit * 2)
    ctx.fillStyle = '#5a3e2b'; ctx.fillRect(unit * 2 + 1, 8, unit - 2, 7)
    ctx.fillStyle = '#8bd3ff'; ctx.fillRect(unit * 2 + 2, 2, unit - 4, 6)
    // frame 3: table
    drawFloor(unit * 3)
    ctx.fillStyle = '#6b4d2e'; ctx.fillRect(unit * 3 + 3, 5, unit - 6, 8)
    ctx.fillStyle = '#3a2a18'; ctx.fillRect(unit * 3 + 3, 12, unit - 6, 2)
    // frame 4: shelf
    drawFloor(unit * 4)
    ctx.fillStyle = '#6b4d2e'; ctx.fillRect(unit * 4 + 2, 2, unit - 4, unit - 4)
    ctx.fillStyle = '#caa66a'; ctx.fillRect(unit * 4 + 3, 4, unit - 6, 3)
    ctx.fillRect(unit * 4 + 3, 9, unit - 6, 3)
    // frame 5: rug
    drawFloor(unit * 5)
    ctx.fillStyle = '#913d3d'; ctx.fillRect(unit * 5 + 2, 2, unit - 4, unit - 4)
    ctx.fillStyle = '#b95a5a'; ctx.fillRect(unit * 5 + 4, 4, unit - 8, unit - 8)
    // frame 6: door
    drawFloor(unit * 6)
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(unit * 6 + 3, 1, unit - 6, unit - 2)
    ctx.fillStyle = '#e6d200'; ctx.fillRect(unit * 6 + unit - 6, 8, 2, 2)
    // frame 7: couch
    drawFloor(unit * 7)
    ctx.fillStyle = '#2d5d5d'; ctx.fillRect(unit * 7 + 1, 5, unit - 2, 9)
    ctx.fillStyle = '#3a7a7a'; ctx.fillRect(unit * 7 + 1, 3, unit - 2, 4)
    // frame 8: TV
    drawFloor(unit * 8)
    ctx.fillStyle = '#1b1e27'; ctx.fillRect(unit * 8 + 2, 2, unit - 4, 10)
    ctx.fillStyle = '#2f3342'; ctx.fillRect(unit * 8 + 3, 3, unit - 6, 8)
    ctx.fillStyle = '#6b6f80'; ctx.fillRect(unit * 8 + 6, 11, 4, 2)
    // frame 9: Window
    drawFloor(unit * 9)
    ctx.fillStyle = '#d6dee6'; ctx.fillRect(unit * 9 + 2, 2, unit - 4, unit - 6)
    ctx.fillStyle = '#8bd3ff'; ctx.fillRect(unit * 9 + 3, 3, unit - 6, unit - 8)
    ctx.fillStyle = '#cfcfcf'; ctx.fillRect(unit * 9 + 2, 8, unit - 4, 2)
    tex.refresh()
    this.anims.remove('noop')
  }

  private tryMove(dx: number, dy: number) {
    if (this.isMoving) return
    const sc = this.current
    const size = this.tileSize
    const nx = Math.max(0, Math.min(sc.width - 1, this.playerGrid.x + dx))
    const ny = Math.max(0, Math.min(sc.height - 1, this.playerGrid.y + dy))
    if (sc.grid[ny][nx] === '#') return
    this.isMoving = true
    this.playerGrid = { x: nx, y: ny }
    this.tweens.add({
      targets: this.player,
      x: nx * size + size / 2,
      y: ny * size + size / 2,
      duration: 120,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.isMoving = false
      },
    })
  }

  private createHeroTexture() {
    if (this.textures.exists('hero')) return
    const size = 16
    const tex = this.textures.createCanvas('hero', size, size)
    const ctx = tex.getContext()
    // clear
    ctx.clearRect(0, 0, size, size)
    // shadow outline
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(2, 2, 12, 12)
    // body
    // head
    ctx.fillStyle = '#f2d6b3'
    ctx.fillRect(5, 2, 6, 5)
    // hair/hat
    ctx.fillStyle = '#3a405a'
    ctx.fillRect(4, 1, 8, 2)
    // torso
    ctx.fillStyle = '#5ab0ff'
    ctx.fillRect(4, 7, 8, 5)
    // legs
    ctx.fillStyle = '#2c2f3f'
    ctx.fillRect(4, 12, 3, 3)
    ctx.fillRect(9, 12, 3, 3)
    tex.refresh()
  }
}

export function GameView({ story }: { story: Story }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!ref.current) return
    const size = story.tileset.tileSize
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: ref.current,
      width: story.scenes[0].width * size,
      height: story.scenes[0].height * size,
      pixelArt: true,
      backgroundColor: '#0f1014',
      scene: [ClosedRoomScene],
    }
    const game = new Phaser.Game(config)
    game.scene.start('ClosedRoomScene', { story })
    return () => {
      game.destroy(true)
    }
  }, [story])
  return <div ref={ref} />
}


