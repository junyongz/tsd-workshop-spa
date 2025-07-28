import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, jest, afterAll } from '@jest/globals'
import CalendarView from '../CalendarView';

window.matchMedia = jest.fn()

afterAll(() => jest.clearAllMocks())

test('calendar navigation, no events, bigger screen', async () => {
    window.matchMedia.mockReturnValue({ matches: true })

    const user = userEvent.setup()

    const todayDate = new Date()
    const lastDay = (new Date(todayDate.getFullYear(), todayDate.getMonth()+1, 0)).getDate()

    const onClickNew = jest.fn()
    render(<CalendarView onClickNew={onClickNew}></CalendarView>)

    expect(screen.queryByLabelText(`day of ${todayDate.getMonth()}-${lastDay}`)).toBeInTheDocument()

    // click on the 15, which is always in every month
    await user.click(screen.getByLabelText(`day of ${todayDate.getMonth()}-15`))
    expect(onClickNew).toBeCalled()

    window.matchMedia.mockReturnValue({ matches: false })

    // under small screen
    await user.click(screen.getByLabelText(`day of ${todayDate.getMonth()}-15`))
    expect(onClickNew).toBeCalledTimes(1)

    // previous month, twice
    await user.click(screen.getByLabelText('previous month'))
    await user.click(screen.getByLabelText('previous month'))

    expect(screen.queryByLabelText(`day of ${todayDate.getMonth()}-15`)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(`day of ${todayDate.getMonth()-2}-15`)).toBeInTheDocument()

    // back to today
    await user.click(screen.getByText('Today'))
    expect(screen.queryByLabelText(`day of ${todayDate.getMonth()}-15`)).toBeInTheDocument()
    expect(screen.queryByLabelText(`day of ${todayDate.getMonth()-2}-15`)).not.toBeInTheDocument()

    // next 2 months
    await user.click(screen.getByLabelText('next month'))
    await user.click(screen.getByLabelText('next month'))
    expect(screen.queryByLabelText(`day of ${todayDate.getMonth()}-15`)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(`day of ${todayDate.getMonth()+2}-15`)).toBeInTheDocument()
})

test('calendar navigation, no events, smaller screen', async () => {
    window.matchMedia.mockReturnValue({ matches: true })

    const user = userEvent.setup()

    const todayDate = new Date()

    const onClickNew = jest.fn()
    render(<CalendarView onClickNew={onClickNew}></CalendarView>)

    await user.click(screen.getByLabelText('create new event'))
    expect(onClickNew).toBeCalled()
})