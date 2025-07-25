import { jest, test, expect, afterAll } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServiceMediaDialog from '../ServiceMediaDialog'

jest.mock('browser-image-compression', () => (file) => Promise.resolve(file))
URL.createObjectURL = jest.fn()
URL.revokeObjectURL = jest.fn()

global.fetch = jest.fn()

afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})

test('upload single photo', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(
            [{id: 6200001, fileName: 'hello.png', mediaType: 'image/png'}, {id: 6200002, fileName: 'world.mp4', mediaType: 'video/mp4'}]
        )
    })
    .mockResolvedValueOnce({
        blob: () => Promise.resolve([Buffer.from("/9j/4AAQSkZJRgABAQEAAAAAAA==", 'base64')])
    })
    .mockResolvedValueOnce({
        blob: () => Promise.resolve([Buffer.from("/9j/4AAQSkZJRgABAQEAAAAAAA==", 'base64')])
    })

    const ws = {id: 10001, vehicleNo: "J 23", transactionTypes: ['REPAIR']}
    const setShowDialog = jest.fn()
    const onSaveMedia = jest.fn()
    render(<ServiceMediaDialog isShow={true} setShowDialog={setShowDialog} onSaveMedia={onSaveMedia} ws={ws}>
        </ServiceMediaDialog>)

    await waitFor(() => expect(screen.getAllByLabelText('image of hello.png')).toHaveLength(1))
    await waitFor(() => expect(screen.getAllByLabelText('video of world.mp4')).toHaveLength(1))
    expect(global.fetch).nthCalledWith(1, 'http://localhost:8080/api/workshop-services/10001/medias')
    expect(global.fetch).nthCalledWith(2, 'http://localhost:8080/api/workshop-services/10001/medias/6200001/data')
    expect(global.fetch).nthCalledWith(3, 'http://localhost:8080/api/workshop-services/10001/medias/6200002/data')

    const upload = screen.getByRole('button', {name: "upload image or video"})
    await user.click(upload)
    await user.upload(upload, new File([Uint8Array.from(atob("/9j/4AAQSkZJRgABAQEAAAAAAA=="), c => c.charCodeAt(0)).buffer], 'test.jpg', { type: 'image/jpeg' }) )

    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1))

    // download
    const removeChild = jest.spyOn(document.body, 'removeChild')
    await user.click(screen.getByRole('button', {name: `download media hello.png`}))
    const link = removeChild.mock.calls[0][0]
    expect(link.download).toEqual('hello.png')

    // and close
    await user.click(screen.getByLabelText('Close'))
})

test('remove existing media', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            {id: 6200001, serviceId: 10001, fileName: 'hello.png', mediaType: 'image/png'}, 
            {id: 6200002, serviceId: 10001, fileName: 'world.mp4', mediaType: 'video/mp4'}
        ])
    })
    .mockResolvedValueOnce({
        blob: () => Promise.resolve([Buffer.from("/9j/4AAQSkZJRgABAQEAAAAAAA==", 'base64')])
    })
    .mockResolvedValueOnce({
        blob: () => Promise.resolve([Buffer.from("/9j/4AAQSkZJRgABAQEAAAAAAA==", 'base64')])
    })
    .mockResolvedValueOnce({ ok: true })

    const ws = {id: 10001, vehicleNo: "J 23", transactionTypes: ['REPAIR']}
    const setShowDialog = jest.fn()
    const onSaveMedia = jest.fn()
    render(<ServiceMediaDialog isShow={true} setShowDialog={setShowDialog} onSaveMedia={onSaveMedia} ws={ws}>
        </ServiceMediaDialog>)

    await waitFor(() => expect(global.fetch).nthCalledWith(3, 'http://localhost:8080/api/workshop-services/10001/medias/6200002/data'))

    // let's remove
    await user.click(screen.getByLabelText('remove media hello.png'))
    await waitFor(() => expect(global.fetch).nthCalledWith(4, 
        "http://localhost:8080/api/workshop-services/10001/medias/6200001", {"method": "DELETE"}))

    await waitFor(() => expect(screen.queryByLabelText('remove media hello.png')).not.toBeInTheDocument())
})

test('upload multiple photos', async () => {
    const user = userEvent.setup()

    URL.createObjectURL.mockReturnValueOnce('http://test.jpg')
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
    })

    const ws = {id: 10001, vehicleNo: "J 23", transactionTypes: ['REPAIR']}
    const setShowDialog = jest.fn()
    const onSaveMedia = jest.fn()
    render(<ServiceMediaDialog isShow={true} setShowDialog={setShowDialog} onSaveMedia={onSaveMedia} ws={ws}>
        </ServiceMediaDialog>)

    expect(global.fetch).nthCalledWith(1, 'http://localhost:8080/api/workshop-services/10001/medias')

    const file = new File([Uint8Array.from(atob(''), c => c.charCodeAt(0)).buffer], 'test.jpg', { type: 'image/jpeg' })

    const upload = screen.getByRole('button', {name: "upload image or video"})
    await user.upload(upload, file)
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1))

    // save & continue
    // i seem can't get the HTMLInputElementImpl#validity() to work for `this.files.length`
    // could be due to /testing-library/user-event/blob/main/src/utils/edit/setFiles.ts to playing with original files
    // raised issue https://github.com/testing-library/user-event/issues/1293
    const checkValidity = jest.spyOn(screen.getByLabelText('upload form'), 'checkValidity')
    checkValidity.mockReturnValueOnce(true)
    await user.click(screen.getByText('Save & Continue'))

    expect(onSaveMedia).lastCalledWith({"id": 10001, "transactionTypes": ["REPAIR"], "vehicleNo": "J 23"}, expect.any(File), expect.any(Function))
    const afterSaveMedia = onSaveMedia.mock.calls[0][2]
    afterSaveMedia(620001)
})