import React, { useEffect, useState } from 'react'

// Data Type này chúng ta follow theo dummyjson.com (gọi api ở dưới)
type Todo = {
  id: number
  todo: string
  completed: boolean
  userId: number
}

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('https://dummyjson.com/todos') // (Fetch tạm public API trên mạng cho nhanh)
      .then((res) => {
        if (res) return res.json()
      })
      .then((data) => setTodos(data?.todos || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>
  if (!todos?.length) return <p>No result!</p>

  return (
    <ul style={{ listStyle: 'none', textAlign: 'left' }}>
      {todos?.map((t) => (
        <li key={t.id}>{t.todo}</li>
      ))}
    </ul>
  )
}
