import { expect, test, jest, afterEach } from '@jest/globals'
import { waitFor } from '@testing-library/react'

import { applyFilterOnOrders, applyFilterOnServices, doFilterServices } from '../fuzzySearch'
import SupplierOrders from '../../suppliers/SupplierOrders'
import ServiceTransactions from '../../ServiceTransactions'

afterEach(() => jest.clearAllMocks())

test('1 search option, only vehicle match', () => {
    expect(applyFilterOnServices([{name: 'J 1000'}], undefined, 
        [{vehicleNo: 'J 1000'},{vehicleNo: 'J 2000'}],
        [{startDate: '2020-02-02', vehicleNo: 'J 1000'}, 
         {startDate: '2020-03-02', vehicleNo: 'J 2000'},
         {startDate: '2020-04-02', vehicleNo: 'J 3000'}
        ])).toEqual([{startDate: '2020-02-02', vehicleNo: 'J 1000'}])
})

test('1 search option, more, only vehicle match', () => {
    expect(applyFilterOnServices([{name: 'J 1000'}], undefined,
            [{vehicleNo: 'J 1000'},{vehicleNo: 'J 2000'}],
            [{startDate: '2020-02-02', vehicleNo: 'J 1000'}, 
            {startDate: '2020-03-02', vehicleNo: 'J 2000'},
            {startDate: '2020-01-02', vehicleNo: 'J 1000'}
        ])).toEqual([
            {startDate: '2020-02-02', vehicleNo: 'J 1000'},
            {startDate: '2020-01-02', vehicleNo: 'J 1000'}
        ])
})

test('2 search options, vehicle matched, spare part matched', () => {
    const supplierOrders = new SupplierOrders(
        [{id: 1000, partName: 'clutch pump'}], jest.fn())

    expect(applyFilterOnServices([{name: 'J 1000'}, {name: 'clutch'}], undefined,
            [{vehicleNo: 'J 1000'},{vehicleNo: 'J 2000'}],
            [{startDate: '2020-02-02', vehicleNo: 'J 1000', sparePartUsages: [{orderId: 1000}]}, 
            {startDate: '2020-03-02', vehicleNo: 'J 2000'},
            {startDate: '2020-01-02', vehicleNo: 'J 1000'}
        ], supplierOrders)).toEqual([
            {startDate: '2020-02-02', vehicleNo: 'J 1000', sparePartUsages: [{orderId: 1000}]}
        ])
})

test('2 search options, vehicle matched, spare part matched, one service only spare part matched', () => {
    const supplierOrders = new SupplierOrders(
        [{id: 1000, partName: 'clutch pump'}], jest.fn())

    expect(applyFilterOnServices([{name: 'J 1000'}, {name: 'clutch'}], undefined,
            [{vehicleNo: 'J 1000'},{vehicleNo: 'J 2000'},{vehicleNo: 'J 3000'}],
            [{startDate: '2020-03-04', vehicleNo: 'J 3000', sparePartUsages: [{orderId: 1000}]},
            {startDate: '2020-02-02', vehicleNo: 'J 1000', sparePartUsages: [{orderId: 1000}]}, 
            {startDate: '2020-03-02', vehicleNo: 'J 2000', sparePartUsages: [{orderId: 1000}]},
            {startDate: '2020-01-02', vehicleNo: 'J 1000'}
        ], supplierOrders)).toEqual([
            {startDate: '2020-02-02', vehicleNo: 'J 1000', sparePartUsages: [{orderId: 1000}]}
        ])
})

test('2 search options, vehicle matched, no spare part matched', () => {
    const supplierOrders = new SupplierOrders(
        [{id: 1000, partName: 'brake chamber'}], jest.fn())

    expect(applyFilterOnServices([{name: 'J 1000'}, {name: 'clutch'}], undefined, 
            [{vehicleNo: 'J 1000'},{vehicleNo: 'J 2000'}],
            [{startDate: '2020-02-02', vehicleNo: 'J 1000', sparePartUsages: [{orderId: 1000}]}, 
            {startDate: '2020-03-02', vehicleNo: 'J 2000'},
            {startDate: '2020-01-02', vehicleNo: 'J 1000'}
        ], supplierOrders)).toEqual([])
})

test('2 search options, only vehicles matched', () => {
    const supplierOrders = new SupplierOrders(
        [{id: 1000, partName: 'clutch pump'}], jest.fn())

    expect(applyFilterOnServices([{name: 'J 1000'}, {name: 'J 2000'}], undefined, 
            [{vehicleNo: 'J 1000'},{vehicleNo: 'J 2000'}],
            [{startDate: '2020-02-02', vehicleNo: 'J 1000', sparePartUsages: [{orderId: 1000}]}, 
            {startDate: '2020-03-02', vehicleNo: 'J 2000'},
            {startDate: '2020-01-02', vehicleNo: 'J 1000'}
        ], supplierOrders)).toEqual([
            {startDate: '2020-02-02', vehicleNo: 'J 1000', sparePartUsages: [{orderId: 1000}]},
            {startDate: '2020-03-02', vehicleNo: 'J 2000'},
            {startDate: '2020-01-02', vehicleNo: 'J 1000'}
        ])
})

test('1 search option, no vehicle matched, but spare part matched', () => {
    const supplierOrders = new SupplierOrders(
        [{id: 1000, partName: 'clutch pump'}], jest.fn())

    expect(applyFilterOnServices([{name: 'clutch'}], undefined,
            [{vehicleNo: 'J 1000'},{vehicleNo: 'J 2000'}],
            [{startDate: '2020-02-02', vehicleNo: 'J 1000', sparePartUsages: [{orderId: 1000}]}, 
            {startDate: '2020-03-02', vehicleNo: 'J 2000'},
            {startDate: '2020-01-02', vehicleNo: 'J 1000'}
        ], supplierOrders)).toEqual([
            {startDate: '2020-02-02', vehicleNo: 'J 1000', sparePartUsages: [{orderId: 1000}]}
        ])
})

test('2 search options, no vehicle matched, but spare part matched', () => {
    const supplierOrders = new SupplierOrders(
        [{id: 1000, partName: 'clutch pump'}, 
         {id: 1001, partName: 'oil filter'}], 
    jest.fn())

    expect(applyFilterOnServices([{name: 'clutch'}, {name: 'oil filter'}], undefined,
            [{vehicleNo: 'J 1000'},{vehicleNo: 'J 2000'}],
            [{startDate: '2020-02-02', vehicleNo: 'J 1000', sparePartUsages: [{orderId: 1000}]}, 
            {startDate: '2020-03-02', vehicleNo: 'J 2000', sparePartUsages: [{orderId: 1001}]},
            {startDate: '2020-01-02', vehicleNo: 'J 1000'}
        ], supplierOrders)).toEqual([
            {startDate: '2020-02-02', vehicleNo: 'J 1000', sparePartUsages: [{orderId: 1000}]},
            {startDate: '2020-03-02', vehicleNo: 'J 2000', sparePartUsages: [{orderId: 1001}]}
        ])
})

test('2 search options, vehicle matched, hand written migrated part matched', () => {
    expect(applyFilterOnServices([{name: 'clutch'}], undefined,
            [{vehicleNo: 'J 1000'}, {vehicleNo: 'J 2000'}],
            [{startDate: '2020-02-02', vehicleNo: 'J 1000', migratedHandWrittenSpareParts: [{partName: 'Clutch disc'}]}, 
            {startDate: '2020-03-02', vehicleNo: 'J 2000', migratedHandWrittenSpareParts: [{itemDescription: 'Clutch pump'}]},
            {startDate: '2020-01-02', vehicleNo: 'J 1000'}
        ])).toEqual([
            {startDate: '2020-02-02', vehicleNo: 'J 1000', migratedHandWrittenSpareParts: [{partName: 'Clutch disc'}]},
            {startDate: '2020-03-02', vehicleNo: 'J 2000', migratedHandWrittenSpareParts: [{itemDescription: 'Clutch pump'}]}
        ])
})

test('2 search options, vehicle matched, hand written migrated part not matched', () => {
    expect(applyFilterOnServices([{name: 'brake'}], undefined,
            [{vehicleNo: 'J 1000'}, {vehicleNo: 'J 2000'}],
            [{startDate: '2020-02-02', vehicleNo: 'J 1000', migratedHandWrittenSpareParts: [{partName: 'Clutch disc'}]}, 
            {startDate: '2020-03-02', vehicleNo: 'J 2000', migratedHandWrittenSpareParts: [{itemDescription: 'Clutch pump'}]},
            {startDate: '2020-01-02', vehicleNo: 'J 1000'}
        ])).toEqual([])
})

// can only cater existing one
test('search via api call through keywords', async () => {
    const dispatch = jest.fn()
    const setSelectedSearchOptions = jest.fn()

    global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{id: 1000, vehicleNo: 'J 23', startDate: '2025-12-24'}, {id: 2000, vehicleNo: 'J 33', startDate: '2025-12-25'}])
    }))

    doFilterServices([{name: 'J 23'}], new ServiceTransactions([{id: 1000, vehicleNo: 'J 23', startDate: '2025-12-25'}, 
        {id: 2000, vehicleNo: 'J 33', startDate: '2025-12-24'}], dispatch), setSelectedSearchOptions)

    expect(setSelectedSearchOptions).toBeCalledWith([{"name": "J 23"}])
    
    await waitFor(() => expect(dispatch).toBeCalledWith([{"id": 2000, "startDate": "2025-12-25", "vehicleNo": "J 33"}, 
        {"id": 1000, "startDate": "2025-12-24", "vehicleNo": "J 23"}]))
})

test('search service by date only', () => {
    const services = [
        {id: 1000, vehicleNo: 'J 23', startDate: '2025-12-25'},
        {id: 1001, vehicleNo: 'J 33', startDate: '2025-12-23'},
        {id: 1002, vehicleNo: 'J 34', startDate: '2025-12-24'},
        {id: 1003, vehicleNo: 'J 45', startDate: '2025-12-25'}
    ]

    expect(applyFilterOnServices([], '2025-12-25', [], services))
    .toEqual([
        {id: 1000, vehicleNo: 'J 23', startDate: '2025-12-25'},
        {id: 1003, vehicleNo: 'J 45', startDate: '2025-12-25'}
    ])

    expect(applyFilterOnServices([], '2022-12-12', [], services)).toEqual([])
})

test('search order by date & vehicle no', () => {
    const orders = [
        {id: 5000, supplierId: 2000, partName: 'Air Tank', invoiceDate: '2005-01-01', status: 'ACTIVE'},
        {id: 5001, supplierId: 2001, partName: 'Air Hose', invoiceDate: '2005-02-01', status: 'ACTIVE'},
        {id: 5002, supplierId: 2001, partName: 'Fire Ext', invoiceDate: '2005-02-02', status: 'ACTIVE'},
        {id: 5003, supplierId: 2000, partName: 'Water Pipe', invoiceDate: '2005-01-02', status: 'DEPLETED'},
        {id: 5004, supplierId: 2000, partName: 'Air Tank', invoiceDate: '2005-01-02', status: 'ACTIVE'},
        {id: 5005, supplierId: 2000, partName: 'Air Tank', invoiceDate: '2005-02-03', status: 'ACTIVE'},
        {id: 5006, supplierId: 2000, partName: 'Air Tank', invoiceDate: '2005-02-04', status: 'ACTIVE'},
        {id: 5007, supplierId: 2000, partName: 'Air Tank', invoiceDate: '2005-01-03', status: 'DEPLETED'},
        {id: 5008, supplierId: 2000, partName: 'Air Tank', invoiceDate: '2005-01-05', status: 'ACTIVE'},
        {id: 5009, supplierId: 2000, partName: 'Air Tank', invoiceDate: '2005-01-06', status: 'ACTIVE'},
        {id: 5010, supplierId: 2001, partName: 'Air Tank', invoiceDate: '2005-02-09', status: 'ACTIVE'},
        {id: 5011, supplierId: 2001, partName: 'Tie Rod End', invoiceDate: '2005-02-02', status: 'ACTIVE'},
        {id: 5012, supplierId: 2000, partName: 'Steering Box Assy', invoiceDate: '2005-01-02', status: 'DEPLETED'}
    ]

    expect(applyFilterOnOrders([], '2005-02-02', orders))
    .toEqual([
        {id: 5002, supplierId: 2001, partName: 'Fire Ext', invoiceDate: '2005-02-02', status: 'ACTIVE'},
        {id: 5011, supplierId: 2001, partName: 'Tie Rod End', invoiceDate: '2005-02-02', status: 'ACTIVE'}
    ])

    expect(applyFilterOnOrders([], '2005-09-02', orders)).toEqual([])

    expect(applyFilterOnOrders([{name: 'J 23'}], undefined, orders, [{orderId: 5012, vehicleNo: 'J 23'}]))
        .toEqual([{id: 5012, supplierId: 2000, partName: 'Steering Box Assy', invoiceDate: '2005-01-02', status: 'DEPLETED'}])
})