import { test, jest, expect, afterEach } from '@jest/globals'
import fetchSparePartUsages from '../fetchSparePartUsages'

global.fetch = jest.fn()

afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})

test('error to fetch vehicle', async () => {
    global.fetch.mockRejectedValueOnce('failed to call api')

    const setSparePartUsages = jest.fn()
    const showToastMessage = jest.fn()
    
    const consoleError = jest.spyOn(console, 'error')
    await fetchSparePartUsages('localhost:8080', setSparePartUsages, showToastMessage);
    expect(consoleError).toBeCalledWith('There was an error fetching the spare parts:', 'failed to call api')

    expect(setSparePartUsages).not.toBeCalled()
    expect(showToastMessage).toBeCalledWith('There was an error fetching the spare parts:failed to call api')
})