import { test, expect, jest, afterEach } from '@jest/globals'
import { waitFor } from '@testing-library/react'
import saveService from '../saveService'

global.fetch = jest.fn()

afterEach(() => jest.clearAllMocks())

test('save a new transction', async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({id: 10001, vehicleNo: "J 23"})
    })

    const setLoading = jest.fn()
    const transactions = {
        addNewTransaction: jest.fn()
    }
    const refreshSparePartUsages = jest.fn()
    const clearState = jest.fn()

    saveService(setLoading, transactions, refreshSparePartUsages, clearState, {id: 10001, vehicleNo: "J 23"})

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/workshop-services", 
        {"body": "{\"id\":10001,\"vehicleNo\":\"J 23\"}", 
            "headers": {"Content-type": "application/json"}, 
            "method": "POST"}))

    expect(setLoading).toBeCalledTimes(2)
    expect(setLoading).lastCalledWith(false)
    expect(transactions.addNewTransaction).toBeCalledWith({id: 10001, vehicleNo: "J 23"})
    expect(refreshSparePartUsages).toBeCalled()
    expect(clearState).toBeCalled()
})

test('what if it failed to save', async () => {
    global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({id: 10001, vehicleNo: "J 23"})
    })

    const setLoading = jest.fn()
    const transactions = {
        addNewTransaction: jest.fn()
    }
    const refreshSparePartUsages = jest.fn()
    const clearState = jest.fn()

    const consoleError = jest.spyOn(console, 'error')

    saveService(setLoading, transactions, refreshSparePartUsages, clearState, {id: 10001, vehicleNo: "J 23"})

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/workshop-services", 
        {"body": "{\"id\":10001,\"vehicleNo\":\"J 23\"}", 
            "headers": {"Content-type": "application/json"}, 
            "method": "POST"}))
        .catch(err => expect(err).toEqual('x'))

    expect(setLoading).toBeCalledTimes(2)
    expect(setLoading).lastCalledWith(false)
    expect(transactions.addNewTransaction).not.toBeCalled()
    expect(refreshSparePartUsages).not.toBeCalled()
    expect(clearState).not.toBeCalled()
    expect(consoleError.mock.calls[0][0].message).toEqual("failed to save service: {\"id\":10001,\"vehicleNo\":\"J 23\"}")
})