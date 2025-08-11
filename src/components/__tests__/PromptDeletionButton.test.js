import { test, expect, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PromptDeletionButton from '../PromptDeletionButton';

test('just to cancel the deletion', async() => {
    const user = userEvent.setup()

    render(<PromptDeletionButton confirmDelete={jest.fn()}></PromptDeletionButton>)

    await user.click(screen.getByLabelText('remove'))
    expect(screen.queryByLabelText('cancel remove')).toBeInTheDocument()
    await user.click(screen.getByLabelText('cancel remove'))
    expect(screen.queryByLabelText('cancel remove')).not.toBeInTheDocument()
})

test('really do the deletion', async() => {
    const user = userEvent.setup()

    const confirmDelete = jest.fn()
    render(<PromptDeletionButton flip confirmDelete={confirmDelete}></PromptDeletionButton>)

    await user.click(screen.getByLabelText('remove'))
    expect(screen.queryByLabelText('cancel remove')).toBeInTheDocument()
    await user.click(screen.getByLabelText('remove'))

    expect(confirmDelete).toBeCalled()
})