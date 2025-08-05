import { test, expect, jest, afterAll, afterEach } from '@jest/globals'
import fetchServices, { fetchFewPagesServices } from '../fetchServices'
import ServiceTransactions from '../ServiceTransactions'
import { waitFor } from '@testing-library/react'

global.fetch = jest.fn()

afterAll(() => jest.clearAllMocks())

afterEach(() => jest.restoreAllMocks())

test('exception handling', async () => {
    global.fetch.mockRejectedValueOnce(new Error("what a loser"))

    const consoleError = jest.spyOn(console, 'error')

    const dispatch = jest.fn()
    await fetchServices('localhost', new ServiceTransactions([], dispatch), {ref: new Set()})

    await waitFor(() => expect(global.fetch).toBeCalledWith("localhost/api/workshop-services", {"mode": "cors"}))
    expect(consoleError.mock.calls[0][0]).toEqual('There was an error fetching the services:')
    expect(consoleError.mock.calls[0][1].message).toEqual('what a loser')

    expect(dispatch).not.toBeCalled()
})

test('exception handling for few pages', async () => {
    global.fetch.mockRejectedValueOnce(new Error("what a loser"))

    const consoleError = jest.spyOn(console, 'error')

    const dispatch = jest.fn()
    await fetchFewPagesServices('localhost', new ServiceTransactions([], dispatch), {ref: new Set()})

    await waitFor(() => expect(global.fetch).toBeCalledWith("localhost/api/workshop-services?pageNumber=0&pageSize=30", {"mode": "cors"}))
    expect(consoleError.mock.calls[0][0]).toEqual('There was an error fetching the services:')
    expect(consoleError.mock.calls[0][1].message).toEqual('what a loser')

    expect(dispatch).not.toBeCalled()
})