import { Button } from '~/components/Button/Button'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('<Button />', () => {
  it('Should render button and click successfully', async () => {
    //create a user interface
    const user = userEvent.setup()

    // create mock function onClick by Jest
    const onClick = jest.fn()

    // Mount (connect) the Button component to virtual DOM in test enviroment
    render(<Button content='Click Me' onClick={onClick} />)

    // dùng object screen dể  tương tác với DOM global tìm cái button
    // getByRole tìm button với role là button và name là Click Me (không phân biệt hoa thường)
    // name is the content of the button
    const button = screen.getByRole('button', { name: /click me/i })

    // simulate user click action
    await user.click(button)

    // assert button still in document
    expect(button).toBeInTheDocument()

    // assert onClick function is called once
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
