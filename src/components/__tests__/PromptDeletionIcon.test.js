import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, jest } from '@jest/globals'
import PromptDeletionIcon from '../PromptDeletionIcon';

test('just to cancel the deletion', async() => {
    const user = userEvent.setup()

    render(<PromptDeletionIcon flip confirmDelete={jest.fn()}></PromptDeletionIcon>)

    await user.click(screen.getByLabelText('remove'))
    expect(screen.queryByLabelText('cancel remove')).toBeInTheDocument()
    await user.click(screen.getByLabelText('cancel remove'))
    expect(screen.queryByLabelText('cancel remove')).not.toBeInTheDocument()
})

test('just to cancel the deletion, no flip', async() => {
    const user = userEvent.setup()

    render(<PromptDeletionIcon confirmDelete={jest.fn()}></PromptDeletionIcon>)

    await user.click(screen.getByLabelText('remove'))
    expect(screen.queryByLabelText('cancel remove')).toBeInTheDocument()
    await user.click(screen.getByLabelText('cancel remove'))
    expect(screen.queryByLabelText('cancel remove')).not.toBeInTheDocument()
})

test('really do the deletion', async() => {
    const user = userEvent.setup()

    const confirmDelete = jest.fn()
    render(<PromptDeletionIcon flip confirmDelete={confirmDelete}></PromptDeletionIcon>)

    await user.click(screen.getByLabelText('remove'))
    expect(screen.queryByLabelText('cancel remove')).toBeInTheDocument()
    await user.click(screen.getByLabelText('remove'))

    expect(confirmDelete).toBeCalled()
})