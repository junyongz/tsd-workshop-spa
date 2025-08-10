import { test, jest, expect, afterEach } from '@jest/globals'
import { fetchSupplierSpareParts } from '../fetchSupplierSpareParts'

global.fetch = jest.fn()

afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})

test('error to fetch supplier spare parts', async () => {
    global.fetch.mockRejectedValueOnce('failed to call api')

    const replaceAll = jest.fn()
    
    const consoleError = jest.spyOn(console, 'error')
    await fetchSupplierSpareParts('localhost:8080', {replaceAll: replaceAll} );
    expect(consoleError).toBeCalledWith('There was an error fetching the supplier-spare-parts:', 'failed to call api')

    expect(replaceAll).not.toBeCalled()
})