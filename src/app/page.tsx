'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { GithubIcon } from 'lucide-react'
import debounce from 'lodash.debounce'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [repos, setRepos] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selected, setSelected] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const reposPerPage = 9
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Auto-suggestions
// Fetch real GitHub users (debounced)
  useEffect(() => {
    if (username.length < 2) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = debounce(async () => {
      try {
        const res = await fetch(`https://api.github.com/search/users?q=${username}&per_page=5`, {
          headers: {
            Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`
          }
        })
        const data = await res.json()
        const logins = data.items?.map((user: any) => user.login) || []
        setSuggestions(logins)
      } catch (err) {
        console.error('❌ Error fetching user suggestions:', err)
        setSuggestions([])
      }
    }, 300) // wait 300ms after last keystroke

    fetchSuggestions()

    return () => {
      fetchSuggestions.cancel?.() // cleanup on unmount/next input
    }
  }, [username])

  // Fetch repos and profile summary
  const fetchRepos = async () => {
    setLoading(true) // <-- Start loading
    try {
      const res = await fetch(`https://api.github.com/users/${username}/repos`, {
        headers: { Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}` },
      })
      const data = await res.json()
      setRepos(data)
      setSelected(true)
      setCurrentPage(1)
  
      if (data.length === 0) {
        setSummary(null)
        return
      }
  
      const readmeRes = await fetch(`https://api.github.com/repos/${username}/${username}/readme`, {
        headers: { Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}` },
      })
  
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json()
        const decoded = atob(readmeData.content)
        const summaryRes = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ readme: decoded }),
        })
        const summaryData = await summaryRes.json()
        setSummary(summaryData.summary)
      } else {
        setSummary('No profile README found in user repositories.')
      }
  
    } catch (err) {
      console.error('❌ Error fetching profile or summary:', err)
      setSummary(null)
    } finally {
      setLoading(false) // <-- End loading
    }
  }
  
  

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setSelected(true)
      setSuggestions([]) 
      fetchRepos()
    }
  }
  
  

  // Pagination
  const paginatedRepos = repos.slice((currentPage - 1) * reposPerPage, currentPage * reposPerPage)
  const totalPages = Math.ceil(repos.length / reposPerPage)

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">🔍 Explainify</h1>
          <p className="text-muted-foreground">Search any GitHub username and explore repositories with AI code explanations.</p>
        </div>

        {/* Search Row */}
        <div className="flex gap-4 items-start max-w-xl mx-auto">
          <div className="relative w-full">
            <Input
              placeholder="Enter GitHub username..."
              value={username}
              onChange={e => {
                setUsername(e.target.value)
                setSelected(false)
              }}
              onKeyDown={handleKeyPress}
            />
            {username && !selected && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-popover border border-border rounded shadow-md">
                {suggestions.map(s => (
                  <li
                    key={s}
                    onClick={() => {
                      setUsername(s)
                      setSelected(true)
                      setSuggestions([])
                    }}
                    className="px-4 py-2 hover:bg-accent cursor-pointer text-sm"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button onClick={fetchRepos}>Search</Button>
        </div>

        {/* Profile Card */}
        {loading ? (
            <p className="text-center text-muted-foreground italic">Loading profile summary...</p>
          ) : summary && (
            <Card className="max-w-4xl mx-auto border border-border bg-muted/30 hover:shadow-lg transition">
              <div className="flex items-start gap-6 p-6">
                <Avatar className="w-16 h-16">
                  <img
                    src={`https://github.com/${username}.png`}
                    alt={`${username}'s avatar`}
                    className="rounded-full"
                  />
                  <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl text-primary">{username}</CardTitle>
                    <a
                      href={`https://github.com/${username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      View Profile ↗
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {summary}
                  </p>
                </div>
              </div>
            </Card>
          )}



        {/* Grid of Repositories */}
        {loading ? (
            <p className="text-center text-muted-foreground italic">Loading repositories...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedRepos.length > 0 ? (
                paginatedRepos.map((repo: any) => (
                  <Card key={repo.id} className="hover:shadow-lg transition duration-200 cursor-pointer">
                    <CardHeader className="flex flex-row justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-lg text-primary">
                          <a href={`/repo/${repo.owner.login}/${repo.name}`} className="hover:underline">
                            {repo.name}
                          </a>
                        </CardTitle>
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                          {repo.description || 'No description provided.'}
                        </p>
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback><GithubIcon className="w-4 h-4" /></AvatarFallback>
                      </Avatar>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex gap-2 items-center">
                        {repo.language && <Badge variant="secondary">{repo.language}</Badge>}
                        <span>★ {repo.stargazers_count}</span>
                        <span>🍴 {repo.forks_count}</span>
                      </div>
                      <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground text-sm italic col-span-3">
                  {username && selected ? 'No repositories found.' : 'Search a GitHub username to see repositories.'}
                </p>
              )}
            </div>
          )}


          {/* Pagination Controls */}
          {loading ? (
            // <div className="flex justify-center mt-6">
            //   <p className="text-muted-foreground italic">Loading pages...</p>
            // </div>
            <></>
          ) : (
            repos.length > reposPerPage && (
              <div className="flex justify-center gap-4 mt-6">
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={i + 1 === currentPage ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            )
          )}

      </div>
    </div>
  )
}
