;(function () {
  'use strict'

  // ─── Config ──────────────────────────────────────────────────────────────────
  var API_BASE = (function () {
    var scripts = document.querySelectorAll('script[data-ecorp-host]')
    if (scripts.length) return scripts[scripts.length - 1].getAttribute('data-ecorp-host').replace(/\/$/, '')
    // Auto-detect from script src
    var s = document.currentScript || (function () {
      var all = document.getElementsByTagName('script')
      return all[all.length - 1]
    })()
    if (s && s.src) {
      var u = new URL(s.src)
      return u.origin
    }
    return ''
  })()

  var WELCOME = "Welcome to E Corp Support. I'm Alex. How can I assist you today?"

  // ─── State ───────────────────────────────────────────────────────────────────
  var open = false
  var loading = false
  var messages = [{ role: 'bot', text: WELCOME }]

  // ─── Elements ────────────────────────────────────────────────────────────────
  var trigger, panel, messagesEl, textarea, sendBtn

  // ─── Styles ──────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ecorp-embed-styles')) return
    var style = document.createElement('style')
    style.id = 'ecorp-embed-styles'
    style.textContent = [
      '.ecw-trigger{position:fixed;bottom:24px;left:24px;width:56px;height:56px;border-radius:50%;background:#0a0a0a;border:2px solid #333;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2147483646;box-shadow:0 0 0 0 rgba(255,255,255,.35);animation:ecwPulse 2.5s infinite;transition:transform .15s;font-size:0;}',
      '.ecw-trigger:hover{transform:scale(1.08);}',
      '.ecw-trigger:active{transform:scale(.95);}',
      '@keyframes ecwPulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,.35)}60%{box-shadow:0 0 0 10px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}',
      '.ecw-panel{position:fixed;bottom:92px;left:24px;width:380px;max-width:calc(100vw - 48px);height:520px;max-height:calc(100vh - 120px);background:#0a0a0a;border:1px solid #222;border-radius:16px;display:flex;flex-direction:column;z-index:2147483645;overflow:hidden;transform-origin:bottom left;animation:ecwIn .2s cubic-bezier(.34,1.56,.64,1) forwards;}',
      '@keyframes ecwIn{from{opacity:0;transform:scale(.6) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}',
      '.ecw-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:#333 transparent;}',
      '.ecw-msgs::-webkit-scrollbar{width:4px}.ecw-msgs::-webkit-scrollbar-thumb{background:#333;border-radius:4px}',
      '.ecw-bubble{max-width:80%;padding:10px 14px;border-radius:14px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5;word-break:break-word;white-space:pre-wrap;}',
      '.ecw-bubble--bot{align-self:flex-start;background:#1a1a1a;color:#f0f0f0;border-bottom-left-radius:4px;}',
      '.ecw-bubble--user{align-self:flex-end;background:#e30613;color:#fff;border-bottom-right-radius:4px;}',
      '.ecw-typing{align-self:flex-start;background:#1a1a1a;border-radius:14px;border-bottom-left-radius:4px;padding:12px 16px;display:flex;gap:5px;align-items:center;}',
      '.ecw-typing span{width:6px;height:6px;background:#666;border-radius:50%;animation:ecwDot 1.2s infinite}',
      '.ecw-typing span:nth-child(2){animation-delay:.2s}.ecw-typing span:nth-child(3){animation-delay:.4s}',
      '@keyframes ecwDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}',
      '.ecw-input-row{display:flex;align-items:flex-end;gap:8px;padding:12px 16px 14px;border-top:1px solid #1a1a1a;background:#0a0a0a;}',
      '.ecw-textarea{flex:1;background:#111;border:1px solid #2a2a2a;border-radius:10px;color:#f0f0f0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5;padding:9px 12px;resize:none;outline:none;min-height:38px;max-height:96px;overflow-y:auto;box-sizing:border-box;}',
      '.ecw-textarea::placeholder{color:#555}.ecw-textarea:focus{border-color:#444}',
      '.ecw-send{width:38px;height:38px;border-radius:10px;background:#e30613;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,transform .1s;}',
      '.ecw-send:hover:not(:disabled){background:#c8050f}.ecw-send:active:not(:disabled){transform:scale(.93)}.ecw-send:disabled{opacity:.4;cursor:not-allowed}',
      '.ecw-footer{text-align:center;font-family:system-ui,-apple-system,sans-serif;font-size:10px;color:#444;padding:0 16px 10px;letter-spacing:.02em}',
    ].join('')
    document.head.appendChild(style)
  }

  // ─── DOM Builders ────────────────────────────────────────────────────────────
  function buildTrigger() {
    trigger = document.createElement('button')
    trigger.className = 'ecw-trigger'
    trigger.setAttribute('aria-label', 'Open E Corp Support')
    trigger.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><text x="5" y="22" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="800" fill="white">E</text></svg>'
    trigger.addEventListener('click', togglePanel)
    document.body.appendChild(trigger)
  }

  function buildPanel() {
    panel = document.createElement('div')
    panel.className = 'ecw-panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', 'E Corp Support Chat')

    messagesEl = document.createElement('div')
    messagesEl.className = 'ecw-msgs'
    messagesEl.setAttribute('role', 'log')
    messagesEl.setAttribute('aria-live', 'polite')

    var inputRow = document.createElement('div')
    inputRow.className = 'ecw-input-row'

    textarea = document.createElement('textarea')
    textarea.className = 'ecw-textarea'
    textarea.placeholder = 'Message E Corp Support\u2026'
    textarea.rows = 1
    textarea.setAttribute('aria-label', 'Message input')
    textarea.addEventListener('input', function () {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px'
    })
    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    })

    sendBtn = document.createElement('button')
    sendBtn.className = 'ecw-send'
    sendBtn.setAttribute('aria-label', 'Send message')
    sendBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    sendBtn.disabled = true
    sendBtn.addEventListener('click', sendMessage)

    textarea.addEventListener('input', function () {
      sendBtn.disabled = !textarea.value.trim() || loading
    })

    inputRow.appendChild(textarea)
    inputRow.appendChild(sendBtn)

    var footer = document.createElement('div')
    footer.className = 'ecw-footer'
    footer.textContent = 'Powered by E Corp AI \u00b7 A Better Tomorrow, Today.'

    panel.appendChild(messagesEl)
    panel.appendChild(inputRow)
    panel.appendChild(footer)

    renderMessages()
    document.body.appendChild(panel)
    setTimeout(function () { textarea.focus() }, 100)

    document.addEventListener('mousedown', outsideClickHandler)
  }

  function outsideClickHandler(e) {
    if (panel && !panel.contains(e.target) && trigger && !trigger.contains(e.target)) {
      closePanel()
    }
  }

  function togglePanel() {
    open ? closePanel() : openPanel()
  }

  function openPanel() {
    open = true
    trigger.setAttribute('aria-label', 'Close E Corp Support')
    trigger.setAttribute('aria-expanded', 'true')
    buildPanel()
  }

  function closePanel() {
    open = false
    trigger.setAttribute('aria-label', 'Open E Corp Support')
    trigger.removeAttribute('aria-expanded')
    document.removeEventListener('mousedown', outsideClickHandler)
    if (panel) {
      panel.remove()
      panel = null
    }
  }

  // ─── Rendering ───────────────────────────────────────────────────────────────
  function renderMessages() {
    if (!messagesEl) return
    messagesEl.innerHTML = ''
    messages.forEach(function (m) {
      var div = document.createElement('div')
      div.className = 'ecw-bubble ' + (m.role === 'bot' ? 'ecw-bubble--bot' : 'ecw-bubble--user')
      div.textContent = m.text
      messagesEl.appendChild(div)
    })
    if (loading) {
      var typing = document.createElement('div')
      typing.className = 'ecw-typing'
      typing.setAttribute('aria-label', 'Alex is typing')
      typing.innerHTML = '<span></span><span></span><span></span>'
      messagesEl.appendChild(typing)
    }
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  // ─── Send ─────────────────────────────────────────────────────────────────────
  function sendMessage() {
    if (!textarea) return
    var text = textarea.value.trim()
    if (!text || loading) return

    messages.push({ role: 'user', text: text })
    textarea.value = ''
    textarea.style.height = 'auto'
    sendBtn.disabled = true
    loading = true
    renderMessages()

    fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: messages }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed')
        return res.json()
      })
      .then(function (data) {
        messages.push({ role: 'bot', text: data.reply })
      })
      .catch(function () {
        messages.push({ role: 'bot', text: 'I apologize \u2014 there was a connection issue. Please try again.' })
      })
      .finally(function () {
        loading = false
        sendBtn.disabled = !textarea || !textarea.value.trim()
        renderMessages()
        if (textarea) textarea.focus()
      })
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    injectStyles()
    buildTrigger()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
