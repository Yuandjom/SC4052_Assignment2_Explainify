// app/api/explain/route.ts
import { NextRequest, NextResponse } from 'next/server'

type RoleType = 'intern' | 'newgrad' | 'senior' | 'pm' | 'designer'

const rolePrompt: Record<RoleType, string> = {
  intern: 'Explain the code like I am an intern with little experience.',
  newgrad: 'Explain the structure and patterns as if to a new graduate developer.',
  senior: 'Explain the architecture, performance, and design decisions like to a senior developer.',
  pm: 'Explain the high-level purpose and user flows like to a product manager.',
  designer: 'Explain what the UI does and how it might impact user experience, like to a designer.',
}

export async function POST(req: NextRequest) {
  try {
    const { code, role } = await req.json()

    const validRoles: RoleType[] = ['intern', 'newgrad', 'senior', 'pm', 'designer']

    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 })
    }

    // TypeScript now knows role is RoleType
    const typedRole = role as RoleType
    const prompt = `${rolePrompt[typedRole]}\n\nCode:\n${code}`

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
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

    const data = await openaiRes.json()

    if (data?.choices?.[0]?.message?.content) {
      return NextResponse.json({ explanation: data.choices[0].message.content })
    } else {
      return NextResponse.json({ error: data?.error?.message || 'Unknown error' }, { status: 500 })
    }
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Server error occurred.' }, { status: 500 })
  }
}
