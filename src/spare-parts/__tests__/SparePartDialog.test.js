import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest, test, expect, afterAll } from '@jest/globals';
import SparePartDialog from '../SparePartDialog';
import SupplierOrders from '../../suppliers/SupplierOrders';
import { SupplierOrderContext } from '../../suppliers/SupplierOrderContextProvider';
import { useState } from 'react';

jest.mock('react-bootstrap-typeahead/types/utils/getOptionLabel', () => ((opt, labelKey) => opt[labelKey]));

const mockOrders = new SupplierOrders([
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
], jest.fn());
const mockSuppliers = [{ id: 2000, supplierName: 'Han Seng' }, { id: 2001, supplierName: 'Kok Song' }];

global.fetch = jest.fn()
afterAll(() => jest.clearAllMocks())

test('add new parts with supplier and photo', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 50001 })
    })

    const afterSave = jest.fn()
    const afterRemoveMedia = jest.fn()
    const setShowDialog = jest.fn()

    const SparePartWrapper = () => {
        const [sparePart, setSparePart] = useState({oems:[],compatibleTrucks:[]})

        return (
            <SparePartDialog afterSave={afterSave} 
                afterRemoveMedia={afterRemoveMedia} 
                suppliers={mockSuppliers}
                isShow
                setShowDialog={setShowDialog}
                sparePart={sparePart}
                setSparePart={setSparePart}></SparePartDialog>
        )
    }

    render(<SupplierOrderContext value={mockOrders}><SparePartWrapper /></SupplierOrderContext>)

    await user.click(screen.getByPlaceholderText('OE No'))
    await user.keyboard('11220000')

    await user.click(screen.getByPlaceholderText('Part Name'))
    await user.keyboard('Air Tank')

    await user.click(screen.getByPlaceholderText('Description'))
    await user.keyboard('Air Tank for storing air from compressor')

    // OEM
    await user.click(screen.getByRole('button', {name: 'button to add OEM'}))
    await user.click(screen.getByRole('textbox', {name: 'name for oem 0'}))
    await user.keyboard('TSO')
    await user.click(screen.getByRole('textbox', {name: 'url for oem 0'}))
    await user.keyboard('http://tso.com/1122000/air-tank')

    // TRUCK
    await user.click(screen.getByRole('button', {name: 'button to add compatible truck'}))
    await user.click(screen.getByRole('textbox', {name: 'truck make 0'}))
    await user.keyboard('Hino')
    await user.click(screen.getByRole('textbox', {name: 'truck model 0'}))
    await user.keyboard('700')

    // supplier tab
    await user.click(screen.getByRole('tabpanel', {name: 'Suppliers'}))
    // find from order
    await user.click(screen.getByPlaceholderText('How about start with an order'))
    await user.keyboard('Air Tank')
    await user.click(screen.getByRole('option', {name: 'Air Tank (2005-01-01) - Han Seng'}))

    // go to detail and save
    await user.click(screen.getByRole('tabpanel', {name: 'Detail'}))
    await user.click(screen.getByRole('button', {name: 'Save'}))

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/spare-parts", 
        {"body": "{\"oems\":[{\"name\":\"TSO\",\"url\":\"http://tso.com/1122000/air-tank\"}],\"compatibleTrucks\":[{\"make\":\"Hino\",\"model\":\"700\"}],\"partNo\":\"11220000\",\"partName\":\"Air Tank\",\"description\":\"Air Tank for storing air from compressor\",\"supplierIds\":[2000],\"orderIds\":[5000]}", 
            "headers": {"Content-type": "application/json"}, "method": "POST", "mode": "cors"}))

    expect(setShowDialog).lastCalledWith(false)
    expect(afterSave).lastCalledWith({"id": 50001, "orderIds": [5000]})
})

test('add spare part with many orders, remove supplier and add photo', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 50001 })
    })

    const afterSave = jest.fn()
    const afterRemoveMedia = jest.fn()
    const setShowDialog = jest.fn()

    const SparePartWrapper = () => {
        const [sparePart, setSparePart] = useState({oems:[],compatibleTrucks:[]})

        return (
            <SparePartDialog afterSave={afterSave} 
                afterRemoveMedia={afterRemoveMedia} 
                suppliers={mockSuppliers}
                isShow
                setShowDialog={setShowDialog}
                sparePart={sparePart}
                setSparePart={setSparePart}></SparePartDialog>
        )
    }

    render(<SupplierOrderContext value={mockOrders}><SparePartWrapper /></SupplierOrderContext>)

    await user.click(screen.getByPlaceholderText('OE No'))
    await user.keyboard('11220000')

    await user.click(screen.getByPlaceholderText('Part Name'))
    await user.keyboard('Air Tank')

    await user.click(screen.getByPlaceholderText('Description'))
    await user.keyboard('Air Tank for storing air from compressor')

    // supplier tab
    await user.click(screen.getByRole('tabpanel', {name: 'Suppliers'}))
    // find from order
    await user.click(screen.getByPlaceholderText('How about start with an order'))
    await user.keyboard('Air Tank')
    await user.click(screen.getByRole('option', {name: 'Air Tank (2005-01-01) - Han Seng'}))
    expect(screen.queryAllByRole('listitem')).toHaveLength(1)

    await user.click(screen.getByPlaceholderText('How about start with an order'))
    await user.keyboard('Air Tank')
    await user.click(screen.getByRole('option', {name: 'Air Tank (2005-01-02) - Han Seng'}))
    expect(screen.queryAllByRole('listitem')).toHaveLength(2)

    await user.click(screen.getByPlaceholderText('How about start with an order'))
    await user.keyboard('Air Tank')
    await user.click(screen.getByRole('option', {name: 'Air Tank (2005-02-03) - Han Seng'}))
    expect(screen.queryAllByRole('listitem')).toHaveLength(3)

    await user.click(screen.getByPlaceholderText('How about start with an order'))
    await user.keyboard('Air Tank')
    await user.click(screen.getByRole('option', {name: 'Air Tank (2005-02-04) - Han Seng'}))
    expect(screen.queryAllByRole('listitem')).toHaveLength(4)

    await user.click(screen.getByPlaceholderText('How about start with an order'))
    await user.keyboard('Air Tank')
    await user.click(screen.getByRole('option', {name: 'Air Tank (2005-01-03) - Han Seng'}))
    expect(screen.queryAllByRole('listitem')).toHaveLength(5)

    await user.click(screen.getByPlaceholderText('How about start with an order'))    
    await user.keyboard('Air Tank')
    await user.click(screen.getByRole('option', {name: 'Air Tank (2005-01-05) - Han Seng'}))
    expect(screen.queryAllByRole('listitem')).toHaveLength(6)

    await user.click(screen.getByPlaceholderText('How about start with an order'))    
    await user.keyboard('Air Tank')
    await user.click(screen.getByRole('option', {name: 'Air Tank (2005-01-06) - Han Seng'}))
    expect(screen.queryAllByRole('listitem')).toHaveLength(6)

    expect(screen.queryAllByRole('listitem')[5]).toHaveTextContent('2 more...')
    await user.click(screen.getByText("2 more..."))
    expect(screen.queryAllByRole('listitem')).toHaveLength(7)

    await user.click(screen.getByPlaceholderText('How about start with an order'))
    await user.keyboard('Air Tank')
    await user.click(screen.getByRole('option', {name: 'Air Tank (2005-02-09) - Kok Song'}))
    // go to another new supplier
    expect(screen.queryAllByRole('listitem')).toHaveLength(1)

    // go to detail and back to supplier now which is 2
    await user.click(screen.getByRole('tabpanel', {name: 'Detail'}))
    // supplier tab
    await user.click(screen.getByRole('tabpanel', {name: 'Suppliers 2'}))
    // remove Kok Song
    await waitFor(() => {
        expect(screen.queryByRole('button', {name: 'Han Seng'})).toBeInTheDocument()
        expect(screen.queryByRole('button', {name: 'Kok Song'})).toBeInTheDocument()
    })
    await user.click(screen.queryByRole('button', {name: 'Kok Song'}))
    await user.click(screen.queryByRole('button', {name: 'remove supplier Kok Song'}))
    await waitFor(() => expect(screen.queryByRole('button', {name: 'Kok Song'})).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', {name: 'Save'}))

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/spare-parts", 
        {"body": "{\"oems\":[],\"compatibleTrucks\":[],\"partNo\":\"11220000\",\"partName\":\"Air Tank\",\"description\":\"Air Tank for storing air from compressor\",\"supplierIds\":[2000],\"orderIds\":[5000,5004,5005,5006,5007,5008,5009]}", 
            "headers": {"Content-type": "application/json"}, "method": "POST", "mode": "cors"}))

    expect(setShowDialog).lastCalledWith(false)
    expect(afterSave).lastCalledWith({"id": 50001, "orderIds": [5000, 5004, 5005, 5006, 5007, 5008, 5009]})
}, 10000)

test('update existing parts with supplier and photo', async () => {
    URL.createObjectURL = jest.fn(() => 'http://hello.world')
    URL.revokeObjectURL = jest.fn()
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true, // /api/spare-parts/:sparePartId/medias
        json: () => Promise.resolve([{ id: 60001 }])
    }).mockResolvedValueOnce({
        ok: true, // /api/spare-parts/:sparePartId/medias/:mediaId/data
        blob: () => Promise.resolve([Buffer.from("/9j/4AAQSkZJRgABAQEAAAAAAA==", 'base64')])
    })
    .mockResolvedValueOnce({
        ok: true, // POST /api/spare-parts
        json: () => Promise.resolve({ id: 50001 })
    })

    const afterSave = jest.fn()
    const afterRemoveMedia = jest.fn()
    const setShowDialog = jest.fn()

    const SparePartWrapper = () => {
        const [sparePart, setSparePart] = useState({id: 200001, 
            oems:[{name:"TSO",url:"http://tso.com/1122000/air-tank"}],
            compatibleTrucks: [{make:"Hino",model:"700"}],
            partNo:"11220000", partName:"Air Tank", description:"Air Tank for storing air from compressor"})

        return (
            <SparePartDialog afterSave={afterSave} 
                afterRemoveMedia={afterRemoveMedia} 
                suppliers={mockSuppliers}
                isShow
                setShowDialog={setShowDialog}
                sparePart={sparePart}
                setSparePart={setSparePart}></SparePartDialog>
        )
    }

    const theOrders = [...mockOrders.list()]
    theOrders[0].sparePartId = 200001

    render(<SupplierOrderContext value={new SupplierOrders(theOrders, jest.fn())}><SparePartWrapper /></SupplierOrderContext>)

    await waitFor(() => expect(screen.queryAllByRole('img')).toHaveLength(1))

    await user.click(screen.getByRole('button', {name: 'remove oem'}))
    await user.click(screen.getByRole('button', {name: 'remove compatible truck'}))

    await user.click(screen.getByRole('button', {name: 'Save'}))

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/spare-parts", 
        {"body": "{\"id\":200001,\"oems\":[],\"compatibleTrucks\":[],\"partNo\":\"11220000\",\"partName\":\"Air Tank\",\"description\":\"Air Tank for storing air from compressor\",\"supplierIds\":[2000],\"orderIds\":[5000]}", 
            "headers": {"Content-type": "application/json"}, "method": "POST", "mode": "cors"}))

    expect(setShowDialog).lastCalledWith(false)
    expect(afterSave).lastCalledWith({"id": 50001, "orderIds": [5000]})

    expect(URL.createObjectURL).toBeCalledTimes(1)
    expect(URL.revokeObjectURL).toBeCalledWith('http://hello.world')
})