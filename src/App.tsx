import React, { useState, useRef, useEffect, useCallback } from 'react'

interface Track {
  id: number
  title: string
  artist: string
  duration: string
  cover: string
  color: string
  frequency: number
}

const TRACKS: Track[] = [
  { id: 1, title: 'Midnight Drive', artist: 'Synthwave Artist', duration: '3:42', cover: '🌙', color: '#6366f1', frequency: 220 },
  { id: 2, title: 'Ocean Breeze', artist: 'Chill Collective', duration: '4:15', cover: '🌊', color: '#0ea5e9', frequency: 261 },
  { id: 3, title: 'Desert Storm', artist: 'Electronic Duo', duration: '5:01', cover: '🏜️', color: '#f97316', frequency: 293 },
  { id: 4, title: 'Forest Rain', artist: 'Ambient Studio', duration: '3:28', cover: '🌲', color: '#22c55e', frequency: 329 },
  { id: 5, title: 'City Lights', artist: 'Urban Beat', duration: '4:33', cover: '🌃', color: '#a855f7', frequency: 349 },
]

export default function App() {
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const animRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const track = TRACKS[current]

  const stopAudio = useCallback(() => {
    if (oscRef.current) { try { oscRef.current.stop() } catch {} oscRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startAudio = useCallback(() => {
    stopAudio()
    if (!audioRef.current) audioRef.current = new AudioContext()
    const ctx = audioRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = TRACKS[current].frequency
    gain.gain.value = muted ? 0 : volume * 0.1
    osc.start()
    oscRef.current = osc; gainRef.current = gain
    timerRef.current = setInterval(() => {
      setProgress(p => { if (p >= 100) { stopAudio(); setPlaying(false); return 0 } return p + 0.5 })
    }, 200)
  }, [current, volume, muted, stopAudio])

  useEffect(() => {
    if (playing) startAudio()
    else stopAudio()
    return stopAudio
  }, [playing, current])

  useEffect(() => {
    if (gainRef.current && audioRef.current) {
      gainRef.current.gain.value = muted ? 0 : volume * 0.1
    }
  }, [volume, muted])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let frame = 0
    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const bars = 32
      for (let i = 0; i < bars; i++) {
        const h = playing ? (Math.sin(frame * 0.1 + i * 0.3) * 0.5 + 0.5) * 60 + 5 : 5
        const x = (i / bars) * canvas.width
        const w = canvas.width / bars - 2
        ctx.fillStyle = track.color + 'aa'
        ctx.fillRect(x, canvas.height - h, w, h)
      }
      frame++
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [playing, track.color])

  const next = () => { stopAudio(); setCurrent(c => shuffle ? Math.floor(Math.random() * TRACKS.length) : (c + 1) % TRACKS.length); setProgress(0) }
  const prev = () => { stopAudio(); setCurrent(c => (c - 1 + TRACKS.length) % TRACKS.length); setProgress(0) }
  const selectTrack = (i: number) => { stopAudio(); setCurrent(i); setProgress(0); setPlaying(true) }

  const s = {
    app: { minHeight: '100vh', background: '#0f0f1a', color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    player: { width: 380, background: '#1a1a2e', borderRadius: 24, overflow: 'hidden' as const, border: '1px solid #333' },
    cover: { height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, background: `linear-gradient(135deg, ${track.color}33, ${track.color}11)` },
    info: { padding: '1.25rem 1.5rem 0' },
    title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
    artist: { fontSize: 14, color: '#8b949e' },
    progressBar: { padding: '1rem 1.5rem 0', cursor: 'pointer' },
    bar: { height: 4, background: '#333', borderRadius: 2, cursor: 'pointer' },
    fill: { height: '100%', background: track.color, borderRadius: 2, width: `${progress}%`, transition: 'width 0.2s' },
    times: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginTop: 4 },
    controls: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '1rem 1.5rem' },
    playBtn: { width: 56, height: 56, borderRadius: '50%', background: track.color, border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    ctrlBtn: (active = false) => ({ background: 'none', border: 'none', color: active ? track.color : '#8b949e', cursor: 'pointer', fontSize: 20, padding: 8 }),
    volume: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 1.5rem 1rem' },
    playlist: { borderTop: '1px solid #333' },
    trackItem: (i: number) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 1.5rem', cursor: 'pointer', background: i === current ? '#ffffff0a' : 'transparent', transition: 'background 0.2s' }),
  }

  return (
    <div style={s.app}>
      <div style={s.player}>
        <div style={s.cover}>{track.cover}</div>
        <canvas ref={canvasRef} width={380} height={60} style={{ display: 'block', background: '#0f0f1a' }} />
        <div style={s.info}>
          <p style={s.title}>{track.title}</p>
          <p style={s.artist}>{track.artist}</p>
        </div>
        <div style={s.progressBar} onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          setProgress(((e.clientX - rect.left) / rect.width) * 100)
        }}>
          <div style={s.bar}><div style={s.fill} /></div>
          <div style={s.times}><span>0:{Math.floor(progress * 2.4).toString().padStart(2,'0')}</span><span>{track.duration}</span></div>
        </div>
        <div style={s.controls}>
          <button style={s.ctrlBtn(shuffle)} onClick={() => setShuffle(!shuffle)}>⇄</button>
          <button style={s.ctrlBtn()} onClick={prev}>⏮</button>
          <button style={s.playBtn} onClick={() => setPlaying(!playing)}>{playing ? '⏸' : '▶'}</button>
          <button style={s.ctrlBtn()} onClick={next}>⏭</button>
          <button style={s.ctrlBtn(repeat)} onClick={() => setRepeat(!repeat)}>↻</button>
        </div>
        <div style={s.volume}>
          <button style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 18 }} onClick={() => setMuted(!muted)}>{muted ? '🔇' : '🔊'}</button>
          <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={e => { setVolume(+e.target.value); setMuted(false) }} style={{ flex: 1, accentColor: track.color }} />
        </div>
        <div style={s.playlist}>
          {TRACKS.map((t, i) => (
            <div key={t.id} style={s.trackItem(i)} onClick={() => selectTrack(i)}>
              <span style={{ fontSize: 24 }}>{t.cover}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: i === current ? 600 : 400, color: i === current ? track.color : '#fff' }}>{t.title}</p>
                <p style={{ fontSize: 12, color: '#64748b' }}>{t.artist}</p>
              </div>
              <span style={{ fontSize: 12, color: '#64748b' }}>{t.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
