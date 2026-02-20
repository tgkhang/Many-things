import React, { useState } from 'react'
import { Button } from '~/components/Button/Button'

// coponent counter has the task of increasing/decreasing value, but it must not decrease to negative number.
export const Counter: React.FC = () => {
  const [value, setValue] = useState(0)

  return (
    <div>
      <p>Count: {value}</p>
      <Button content='+' onClick={() => setValue((v) => v + 1)} />
      <Button content='-' onClick={() => setValue((v) => Math.max(0, v - 1))} />
    </div>
  )
}
