import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Room({ room, name, onLeave }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    supabase
      .from('messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (mounted && !error && !loadedRef.current) {
          loadedRef.current = true
          setMessages(data || [])
        }
      })

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === payload.new.id)
              ? prev
              : [...prev, payload.new]
          )
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      mounted = false
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [room.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async (e) => {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setText('')
    const { error } = await supabase
      .from('messages')
      .insert({ room_id: room.id, sender_name: name, content })
    if (error) alert('Failed to send: ' + error.message)
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      alert('Copy failed. Your room code is: ' + room.code)
    }
  }

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="card chat">
      <header className="chat-header">
        <div className="room-info">
          <span className="room-code">{room.code}</span>
          <button className="link" onClick={copyCode}>
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
        <button className="btn ghost" onClick={onLeave}>
          Leave room
        </button>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <p className="empty">
            No messages yet. Share the code <strong>{room.code}</strong> and start
            chatting!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_name === name
          return (
            <div key={m.id} className={`bubble ${mine ? 'mine' : 'theirs'}`}>
              <div className="bubble-head">
                <span className="sender">{m.sender_name}</span>
                <span className="time">{formatTime(m.created_at)}</span>
              </div>
              <div className="bubble-text">{m.content}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={send}>
        <input
          type="text"
          placeholder={`Message as ${name}`}
          value={text}
          maxLength={1000}
          autoFocus
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn primary" type="submit" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}