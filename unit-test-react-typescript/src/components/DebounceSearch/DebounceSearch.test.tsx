import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DebounceSearch } from '~/components/DebounceSearch/DebounceSearch'

describe('<DebounceSearch />', () => {
  it('should fetch user after debounce time', async () => {
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (url.includes('john')) {
        return {
          json: async () => [
            {
              id: 1,
              name: 'John Doe',
            },
          ],
        } as any
      }

      return { json: async () => [] } as any
    })

    render(<DebounceSearch />)

    // call fetch with empty string initially
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('user?q='),
    )

    await userEvent.type(screen.getByPlaceholderText(/search/i), 'john')

    // jest advance timers by 500ms to trigger debounce
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    // debound finish
    expect(await screen.findByText(/john doe/i)).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('user?q=john'),
    )
  })

  it('show no result when fetch error occurs', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Fetch error'))

    render(<DebounceSearch />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(await screen.findByText(/no result/i)).toBeInTheDocument()
  })
})
