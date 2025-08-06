import { jest, test, expect } from '@jest/globals'
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

test('didnt upload any file', async () => {
    const user = userEvent.setup()

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

    await user.click(screen.getByText('Save'))

    // and close
    expect(setShowDialog).not.toBeCalled()
    await user.click(screen.getByLabelText('Close'))
    expect(setShowDialog).toBeCalledWith(false)
})

test('upload single photo', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            {id: 6200001, fileName: 'hello.png', mediaType: 'image/png'}, 
            {id: 6200002, fileName: 'world.mp4', mediaType: 'video/mp4'}
        ])
    })
    .mockResolvedValueOnce({
        blob: () => Promise.resolve([Buffer.from("/9j/4AAQSkZJRgABAQEAAAAAAA==", 'base64')])
    })
    .mockResolvedValueOnce({
        blob: () => Promise.resolve([Buffer.from("/9j/4AAQSkZJRgABAQEAAAAAAA==", 'base64')])
    })

    URL.createObjectURL.mockReturnValueOnce('http://preview.test.jpg')
        .mockReturnValueOnce('http://preview.uploaded.hello.jpg')
        .mockReturnValueOnce('http://preview.uploaded.world.jpg')

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

    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))

    // download
    const removeChild = jest.spyOn(document.body, 'removeChild')
    await user.click(screen.getByRole('button', {name: `download media hello.png`}))
    const link = removeChild.mock.calls[0][0]
    expect(link.download).toEqual('hello.png')

    // i seem can't get the HTMLInputElementImpl#validity() to work for `this.files.length`
    // could be due to /testing-library/user-event/blob/main/src/utils/edit/setFiles.ts to playing with original files
    // raised issue https://github.com/testing-library/user-event/issues/1293
    const checkValidity = jest.spyOn(screen.getByLabelText('upload form'), 'checkValidity')
    checkValidity.mockReturnValueOnce(true)
    await user.click(screen.getByText('Save'))

    // onClose
    expect(URL.revokeObjectURL).toBeCalledTimes(3)
    expect(URL.revokeObjectURL).nthCalledWith(1, "http://preview.uploaded.world.jpg")
    expect(URL.revokeObjectURL).nthCalledWith(2, "http://preview.test.jpg")
    expect(URL.revokeObjectURL).nthCalledWith(3, "http://preview.uploaded.hello.jpg")
    expect(setShowDialog).toBeCalledWith(false)
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
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true })

    const ws = {id: 10001, vehicleNo: "J 23", transactionTypes: ['REPAIR']}
    const setShowDialog = jest.fn()
    const onSaveMedia = jest.fn()
    render(<ServiceMediaDialog isShow={true} setShowDialog={setShowDialog} onSaveMedia={onSaveMedia} ws={ws}>
        </ServiceMediaDialog>)

    await waitFor(() => expect(global.fetch).nthCalledWith(3, 'http://localhost:8080/api/workshop-services/10001/medias/6200002/data'))

    await user.click(screen.getByLabelText('next media'))

    // let's remove
    await user.click(screen.getByLabelText('remove media world.mp4'))
    await waitFor(() => expect(global.fetch).nthCalledWith(4, 
        "http://localhost:8080/api/workshop-services/10001/medias/6200002", {"method": "DELETE"}))
    await waitFor(() => expect(screen.queryByLabelText('remove media world.mp4')).not.toBeInTheDocument())

    // and failed to remove
    await user.click(screen.getByLabelText('remove media hello.png'))
    await waitFor(() => expect(global.fetch).nthCalledWith(5, 
        "http://localhost:8080/api/workshop-services/10001/medias/6200001", {"method": "DELETE"}))

    await waitFor(() => expect(screen.queryByLabelText('remove media hello.png')).toBeInTheDocument())

    // one last time
    await user.click(screen.getByLabelText('remove media hello.png'))
    await waitFor(() => expect(global.fetch).nthCalledWith(6, 
        "http://localhost:8080/api/workshop-services/10001/medias/6200001", {"method": "DELETE"}))

    await waitFor(() => expect(screen.queryByLabelText('remove media hello.png')).not.toBeInTheDocument())
})

test('upload multiple photos', async () => {
    const user = userEvent.setup()

    URL.createObjectURL.mockReturnValueOnce('http://test.jpg')
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{id: 6200001, fileName: 'hello.png', mediaType: 'image/png'}, ])
    })
    .mockResolvedValueOnce({
        blob: () => Promise.resolve([Buffer.from("/9j/4AAQSkZJRgABAQEAAAAAAA==", 'base64')])
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
    checkValidity.mockReturnValue(true)
    await user.click(screen.getByText('Save & Continue'))

    expect(onSaveMedia).lastCalledWith({"id": 10001, "transactionTypes": ["REPAIR"], "vehicleNo": "J 23"}, expect.any(File), expect.any(Function))
    let afterSaveMedia = onSaveMedia.mock.calls[0][2]
    afterSaveMedia(620001)
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))

    // upload 1 more file
    const file2 = new File([Uint8Array.from(atob(''), c => c.charCodeAt(0)).buffer], 'hello-world.mp4', { type: 'video/mp4' })

    await user.upload(upload, file2)
    await user.click(screen.getByText('Save & Continue'))
    expect(onSaveMedia).toBeCalledTimes(2)

    afterSaveMedia = onSaveMedia.mock.calls[1][2]
    afterSaveMedia(620003)

    // should 3 medias now
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))
    await waitFor(() => expect(document.querySelectorAll('video')).toHaveLength(1))

    await user.click(screen.getByLabelText('next media'))
    expect(screen.queryByLabelText('download media hello.png')).toBeInTheDocument()
    await user.click(screen.getByLabelText('next media'))
    expect(screen.queryByLabelText('download media test.jpg')).toBeInTheDocument()
    await user.click(screen.getByLabelText('next media'))
    expect(screen.queryByLabelText('download media hello-world.mp4')).toBeInTheDocument()
    await user.click(screen.getByLabelText('prev media'))
    expect(screen.queryByLabelText('download media test.jpg')).toBeInTheDocument()
})