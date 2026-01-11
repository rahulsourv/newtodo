import { useEffect, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import './App.css'
import Navbar from './components/Navbar.jsx'
import bgImage from './assets/img.png'

function App() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [editingTodo, setEditingTodo] = useState(null)
  const [editText, setEditText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  useEffect(() => {
    fetchTodos()
    fetchQuote()
  }, [])

  const sortedTodos = [...todos].sort((a, b) => {
    const completionOrder = Number(a.completed) - Number(b.completed)
    if (completionOrder !== 0) return completionOrder
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const fetchTodos = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/todos`)
      if (!res.ok) throw new Error('Failed to load todos')
      const data = await res.json()
      setTodos(data)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuote = async () => {
    setQuoteLoading(true)
    try {
      const res = await fetch(`${API_BASE}/quotes/random`)
      if (!res.ok) throw new Error('Failed to load quote')
      const data = await res.json()
      setQuote(data)
    } catch (err) {
      // Keep UI quiet if quote fails; log to console
      console.warn('Quote error:', err)
    } finally {
      setQuoteLoading(false)
    }
  }

  const addTodo = async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setError('')
    try {
      const res = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      if (!res.ok) throw new Error('Failed to add todo')
      const created = await res.json()
      setTodos((prev) => [created, ...prev])
      setInput('')
    } catch (err) {
      setError(err.message || 'Could not add todo')
    }
  }

  const toggleTodo = async (id, completed) => {
    setError('')
    try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
      if (!res.ok) throw new Error('Failed to update todo')
      const updated = await res.json()
      setTodos((prev) => prev.map((todo) => (todo._id === id ? updated : todo)))
    } catch (err) {
      setError(err.message || 'Could not update todo')
    }
  }

  const deleteTodo = async (id) => {
    setError('')
    try {
      const res = await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete todo')
      setTodos((prev) => prev.filter((todo) => todo._id !== id))
    } catch (err) {
      setError(err.message || 'Could not delete todo')
    }
  }

  const startEdit = (todo) => {
    setEditingTodo(todo)
    setEditText(todo.text)
  }

  const saveEdit = async () => {
    const trimmed = editText.trim()
    if (!trimmed || !editingTodo) return
    setError('')
    try {
      const res = await fetch(`${API_BASE}/todos/${editingTodo._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      if (!res.ok) throw new Error('Failed to save changes')
      const updated = await res.json()
      setTodos((prev) => prev.map((todo) => (todo._id === updated._id ? updated : todo)))
      setEditingTodo(null)
      setEditText('')
    } catch (err) {
      setError(err.message || 'Could not save changes')
    }
  }

  const cancelEdit = () => {
    setEditingTodo(null)
    setEditText('')
  }

  return (
    <>
      <Navbar/>
      <div
        className="bg-cover bg-center min-h-screen w-full"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="flex justify-center py-12 px-6">
          <div className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl max-w-5xl w-full p-10">
            <div className="flex justify-center text-center">
              {quoteLoading && (
                <p className="text-3xl font-bold text-slate-700">Loading quote…</p>
              )}
              {!quoteLoading && quote && (
                <p className="text-3xl font-bold italic text-slate-900">
                  “{quote.text}” {quote.author ? <span className="not-italic text-slate-700">— {quote.author}</span> : null}
                </p>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <div className="addtodo flex flex-col gap-6 mt-6 sm:flex-row sm:items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                placeholder="Add your todo"
                className="border-2 border-white/60 bg-white/50 backdrop-blur-sm rounded-md w-full h-14 px-4 text-2xl text-black"
              />
              <button
                onClick={addTodo}
                className="border-2 border-white/60 bg-white/60 hover:bg-white/80 backdrop-blur-sm rounded-md px-6 py-3  h-14 font-semibold"
              >
                Add 
              </button>
            </div>

            <LayoutGroup>
            <div className="list flex flex-col gap-4 mt-10">
              {loading && <p className="text-center text-lg text-slate-700">Loading...</p>}

              {!loading && sortedTodos.length === 0 && (
                <p className="text-center text-lg text-slate-700">Nothing here yet. Add your first task!</p>
              )}

              <AnimatePresence initial={false}>
              {sortedTodos.map((todo) => (
                <motion.div
                  key={todo._id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="flex items-center justify-between bg-slate-200/60 rounded-md px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(todo.completed)}
                      onChange={() => toggleTodo(todo._id, !todo.completed)}
                      className="h-5 w-5 accent-slate-700"
                    />
                    <span
                      className={`text-xl font-semibold ${todo.completed ? 'line-through text-slate-600' : 'text-slate-900'}`}
                    >
                      {todo.text}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteTodo(todo._id)}
                      className="h-10 px-4 border-2 border-slate-700 rounded-md hover:bg-slate-300"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => startEdit(todo)}
                      className="h-10 px-4 border-2 border-slate-700 rounded-md hover:bg-slate-300"
                    >
                      Edit
                    </button>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
            </LayoutGroup>
          </div>
        </div>

        {editingTodo && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-gradient-to-r from-slate-200/50 to-slate-400/50 rounded-lg p-8 shadow-2xl w-11/12 max-w-lg">
              <h2 className="text-2xl font-bold mb-4 text-center">Edit Task</h2>
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                className="w-full border-2 border-slate-700 rounded-md px-4 py-3 text-lg text-black bg-white"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border-2 border-slate-700 rounded-md hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 border-2 border-slate-700 bg-slate-800 text-white rounded-md hover:bg-slate-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </> 
  )
}

export default App
