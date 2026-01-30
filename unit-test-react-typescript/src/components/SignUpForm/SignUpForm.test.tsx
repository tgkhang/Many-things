import { render, screen } from '@testing-library/react'
import { SignUpForm } from '~/components/SignUpForm/SignUpForm'
import userEvent from '@testing-library/user-event'

describe('<SignUpForm />', () => {
  it('Should fill input with default values initially', () => {
    render(
      <SignUpForm
        onSubmit={jest.fn()} // jest fn is just a mock function, no effect
        defaultValues={{ email: 'aa@gmail.com', password: '123456' }}
      />,
    )

    expect(screen.getByPlaceholderText(/enter email/i)).toHaveValue(
      'aa@gmail.com',
    )
    expect(screen.getByPlaceholderText(/enter password/i)).toHaveValue('123456')
  })

  it('should display message error when email is invalid', async () => {
    const mockOnSubmit = jest.fn()
    render(<SignUpForm onSubmit={mockOnSubmit} />)

    await userEvent.click(screen.getByText(/submit/i))

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should show error if email is invalid format', async () => {
    const mockOnSubmit = jest.fn()
    render(<SignUpForm onSubmit={mockOnSubmit} />)

    await userEvent.type(
      screen.getByPlaceholderText(/enter email/i),
      'This is an invalid email',
    )
    await userEvent.type(
      screen.getByPlaceholderText(/enter password/i),
      '123456',
    )

    await userEvent.click(screen.getByText(/submit/i))

    expect(await screen.findByText(/email is not valid/i)).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should show error if password is too short', async () => {
    const mockOnSubmit = jest.fn()
    render(<SignUpForm onSubmit={mockOnSubmit} />)

    await userEvent.type(
      screen.getByPlaceholderText(/enter email/i),
      'aaa@gmail.com',
    )
    await userEvent.type(screen.getByPlaceholderText(/enter password/i), '123')

    await userEvent.click(screen.getByText(/submit/i))

    expect(
      await screen.findByText(/password must be at least 6 characters/i),
    ).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should call onSubmit and reset form when input is valid', async () => {
    const mockOnSubmit = jest.fn()
    render(<SignUpForm onSubmit={mockOnSubmit} />)

    await userEvent.type(
      screen.getByPlaceholderText(/enter email/i),
      'aaa@gmail.com',
    )
    await userEvent.type(
      screen.getByPlaceholderText(/enter password/i),
      '123456',
    )

    await userEvent.click(screen.getByText(/submit/i))
    expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'aaa@gmail.com',
      password: '123456',
    })

    expect(screen.getByPlaceholderText(/enter email/i)).toHaveValue('')
    expect(screen.getByPlaceholderText(/enter password/i)).toHaveValue('')
  })
})
