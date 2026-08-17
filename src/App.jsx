import { useState } from 'react'
import Home from './components/Home.jsx'
import Room from './components/Room.jsx'

export default function App() {
  const [room, setRoom] = useState(null)
  const [name, setName] = useState('')

  return room ? (
    <Room room={room} name={name} onLeave={() => setRoom(null)} />
  ) : (
    <Home name={name} setName={setName} onEnterRoom={setRoom} />
  )
}