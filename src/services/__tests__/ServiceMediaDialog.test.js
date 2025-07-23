import { jest, test, expect, afterAll } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServiceMediaDialog from '../ServiceMediaDialog'

jest.mock('browser-image-compression', () => (file) => Promise.resolve(file))
URL.createObjectURL = (file) => 'http://' + file.name

afterAll(() => jest.clearAllMocks)

test('upload any photo', async () => {
    const user = userEvent.setup()

    const ws = {id: 10001, vehicleNo: "J 23", transactionTypes: ['REPAIR']}
    const setShowDialog = jest.fn()
    const onSaveMedia = jest.fn()
    render(<ServiceMediaDialog isShow={true} setShowDialog={setShowDialog} onSaveMedia={onSaveMedia} ws={ws}>
        </ServiceMediaDialog>)

    const upload = screen.getByRole('button', {name: "upload image or video"})
    await user.click(upload)
    await user.upload(upload, new File([Uint8Array.from(atob("/9j/4AAQSkZJRgABAQEAAAAAAA=="), c => c.charCodeAt(0)).buffer], 'test.jpg', { type: 'image/jpeg' }) )

    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1))
})