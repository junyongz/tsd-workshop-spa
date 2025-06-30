import { expect, test } from '@jest/globals'

import { applyFilterOnServices } from '../fuzzySearch'
import SupplierOrders from '../../suppliers/SupplierOrders'

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