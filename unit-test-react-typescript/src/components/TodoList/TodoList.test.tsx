import { TodoList } from '~/components/TodoList/TodoList'
import { render, screen } from '@testing-library/react'

const mockTodos = [
  {
    id: 1,
    todo: 'Test Todo 1',
    completed: true,
    userId: 1,
  },
  {
    id: 2,
    todo: 'Test Todo 2',
    completed: false,
    userId: 1,
  },
]

describe('<TodoList />', () => {
  // globalThis: biến toàn cục chạy trên mọi môi trường (browser, nodejs, web worker)
  // jest spy on: create a mock function for object (in this case is globalThis.fetch)
  // mockResolvedValueOnce: mock 1 lần trả về giá trị (ở đây là trả về 1 Promise resolve)
  it('Fetch and display todos', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({ todos: mockTodos }),
    } as any)

    render(<TodoList />)

    // get by text: synchronous, make sure element is in DOM
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // findByText: asynchronous, return a promise that resolves when the element is found
    // wait for each todo to appear in the document
    // usually use when element appear after a delay (like api call, setTimeout, animation...)
    for (const t of mockTodos) {
      expect(await screen.findByText(t.todo)).toBeInTheDocument()
    }
  })

  it('Should display no result when fetch returns error', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Fetch error'))

    render(<TodoList />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    expect(await screen.findByText(/no result/i)).toBeInTheDocument()
  })
})
