import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { readme } = await req.json()

  const prompt = `Summarize the following GitHub README.md in 2-3 sentences:\n\n${readme}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  const summary = data.choices?.[0]?.message?.content || 'No summary generated.'
  return NextResponse.json({ summary })
}
