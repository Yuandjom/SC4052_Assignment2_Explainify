'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [repos, setRepos] = useState([])

  const fetchRepos = async () => {
    const res = await fetch(`https://api.github.com/users/${username}/repos`, {
      headers: {
        Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`
      }
    })
    const data = await res.json()
    setRepos(data)
  }

  return (
    <div className="p-10 max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">🔍 Explainify</h1>
      <Input
        placeholder="Enter GitHub username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <Button onClick={fetchRepos}>Search Repositories</Button>

      <div className="space-y-2">
        {repos.map((repo: any) => (
          <div key={repo.id} className="border p-2 rounded">
            <a href={`/repo/${repo.owner.login}/${repo.name}`} className="text-blue-500">
              {repo.name}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
