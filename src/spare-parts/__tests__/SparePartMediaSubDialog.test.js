import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest, test, expect } from '@jest/globals';
import SparePartMediaSubDialog from '../SparePartMediaSubDialog';
import { useState } from 'react';

global.fetch = jest.fn()
jest.mock('browser-image-compression', () => (file) => Promise.resolve(file))

afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})

test('click to download file and remove it', async() => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true
    })

    const subscribe = jest.fn(() => (x) => {})
    const afterRemoveMedia = jest.fn()
    const setUploadedMedias = jest.fn()
    URL.revokeObjectURL = jest.fn()

    const uploadedMedias = [
            {id: 600001, dataUrl: 'http://hello.jpg', fileName: 'hello.jpg'},
            {id: 600002, dataUrl: 'http://world.png', fileName: 'world.png'},
            {id: 600003, dataUrl: 'http://jurassic.png', fileName: 'jurassic.png'},
        ]

    render(<SparePartMediaSubDialog 
        sparePart={{id: 50001, partNo: '200001'}}
        uploadedMedias={uploadedMedias}
        setUploadedMedias={setUploadedMedias}
        subscribe={subscribe}
        afterRemoveMedia={afterRemoveMedia}>
        </SparePartMediaSubDialog>)

    await waitFor(() => expect(screen.queryByRole('button', {name: 'download hello.jpg'})).toBeVisible())

    // download hello.jpg
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');
    await user.click(screen.queryByRole('button', {name: 'download hello.jpg'}))

    const link = removeChildSpy.mock.calls[0][0]
    expect(link.href).toBe('http://hello.jpg/')
    expect(link.download).toBe('hello.jpg')

    // check the subscribe
    expect((subscribe.mock.calls[0][0]).name).toBe('clearPreviewDataUrls')

    // remove hello.jpg
    await user.click(screen.getByRole('button', {name: 'remove hello.jpg'}))
    await waitFor(() => expect(global.fetch).toBeCalledWith(
        "http://localhost:8080/api/spare-parts/undefined/medias/600001", 
        {"method": "DELETE"}))

    const updateFn = setUploadedMedias.mock.calls[0][0]
    expect(updateFn(uploadedMedias)).toEqual([{"dataUrl": "http://world.png", "fileName": "world.png", "id": 600002}, 
        {"dataUrl": "http://jurassic.png", "fileName": "jurassic.png", "id": 600003}])
    expect(afterRemoveMedia).toBeCalledWith({"dataUrl": "http://hello.jpg", "fileName": "hello.jpg", "id": 600001})
})

test('upload single file then multiple files', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true
    })

    const subscribe = jest.fn(() => (x) => {})
    const afterRemoveMedia = jest.fn()
    const setUploadedMedias = jest.fn()
    URL.revokeObjectURL = jest.fn()
    URL.createObjectURL = jest.fn((file) => 'http://' + file.fileName)

    const uploadedMedias = []

    const SparePartMediaSubDialogWrapper = () => {
        const [uploadedFiles, setUploadedFiles] = useState([])

        return (<SparePartMediaSubDialog 
            sparePart={{id: 50001, partNo: '200001'}}
            uploadedMedias={uploadedMedias}
            setUploadedMedias={setUploadedMedias}
            subscribe={subscribe}
            afterRemoveMedia={afterRemoveMedia}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}>
            </SparePartMediaSubDialog>)
    }

    render(<SparePartMediaSubDialogWrapper></SparePartMediaSubDialogWrapper>)

    const uploadButton = screen.getByRole('button', {name: 'upload file(s)'})
    await user.click(uploadButton)
    await user.upload(uploadButton, new File([Uint8Array.from(atob("/9j/4AAQSkZJRgABAQEAAAAAAA=="), c => c.charCodeAt(0)).buffer], 'test.jpg', { type: 'image/jpeg' }))

    // multiple files
    await user.click(uploadButton)
    await user.upload(uploadButton, [
        new File([Uint8Array.from(atob("/9j/4AAQSkZJRgABAQEAAAAAAA=="), c => c.charCodeAt(0)).buffer], 'test.jpg', { type: 'image/jpeg' }),
        new File([Uint8Array.from(atob("/9j/4AAQSkZJRgABAQEAAAAAAA=="), c => c.charCodeAt(0)).buffer], 'world.png', { type: 'image/png' })
    ])

    await waitFor(() => expect(screen.queryAllByRole('img')).toHaveLength(2))
})

test('upload single video file', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true
    })

    const subscribe = jest.fn(() => (x) => {})
    const afterRemoveMedia = jest.fn()
    const setUploadedMedias = jest.fn()
    URL.revokeObjectURL = jest.fn()
    URL.createObjectURL = jest.fn((file) => 'http://' + file.fileName)

    const uploadedMedias = []

    const SparePartMediaSubDialogWrapper = () => {
        const [uploadedFiles, setUploadedFiles] = useState([])

        return (<SparePartMediaSubDialog 
            sparePart={{id: 50001, partNo: '200001'}}
            uploadedMedias={uploadedMedias}
            setUploadedMedias={setUploadedMedias}
            subscribe={subscribe}
            afterRemoveMedia={afterRemoveMedia}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}>
            </SparePartMediaSubDialog>)
    }

    render(<SparePartMediaSubDialogWrapper></SparePartMediaSubDialogWrapper>)

    const uploadButton = screen.getByRole('button', {name: 'upload file(s)'})
    await user.click(uploadButton)
    await user.upload(uploadButton, new File([Uint8Array.from(atob("/9j/4AAQSkZJRgABAQEAAAAAAA=="), c => c.charCodeAt(0)).buffer], 'test.mp4', { type: 'video/mp4' }))

    await waitFor(() => expect(document.querySelectorAll('video')).toHaveLength(1))
})