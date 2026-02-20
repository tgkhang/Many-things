import { useState } from 'react'

export function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)

  const increasement = () => setCount((prev) => prev + 1)
  const decreasement = () => setCount((prev) => Math.max(0, prev - 1))
  const reset = () => setCount(initialValue)

  return { count, increasement, decreasement, reset }
}
