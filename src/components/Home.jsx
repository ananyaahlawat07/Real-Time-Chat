import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(len = 6) {
  let code = ''
  for (let i = 0; i < len; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

export default function Home({ name, setName, onEnterRoom }) {
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const requireName = (action) => {
    if (!name.trim()) {
      setError('Enter your name first.')
      return false
    }
    return true
  }

  const createRoom = async () => {
    if (!requireName()) return
    setBusy(true)
    setError('')

    for (let attempt = 0; attempt < 10; attempt++) {
      const code = generateCode()
      const { data, error } = await supabase
        .from('rooms')
        .insert({ code })
        .select()
        .single()

      if (error) {
        setBusy(false)
        if (error.code === '23505') continue
        setError(error.message)
        return
      }
      onEnterRoom(data)
      return
    }

    setBusy(false)
    setError('Could not generate a unique code. Try again.')
  }

  const joinRoom = async (e) => {
    e.preventDefault()
    if (!requireName()) return
    setBusy(true)
    setError('')

    const code = joinCode.trim().toUpperCase()
    if (!code) {
      setBusy(false)
      setError('Enter the room code you received.')
      return
    }

    const { data, error } = await supabase
      .from('rooms')
      .select()
      .eq('code', code)
      .maybeSingle()

    setBusy(false)
    if (error) return setError(error.message)
    if (!data) return setError('No room found with that code.')
    onEnterRoom(data)
  }

  return (
    <div className="card home">
      <h1>Realtime Chat</h1>
      <p className="tagline">Create a room, share the code, chat live.</p>

      <label className="field">
        <span>Your name</span>
        <input
          type="text"
          placeholder="e.g. Alice"
          value={name}
          maxLength={24}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <button className="btn primary" onClick={createRoom} disabled={busy}>
        {busy ? 'Creating...' : 'Create a room'}
      </button>

      <div className="divider">
        <span>or</span>
      </div>

      <form className="field" onSubmit={joinRoom}>
        <span>Join with a code</span>
        <div className="join-row">
          <input
            type="text"
            placeholder="Enter 6-letter code"
            value={joinCode}
            maxLength={8}
            style={{ textTransform: 'uppercase' }}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <button className="btn secondary" type="submit" disabled={busy}>
            {busy ? 'Joining...' : 'Join'}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  )
}