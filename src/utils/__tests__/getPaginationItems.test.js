import { test, expect } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'

import { Pagination } from 'react-bootstrap'
import getPaginationItems from '../getPaginationItems'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

const PaginationWrapper = ({totalPages}) => {
    const [activePage, setActivePage] = useState(1)

    return (
    <Pagination>
        { getPaginationItems(activePage, setActivePage, totalPages, 20)}
    </Pagination>
    )
}

test('a lot of pages', async () => {
    const user = userEvent.setup()

    render(<PaginationWrapper totalPages={100}></PaginationWrapper>)

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(26))
    expect(screen.getAllByRole('button')).toHaveLength(23)

    await user.click(screen.getByText('10'))
    expect(screen.getAllByRole('button')).toHaveLength(25)

    await user.click(screen.getAllByRole('button')[24])
    expect(screen.getAllByRole('button')).toHaveLength(23)

    // prev button
    await user.click(screen.getAllByRole('button')[1])
    expect(screen.getAllByRole('button')).toHaveLength(25)

    // next button
    await user.click(screen.getAllByRole('button')[23])
    expect(screen.getAllByRole('button')).toHaveLength(23)

    await user.click(screen.getAllByRole('button')[0])
    expect(screen.getAllByRole('button')).toHaveLength(23)
})

test('a few pages', async () => {
    const user = userEvent.setup()

    render(<PaginationWrapper totalPages={5}></PaginationWrapper>)

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(9))
    expect(screen.getAllByRole('button')).toHaveLength(6)

    await user.click(screen.getByText('3'))
    expect(screen.getAllByRole('button')).toHaveLength(8)

    await user.click(screen.getAllByRole('button')[7])
    expect(screen.getAllByRole('button')).toHaveLength(6)

    // prev button
    await user.click(screen.getAllByRole('button')[1])
    expect(screen.getAllByRole('button')).toHaveLength(8)

    // next button
    await user.click(screen.getAllByRole('button')[6])
    expect(screen.getAllByRole('button')).toHaveLength(6)

    await user.click(screen.getAllByRole('button')[0])
    expect(screen.getAllByRole('button')).toHaveLength(6)
})