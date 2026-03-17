'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import './ChatWidget.css'

interface Message {
  role: 'bot' | 'user'
  text: string
}

const WELCOME = "Welcome to E Corp Support. I'm Alex. How can I assist you today?"

const ECorpLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="E Corp">
    <text
      x="5"
      y="22"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="22"
      fontWeight="800"
      fill="white"
    >
      E
    </text>
  </svg>
)

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ role: 'bot', text: WELCOME }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px'
  }

  // Close on outside click
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (
      panelRef.current &&
      !panelRef.current.contains(e.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(e.target as Node)
    ) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick)
      setTimeout(() => textareaRef.current?.focus(), 100)
    } else {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open, handleOutsideClick])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: next.map((m) => ({ role: m.role, text: m.text })),
        }),
      })

      if (!res.ok) throw new Error('Request failed')

      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'I apologize — there was a connection issue. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        className="ecorp-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close E Corp Support' : 'Open E Corp Support'}
        aria-expanded={open}
      >
        <ECorpLogo />
      </button>

      {/* Chat panel */}
      {open && (
        <div ref={panelRef} className="ecorp-panel" role="dialog" aria-label="E Corp Support Chat">
          {/* Messages */}
          <div className="ecorp-messages" role="log" aria-live="polite">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`ecorp-bubble ${m.role === 'bot' ? 'ecorp-bubble--bot' : 'ecorp-bubble--user'}`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="ecorp-typing" aria-label="Alex is typing">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input row */}
          <div className="ecorp-input-row">
            <textarea
              ref={textareaRef}
              className="ecorp-textarea"
              placeholder="Message E Corp Support…"
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
              aria-label="Message input"
            />
            <button
              className="ecorp-send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>

          {/* Footer */}
          <div className="ecorp-footer">
            Powered by E Corp AI &middot; A Better Tomorrow, Today.
          </div>
        </div>
      )}
    </>
  )
}
