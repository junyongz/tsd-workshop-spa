import { jest, test, expect, afterAll } from '@jest/globals';
import fetchCompanies from '../fetchCompanies';
import { waitFor } from '@testing-library/react';

afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})

test('error happening when fetch', async () => {
    global.fetch = jest.fn()
    global.fetch.mockRejectedValueOnce(new Error("what are you trying to do?"))

    const setCompanies = jest.fn()
    Promise.resolve(fetchCompanies('http://localhost', setCompanies))

    const consoleErrorSpy = jest.spyOn(console, 'error')
    await waitFor(() => expect(global.fetch).toBeCalledWith("http://localhost/api/companies", {"mode": "cors"}))
    expect(consoleErrorSpy.mock.calls[0][1].message).toBe('what are you trying to do?')
    expect(setCompanies).not.toBeCalled()
})

test('undefined for apiUrl', async () => {
    global.fetch = jest.fn()
    global.fetch.mockRejectedValueOnce(new Error("what are you trying to do?"))

    Promise.resolve(fetchCompanies(undefined, jest.fn()))

    await waitFor(() => expect(global.fetch).toBeCalledWith("/api/companies", {"mode": "cors"}))
})