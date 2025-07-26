import { test, expect, jest, afterAll } from '@jest/globals'
import { waitFor } from '@testing-library/react'

import removeServiceTask from '../removeServiceTask'

global.fetch = jest.fn()

afterAll(() => jest.clearAllMocks())

// https://developer.mozilla.org/en-US/docs/Web/API/Response/text
// text() will always return as string
test('DELETE and delete, text() return as number?', async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(10000)
    })

    const setLoading = jest.fn()
    const transactions = {
        removeTask: jest.fn()
    }
    const clearState = jest.fn()

    removeServiceTask(setLoading, transactions, clearState, 20000, 10000)
    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/workshop-services/20000/tasks/10000",
         {"headers": {"Content-type": "application/json"}, "method": "DELETE"}))
        
    expect(setLoading).toBeCalledTimes(2)
    expect(setLoading).lastCalledWith(false)
    expect(transactions.removeTask).toBeCalledWith(20000, 10000)
    expect(clearState).toBeCalled()
})

test('DELETE and delete, return string', async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("10000")
    })

    const setLoading = jest.fn()
    const transactions = {
        removeTask: jest.fn()
    }
    const clearState = jest.fn()

    removeServiceTask(setLoading, transactions, clearState, 20000, 10000)
    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/workshop-services/20000/tasks/10000",
         {"headers": {"Content-type": "application/json"}, "method": "DELETE"}))

    expect(setLoading).toBeCalledTimes(2)
    expect(setLoading).lastCalledWith(false)
    expect(transactions.removeTask).toBeCalledWith(20000, 10000)
    expect(clearState).toBeCalled()
})