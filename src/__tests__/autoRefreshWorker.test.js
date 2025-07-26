import { test, expect, jest, afterAll } from '@jest/globals'
import autoRefreshWorker from '../autoRefreshWorker'
import { waitFor } from '@testing-library/react'

global.fetch = jest.fn()

afterAll(() => jest.clearAllMocks())

test('refresh nothing', async () => {
    const dbTableStats = [
        { tableName: "vehicles", lastTransactionId: 200000 }
    ]

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbTableStats)
    })

    const setLoading = jest.fn()
    const refreshFn = jest.fn()

    sessionStorage.setItem('stats-dbtables', JSON.stringify(dbTableStats))
    autoRefreshWorker(setLoading, {
        'vehicles': () => Promise.resolve('vehicles').then(v => refreshFn(v)),
        'services': () => Promise.resolve('services').then(v => refreshFn(v)),
        'orders': () => Promise.resolve('orders').then(v => refreshFn(v))
    })

    await waitFor(() => expect(global.fetch).lastCalledWith(
        "http://localhost:8080/api/stats/dbtables", {"mode": "cors"}))
    sessionStorage.removeItem('stats-dbtables')

    expect(setLoading).not.toBeCalled()
    expect(refreshFn).not.toBeCalled()
})

test('lets refresh something, nothing in session storage', async () => {
    const dbTableStats = [
        { tableName: "vehicles", lastTransactionId: 200000 }
    ]

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbTableStats)
    })

    const setLoading = jest.fn()
    const refreshFn = jest.fn()

    autoRefreshWorker(setLoading, {
        'vehicles': () => Promise.resolve('vehicles').then(v => refreshFn(v)),
        'services': () => Promise.resolve('services').then(v => refreshFn(v)),
        'orders': () => Promise.resolve('orders').then(v => refreshFn(v))
    })

    await waitFor(() => expect(global.fetch).lastCalledWith(
        "http://localhost:8080/api/stats/dbtables", {"mode": "cors"}))
    expect(JSON.parse(sessionStorage.getItem('stats-dbtables'))).toEqual([
        { tableName: "vehicles", lastTransactionId: 200000 }
    ])
    sessionStorage.removeItem('stats-dbtables')

    expect(setLoading).not.toBeCalled()
    expect(refreshFn).not.toBeCalled()
})

test('lets refresh something, with something in session storage', async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
        { tableName: "vehicles", lastTransactionId: 200001 }
    ])
    })

    const setLoading = jest.fn()
    const refreshFn = jest.fn()

    sessionStorage.setItem('stats-dbtables', JSON.stringify([
        { tableName: "vehicles", lastTransactionId: 200000 }
    ]))
    autoRefreshWorker(setLoading, {
        'vehicles': () => Promise.resolve('vehicles').then(v => refreshFn(v)),
        'services': () => Promise.resolve('services').then(v => refreshFn(v)),
        'orders': () => Promise.resolve('orders').then(v => refreshFn(v))
    })

    await waitFor(() => expect(global.fetch).lastCalledWith(
        "http://localhost:8080/api/stats/dbtables", {"mode": "cors"}))
    expect(JSON.parse(sessionStorage.getItem('stats-dbtables'))).toEqual([
        { tableName: "vehicles", lastTransactionId: 200001 }
    ])
    await waitFor(() => expect(refreshFn).lastCalledWith('vehicles'))
    sessionStorage.removeItem('stats-dbtables')

    expect(setLoading).toBeCalledTimes(2)
    expect(setLoading).lastCalledWith(false)
})

test('lets refresh something, even more in session storage', async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            { tableName: "vehicles", lastTransactionId: 200001 },
            { tableName: "services", lastTransactionId: 200001 },
            { tableName: "orders", lastTransactionId: 200001 },
        ])
    })

    const setLoading = jest.fn()
    const refreshFn = jest.fn()

    sessionStorage.setItem('stats-dbtables', JSON.stringify([
        { tableName: "vehicles", lastTransactionId: 200000 },
        { tableName: "services", lastTransactionId: 200000 },
        { tableName: "orders", lastTransactionId: 200000 }
    ]))
    autoRefreshWorker(setLoading, {
        'vehicles': () => Promise.resolve('vehicles').then(v => refreshFn(v)),
        'services': () => Promise.resolve('services').then(v => refreshFn(v)),
        'orders': () => Promise.resolve('orders').then(v => refreshFn(v))
    })

    await waitFor(() => expect(global.fetch).lastCalledWith(
        "http://localhost:8080/api/stats/dbtables", {"mode": "cors"}))
    await waitFor(() => expect(refreshFn).toBeCalledTimes(3))
    sessionStorage.removeItem('stats-dbtables')

    expect(setLoading).toBeCalledTimes(2)
    expect(setLoading).lastCalledWith(false)
    expect(refreshFn).lastCalledWith('orders')
})

test('lets refresh something, some not refreshed', async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            { tableName: "vehicles", lastTransactionId: 200001 },
            { tableName: "services", lastTransactionId: 200001 },
            { tableName: "orders", lastTransactionId: 200001 },
        ])
    })

    const setLoading = jest.fn()
    const refreshFn = jest.fn()

    sessionStorage.setItem('stats-dbtables', JSON.stringify([
        { tableName: "vehicles", lastTransactionId: 200000 },
        { tableName: "services", lastTransactionId: 200000 },
        { tableName: "orders", lastTransactionId: 200001 }
    ]))
    autoRefreshWorker(setLoading, {
        'vehicles': () => Promise.resolve('vehicles').then(v => refreshFn(v)),
        'services': () => Promise.resolve('services').then(v => refreshFn(v)),
        'orders': () => Promise.resolve('orders').then(v => refreshFn(v))
    })

    await waitFor(() => expect(global.fetch).lastCalledWith(
        "http://localhost:8080/api/stats/dbtables", {"mode": "cors"}))
    await waitFor(() => expect(refreshFn).toBeCalledTimes(2))
    sessionStorage.removeItem('stats-dbtables')

    expect(setLoading).toBeCalledTimes(2)
    expect(setLoading).lastCalledWith(false)
    expect(refreshFn).lastCalledWith('services')
})