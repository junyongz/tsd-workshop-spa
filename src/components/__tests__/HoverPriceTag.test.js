import { test, expect, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HoverPriceTag from '../HoverPriceTag';

test('move in and move out', async () => {
    const user = userEvent.setup()

    render(<HoverPriceTag onRemove={jest.fn()}><span>Hello</span></HoverPriceTag>)

    expect(screen.queryByText('Hello')).toBeInTheDocument()
    // move in
    await user.hover(screen.getByRole('button'))
    expect(screen.queryByText('Hello')).not.toBeInTheDocument()

    // move out
    await user.unhover(screen.getByRole('button'))
    expect(screen.queryByText('Hello')).toBeInTheDocument()
})

test('require 2 clicks to really remove', async () => {
    const user = userEvent.setup()

    const onRemove = jest.fn()
    render(<HoverPriceTag onRemove={onRemove}><span>Hello</span></HoverPriceTag>)

    expect(screen.queryByText('Hello')).toBeInTheDocument()
    // move in
    await user.hover(screen.getByRole('button'))
    expect(screen.queryByText('Hello')).not.toBeInTheDocument()

    // click 1st time
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveClass('clicked')
    expect(screen.queryByText('Hello')).not.toBeInTheDocument()

    // move out
    await user.unhover(screen.getByRole('button'))
    expect(screen.getByRole('button')).not.toHaveClass('clicked')
    expect(screen.queryByText('Hello')).toBeInTheDocument()

    // hover, then click again, for the 1st time, then ...
    await user.hover(screen.getByRole('button'))
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveClass('clicked')
    // ensure 'Hello' text no longer there
    expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    // let's do the 2nd click and actual remove kicked in
    await user.click(screen.getByRole('button'))

    expect(onRemove).toBeCalled()
})