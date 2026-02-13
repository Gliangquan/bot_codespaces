import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Filter = 'all' | 'active' | 'completed'
type Priority = 'low' | 'medium' | 'high'

interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: number
  priority: Priority
}

const STORAGE_KEY = 'modern-todolist-v1'

function App() {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as TodoItem[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const [draft, setDraft] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const remaining = useMemo(() => todos.filter((t) => !t.completed).length, [todos])
  const completedCount = todos.length - remaining

  const visibleTodos = useMemo(() => {
    return todos
      .filter((todo) => {
        if (filter === 'active') return !todo.completed
        if (filter === 'completed') return todo.completed
        return true
      })
      .filter((todo) => todo.text.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt)
  }, [filter, search, todos])

  const addTodo = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return

    const todo: TodoItem = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
      priority,
    }

    setTodos((prev) => [todo, ...prev])
    setDraft('')
    setPriority('medium')
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  const startEdit = (todo: TodoItem) => {
    setEditingId(todo.id)
    setEditingText(todo.text)
  }

  const saveEdit = () => {
    if (!editingId) return
    const text = editingText.trim()
    if (!text) return

    setTodos((prev) => prev.map((todo) => (todo.id === editingId ? { ...todo, text } : todo)))
    setEditingId(null)
    setEditingText('')
  }

  const toggleAll = () => {
    const shouldCompleteAll = todos.some((t) => !t.completed)
    setTodos((prev) => prev.map((todo) => ({ ...todo, completed: shouldCompleteAll })))
  }

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((todo) => !todo.completed))
  }

  return (
    <main className="app-shell">
      <section className="todo-card">
        <header className="header">
          <h1>Modern Todo</h1>
          <p>聚焦当下任务，把复杂事情拆成可执行的小步。</p>
        </header>

        <form className="add-form" onSubmit={addTodo}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="输入一个待办事项…"
            aria-label="Todo text"
          />

          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} aria-label="Priority">
            <option value="low">低优先级</option>
            <option value="medium">中优先级</option>
            <option value="high">高优先级</option>
          </select>

          <button type="submit">添加</button>
        </form>

        <div className="toolbar">
          <input
            className="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索任务"
            aria-label="Search todos"
          />

          <div className="filters" role="tablist" aria-label="Todo filter tabs">
            {(['all', 'active', 'completed'] as Filter[]).map((key) => (
              <button
                key={key}
                type="button"
                className={filter === key ? 'active' : ''}
                onClick={() => setFilter(key)}
              >
                {key === 'all' ? '全部' : key === 'active' ? '进行中' : '已完成'}
              </button>
            ))}
          </div>
        </div>

        <div className="actions">
          <button type="button" onClick={toggleAll} disabled={!todos.length}>
            一键{todos.some((t) => !t.completed) ? '完成全部' : '重置全部'}
          </button>
          <button type="button" onClick={clearCompleted} disabled={!completedCount}>
            清除已完成
          </button>
        </div>

        <ul className="todo-list">
          {visibleTodos.length === 0 ? (
            <li className="empty">没有匹配的任务，开始创建你的第一条待办吧 ✨</li>
          ) : (
            visibleTodos.map((todo) => (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'done' : ''}`}>
                <label>
                  <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} />
                </label>

                <div className="todo-content">
                  {editingId === todo.id ? (
                    <input
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                        if (e.key === 'Escape') {
                          setEditingId(null)
                          setEditingText('')
                        }
                      }}
                    />
                  ) : (
                    <button className="text-btn" type="button" onDoubleClick={() => startEdit(todo)}>
                      {todo.text}
                    </button>
                  )}

                  <span className={`priority ${todo.priority}`}>{todo.priority}</span>
                </div>

                <button className="danger" type="button" onClick={() => deleteTodo(todo.id)}>
                  删除
                </button>
              </li>
            ))
          )}
        </ul>

        <footer className="stats">
          <span>总计：{todos.length}</span>
          <span>进行中：{remaining}</span>
          <span>已完成：{completedCount}</span>
        </footer>
      </section>
    </main>
  )
}

export default App
