import { Counter } from '~/components/Counter/Counter'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('<Counter />', () => {
  it('Increase and decrease value correctly, not decrease to negative number', async () => {
    const user = userEvent.setup()

    // Mount (connect) the Counter component to virtual DOM in test enviroment
    render(<Counter />)

    const increaseButton = screen.getByRole('button', { name: '+' })
    const decreaseButton = screen.getByRole('button', { name: '-' })

    await user.click(increaseButton)
    await user.click(increaseButton)

    // decrease by 3 , guarantee that it will not go below 0
    await user.click(decreaseButton)
    await user.click(decreaseButton)
    await user.click(decreaseButton)

    // Assert
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument()
  })
})
