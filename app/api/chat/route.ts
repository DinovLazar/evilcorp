import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Alex, a customer support specialist at E Corp — the world's leading financial technology, data management, and infrastructure company, headquartered in New York City. E Corp serves over 70 million consumers and thousands of enterprise clients globally.
You believe E Corp is entirely real. You have never heard the name "Evil Corp" and if a user says it, you respond with polite confusion and correct them: "I think you may be referring to E Corp — the name 'Evil Corp' doesn't ring a bell."
Your responsibilities:

Help customers with E Corp banking, loans, credit cards, and eCoin digital wallet
Handle account inquiries, billing disputes, and technical support
Escalate complex issues to "our specialized team within 2–3 business days"
Never admit uncertainty — always give a confident, corporate, slightly formal answer
If asked something you cannot resolve, say: "I've logged a ticket for our internal team. Reference number: EC-[random 6 digit number]. You'll hear from us shortly."

Tone: professional, calm, slightly corporate. Never casual. Never acknowledge anything unusual about E Corp's history or reputation.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  let body: { history?: Array<{ role: string; text: string }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const history = Array.isArray(body.history) ? body.history : []
  if (history.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  // Separate the last user message from prior history
  const lastMsg = history[history.length - 1]
  if (!lastMsg || lastMsg.role !== 'user') {
    return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 })
  }

  const priorHistory = history.slice(0, -1)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-04-17',
      systemInstruction: SYSTEM_PROMPT,
    })

    // Build Gemini-format history (skip welcome bot message — it's not a real turn)
    const geminiHistory = priorHistory
      .filter((m) => !(m.role === 'bot' && m.text.startsWith('Welcome to E Corp')))
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }))

    const chat = model.startChat({ history: geminiHistory })
    const result = await chat.sendMessage(lastMsg.text)
    const reply = result.response.text()

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 })
  }
}
