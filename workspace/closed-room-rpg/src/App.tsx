import { useEffect, useState } from 'react'
import './App.css'
import { loadStoryFromUrl } from './engine/loader'
import type { Story } from './engine/types'
import { GameView } from './engine/phaser/GameView'

function App() {
  const [story, setStory] = useState<Story | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStoryFromUrl('/story.example.json').then(setStory).catch((e) => setError(String(e)))
  }, [])

  if (error) return <div style={{ padding: 16 }}>Erreur: {error}</div>
  if (!story) return <div style={{ padding: 16 }}>Chargement de l'histoire…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <h1>{story.meta.title}</h1>
      <GameView story={story} />
      <p>Flèches ou WASD pour bouger.</p>
    </div>
  )
}

export default App
