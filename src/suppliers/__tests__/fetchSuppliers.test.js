import { test, jest, expect, afterEach } from '@jest/globals'
import fetchSuppliers from '../fetchSuppliers'

global.fetch = jest.fn()

afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})

test('error to fetch suppliers', async () => {
    global.fetch.mockRejectedValueOnce('failed to call api')

    const setSuppliers = jest.fn()
    
    const consoleError = jest.spyOn(console, 'error')
    await fetchSuppliers('localhost:8080', setSuppliers);
    expect(consoleError).toBeCalledWith('There was an error fetching the suppliers:', 'failed to call api')

    expect(setSuppliers).not.toBeCalled()
})