import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const fallbackReplies = [
  "We offer Ballet, Tap, Hip Hop, Lyrical, Contemporary, Acro, Tumbling, and Competition Teams. Private lessons are also available! 🩰",
  "Tuition starts at $25/month for Little Gems (ages 2.5–4) and $40/month for recreational levels 1–4. Unlimited classes are $150/month.",
  "Spring 2026 enrollment is open! You can book a FREE trial class — no commitment needed. Tap the 'Home' tab and look for the trial banner. 🎉",
  "We're at 5233 E Southern Ave, Suite C-101, Mesa AZ 85206. Call (480) 322-3911 anytime. 📍",
  "New students always get a FREE trial class — no pressure, no commitment. Just try it and see if you love it!",
  "Check the Studio Calendar in the parent resources section for all upcoming dates — holidays, picture days, and recital dates are all listed. 📅",
  "Recitals are a big deal here — real costumes, professional lighting, and full productions. We put everything into making it special. 🎭",
]

const defaultChips = [
  'What styles do you teach?',
  "What's the tuition?",
  'How do I book a free trial?',
  'Where is the studio?',
]

export default function UserChat() {
  const [messages, setMessages] = useState([])
  const [chips, setChips] = useState(defaultChips)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [settings, setSettings] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const replyIdx = useRef(0)

  useEffect(() => {
    supabase.from('chatbot_settings').select('*').single().then(({ data }) => {
      setSettings(data)
      const welcome = data?.welcome_message || "Hey! I'm Iris 🩰 Ask me anything about Dancers Ink — classes, recitals, tuition, you name it!"
      setMessages([{ id: 1, role: 'bot', text: welcome }])
      if (data?.quick_replies?.length) setChips(data.quick_replies)
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function getReply() {
    const pool = settings?.response_pool?.length ? settings.response_pool : fallbackReplies
    return pool[replyIdx.current++ % pool.length]
  }

  function sendMessage(text) {
    const t = text.trim()
    if (!t) return
    setChips([])
    setInput('')
    setMessages(m => [...m, { id: Date.now(), role: 'user', text: t }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(m => [...m, { id: Date.now() + 1, role: 'bot', text: getReply() }])
    }, 750 + Math.random() * 450)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div className="page-header" style={{ paddingTop: 'max(1rem, var(--safe-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--teal-dark), var(--teal))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', flexShrink: 0
          }}>🩰</div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--charcoal)' }}>Iris</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--soft)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', display: 'inline-block' }} />
              Studio assistant · always available
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1 }}>
        {messages.map(msg => (
          <div key={msg.id} className={`chat-msg ${msg.role === 'bot' ? 'chat-msg-bot' : 'chat-msg-user'}`}>
            {msg.text}
          </div>
        ))}

        {typing && (
          <div className="chat-typing">
            <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
          </div>
        )}

        {chips.length > 0 && !typing && (
          <div className="chat-chips">
            {chips.map(c => (
              <button key={c} className="chat-chip" onClick={() => sendMessage(c)}>{c}</button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row" style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom) + var(--nav-bottom-h))' }}>
        <input
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask anything about Dancers Ink…"
        />
        <button className="chat-send" onClick={() => sendMessage(input)}>→</button>
      </div>
    </div>
  )
}
