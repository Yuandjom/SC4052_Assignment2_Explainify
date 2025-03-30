'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Navbar } from '@/components/navbar'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { ChevronDown, ChevronRight, File as FileIcon, Folder as FolderIcon, FolderOpen } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type FileItem = {
  path: string
  type: 'file' | 'dir'
  url: string
}

function buildFileTree(paths: string[]) {
  const root: any = {}

  for (const path of paths) {
    const parts = path.split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!current[part]) {
        current[part] = i === parts.length - 1 ? null : {}
      }
      current = current[part]
    }
  }

  return root
}

function FileTree({
  tree,
  depth = 0,
  parentPath = '',
  onFileClick,
}: {
  tree: any
  depth?: number
  parentPath?: string
  onFileClick: (path: string) => void
}) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({})

  const toggleFolder = (fullPath: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [fullPath]: !prev[fullPath],
    }))
  }

  const entries = Object.entries(tree)
  const folders = entries.filter(([_, value]) => value !== null)
  const files = entries.filter(([_, value]) => value === null)

  return (
    <div>
      {folders.map(([folderName, subtree]) => {
        const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName
        const isOpen = openFolders[fullPath]

        return (
          <div key={fullPath} className="space-y-1">
            <div
              onClick={() => toggleFolder(fullPath)}
              className="flex items-center gap-1 cursor-pointer hover:bg-accent/30 px-2 py-1 rounded transition"
              style={{ paddingLeft: `${depth * 16}px` }}
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {isOpen ? <FolderOpen className="w-4 h-4" /> : <FolderIcon className="w-4 h-4" />}
              <span className="font-medium text-foreground">{folderName}</span>
            </div>
            {isOpen && (
              <FileTree
                tree={subtree}
                depth={depth + 1}
                parentPath={fullPath}
                onFileClick={onFileClick}
              />
            )}
          </div>
        )
      })}

      {files.map(([fileName]) => {
        const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName
        return (
          <div
            key={fullPath}
            onClick={() => onFileClick(fullPath)}
            style={{ paddingLeft: `${depth * 16}px` }}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/30 cursor-pointer text-blue-400"
          >
            <FileIcon className="w-4 h-4" />
            <span className="text-sm">{fileName}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function RepoPage() {
  const { owner, repo } = useParams()
  const [tree, setTree] = useState<FileItem[]>([])
  const [selectedFileContent, setSelectedFileContent] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedRole, setSelectedRole] = useState('intern')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch the repository tree
  useEffect(() => {
    const fetchTree = async () => {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, {
        headers: {
          Authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`
        }
      })
      const data = await res.json()
      setTree(data.tree.filter((item: any) => item.type === 'blob'))
    }
    fetchTree()
  }, [owner, repo])

  // Fetch file content and clear previous chat history
  const fetchFileContent = async (path: string) => {
    const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`)
    const content = await res.text()
    setSelectedFileName(path)
    setSelectedFileContent(content)
    setChatHistory([]) // clear previous conversation
    setQuestion('')    // clear previous question
  }

  // Send a new chat message to the server including conversation history
  const askAI = async () => {
    if (!selectedFileContent) return
    setIsLoading(true)

    // Append the new user question to the chat history
    const newUserMessage = { role: 'user', content: question }
    const updatedHistory : any = [...chatHistory, newUserMessage]
    setChatHistory(updatedHistory)

    // Send the entire conversation to the API for context
    const response = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: selectedFileContent,
        role: selectedRole,
        conversation: updatedHistory, // include conversation history
        question,                     // current question (redundant if in conversation)
      }),
    })

    const data = await response.json()
    setIsLoading(false)
    if (data.explanation) {
      // Append the assistant's response to the chat history
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.explanation }])
      setQuestion('') // clear input after sending
    } else if (data.error) {
      // Append error as assistant message
      setChatHistory(prev => [...prev, { role: 'assistant', content: `❌ Error: ${data.error}` }])
    }
  }

  return (
    <>
      <Navbar />
      <PanelGroup direction="horizontal" className="h-[calc(100vh-64px)]">
        {/* Panel 1: File Tree */}
        <Panel defaultSize={20} minSize={10}>
          <div className="h-full p-4 overflow-y-auto border-r border-border">
            <h2 className="font-bold text-lg mb-4">📁 Files</h2>
            <ScrollArea className="h-full pr-2">
              <FileTree
                tree={buildFileTree(tree.map((file) => file.path))}
                onFileClick={(path) => fetchFileContent(path)}
              />
            </ScrollArea>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border cursor-col-resize" />

        {/* Panel 2: Code Viewer */}
        <Panel defaultSize={40} minSize={20}>
          <div className="h-full p-4 overflow-y-auto bg-muted text-muted-foreground font-mono text-sm">
            <h2 className="text-lg font-semibold mb-2 text-foreground">
              📝 {selectedFileName || 'Select a file'}
            </h2>
            <SyntaxHighlighter
              language="tsx"
              style={atomDark}
              wrapLines
              showLineNumbers
              customStyle={{
                backgroundColor: 'transparent',
                maxHeight: '80vh',
                borderRadius: '0.5rem',
                padding: '1rem',
                fontSize: '0.875rem',
                overflow: 'auto',
              }}
            >
              {selectedFileContent || '// Click on a file from the left panel'}
            </SyntaxHighlighter>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border cursor-col-resize" />

        {/* Panel 3: Chat (AI Explanation) */}
        <Panel defaultSize={40} minSize={20}>
          <div className="h-full p-4 overflow-y-auto border-l border-border flex flex-col">
            <h2 className="text-lg font-semibold mb-4">💡 AI Chat</h2>

            {/* Role Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium block mb-1">Explain as:</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intern">🧑‍🎓 Intern</SelectItem>
                  <SelectItem value="newgrad">👩‍💻 New Grad</SelectItem>
                  <SelectItem value="senior">🧠 Senior Dev</SelectItem>
                  <SelectItem value="pm">🧭 PM</SelectItem>
                  <SelectItem value="designer">🎨 Designer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chat Log */}
            <ScrollArea className="flex-1 overflow-y-auto max-h-[60vh] pr-2">
                <div className="space-y-4">
                    {chatHistory.length > 0 ? (
                    chatHistory.map((msg, idx) => (
                        <div
                        key={idx}
                        className={`max-w-[90%] px-4 py-3 rounded-md shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                            msg.role === 'user'
                            ? 'ml-auto bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                        >
                        {msg.content}
                        </div>
                    ))
                    ) : (
                    <p className="italic text-muted-foreground">
                        Ask a question about the selected file.
                    </p>
                    )}
                </div>
            </ScrollArea>



            {/* Input and Send Button */}
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about this code..."
                className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground shadow-sm"
              />
              <button
                onClick={askAI}
                disabled={isLoading || !question}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </>
  )
}
