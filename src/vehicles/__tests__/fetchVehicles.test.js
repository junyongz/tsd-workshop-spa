import { test, jest, expect, afterEach } from '@jest/globals'
import fetchVehicles from '../fetchVehicles'

global.fetch = jest.fn()

afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
})

test('error to fetch vehicle', async () => {
    global.fetch.mockRejectedValueOnce('failed to call api')

    const setVehicles = jest.fn()
    const setSesarchOptions = jest.fn()
    
    const consoleError = jest.spyOn(console, 'error')
    await fetchVehicles('localhost:8080', setVehicles, setSesarchOptions);
    expect(consoleError).toBeCalledWith('There was an error fetching the vehicles:', 'failed to call api')

    expect(setVehicles).not.toBeCalled()
    expect(setSesarchOptions).not.toBeCalled()
})