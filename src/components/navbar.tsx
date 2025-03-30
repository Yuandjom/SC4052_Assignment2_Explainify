'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'

export function Navbar() {
  const { theme, setTheme } = useTheme()

  return (
    <nav className="flex justify-between items-center p-4 border-b bg-background text-foreground">
      <Link href="/" className="text-xl font-bold text-primary">Explainify</Link>
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </nav>
  )
}
