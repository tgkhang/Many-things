import { renderHook, act } from '@testing-library/react'
import { useCounter } from '~/hooks/useCounter'

// renderhook: render a custom hook in test environment, do not need to create a component to use the hook
// act: wrap actions that trigger state updates to ensure all updates are processed before making assertions

describe('useCounter', () => {
  it('init with init value correctly', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('custom initial value works', () => {
    const { result } = renderHook(() => useCounter(5))
    expect(result.current.count).toBe(5)
  })

  it('increasement works', () => {
    const { result } = renderHook(() => useCounter(5))

    act(() => {
      result.current.increasement()
    })

    expect(result.current.count).toBe(6)
  })

  it('decrease works but not below 0', () => {
    const { result } = renderHook(() => useCounter(1))

    act(() => {
      result.current.decreasement()
      result.current.decreasement()
    })

    expect(result.current.count).toBe(0)
  })

  it('reset works', () => {
    const { result } = renderHook(() => useCounter(3))

    act(() => {
      result.current.increasement()
      result.current.reset()
    })

    expect(result.current.count).toBe(3)
  })
})
