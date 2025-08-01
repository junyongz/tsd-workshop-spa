import { jest, test, expect, afterAll } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SuppliersSpareParts from '../SuppliersSpareParts'
import { SupplierOrderContext } from '../SupplierOrderContextProvider'
import SupplierOrders from '../SupplierOrders'

window.matchMedia = jest.fn()
const setLoading = jest.fn()
const refreshSparePartUsages = jest.fn()
const refreshServices = jest.fn()

afterEach(() => jest.clearAllMocks())

test('test together with SupplierSpareParts.jsx', async () => {
    const user = userEvent.setup()

    global.fetch = jest.fn()
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            {id: 550001, startDate: '2022-02-02'}
        ])
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
    })

    window.matchMedia.mockReturnValue({
        refCount: 0,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        matches: false,           // Added for completeness, can be adjusted
        media: '(min-width: 768px)', // Default media query, can be adjusted
        onchange: null            // Added for completeness
    })

    const suppliers = [
        {id: 2001, supplierName: 'Tong Fong'},
        {id: 2002, supplierName: 'GD Workzone'},
    ]
    const vehicles = [
        {id: 3001, vehicleNo: 'J 23'},
        {id: 3002, vehicleNo: 'J 33'},
    ]
    const orders = [
        {id: 1000, itemCode: '100001', partName: 'Brake Pads', supplierId: 2001, quantity: 8, unit: 'pc', unitPrice: 8.8, status: 'ACTIVE'},
        {id: 1001, itemCode: '100001', partName: 'Brake Adjuster', supplierId: 2002, quantity: 5, unit: 'pc', unitPrice: 230, status: 'ACTIVE'}
    ]

    render(
    <SupplierOrderContext value={ new SupplierOrders(orders, jest.fn())}>
        <SuppliersSpareParts suppliers={suppliers}
            vehicles={vehicles}
            setLoading={setLoading}
            refreshSparePartUsages={refreshSparePartUsages}
            refreshServices={refreshServices}
        />
    </SupplierOrderContext>)

    const usageButtons = screen.queryAllByLabelText(/record usage for order/)
    expect(usageButtons).toHaveLength(2)
        
    await user.click(usageButtons[0])
    expect(screen.getByText('Brake Pads, tinggal lagi: 8 pc')).toBeInTheDocument()

    // choose a vehicle
    await user.click(screen.getByPlaceholderText('Choose a vehicle...'))
    await user.click(screen.getByText('J 23'))

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/workshop-services?vehicleId=3001", 
        {"headers": {"Content-type": "application/json"}, "mode": "cors"}))

    // key in the information
    await waitFor(() => expect(screen.getByText('Service started at 2022-02-02')).toBeInTheDocument())
    await user.click(document.querySelector('input[name="usageDate"]'))
    await user.keyboard("2022-02-05")
    await user.click(document.querySelector('input[name="quantity"]'))
    await user.keyboard("4")

    // and save it to call fetch api
    await user.click(screen.getByText('Save'))
    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/spare-part-utilizations", 
        {"body": "{\"vehicleId\":3001,\"vehicleNo\":\"J 23\",\"usageDate\":\"2022-02-05\",\"orderId\":1000,\"serviceId\":\"550001\",\"quantity\":\"4\",\"soldPrice\":8.8}", 
            "headers": {"Content-type": "application/json"}, "method": "POST", "mode": "cors"}))

    expect(setLoading).toBeCalledTimes(2)
    expect(refreshSparePartUsages).toBeCalledTimes(1)
    expect(refreshServices).toBeCalledTimes(1)
})

test('remove vehicle, return more than 1 workshop services', async () => {
    const user = userEvent.setup()

    global.fetch = jest.fn()
    global.fetch.mockResolvedValueOnce({
        ok: true, // /api/workshop-services?vehicleId=3001
        json: () => Promise.resolve([
            {id: 550001, startDate: '2022-02-02'},
            {id: 550002, startDate: '2022-02-03'}
        ])
    }).mockResolvedValueOnce({
        ok: true, // /api/workshop-services?vehicleId=3001
        json: () => Promise.resolve([
            {id: 550001, startDate: '2022-02-02'},
            {id: 550002, startDate: '2022-02-03'}
        ])
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
    })

    window.matchMedia.mockReturnValue({
        refCount: 0,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        matches: false,           // Added for completeness, can be adjusted
        media: '(min-width: 768px)', // Default media query, can be adjusted
        onchange: null            // Added for completeness
    })

    const suppliers = [
        {id: 2001, supplierName: 'Tong Fong'},
        {id: 2002, supplierName: 'GD Workzone'},
    ]
    const vehicles = [
        {id: 3001, vehicleNo: 'J 23'},
        {id: 3002, vehicleNo: 'J 33'},
    ]
    const orders = [
        {id: 1000, itemCode: '100001', partName: 'Brake Pads', supplierId: 2001, quantity: 8, unit: 'pc', unitPrice: 8.8, status: 'ACTIVE'},
        {id: 1001, itemCode: '100001', partName: 'Brake Adjuster', supplierId: 2002, quantity: 5, unit: 'pc', unitPrice: 230, status: 'ACTIVE'}
    ]

    render(<SupplierOrderContext value={ new SupplierOrders(orders, jest.fn())}>
            <SuppliersSpareParts suppliers={suppliers}
                vehicles={vehicles}
                setLoading={setLoading}
                refreshSparePartUsages={refreshSparePartUsages}
                refreshServices={refreshServices}
            />
        </SupplierOrderContext>)

    await user.click(screen.queryAllByLabelText(/record usage for order/)[0])

    // choose a vehicle then delete it
    await user.click(screen.getByPlaceholderText('Choose a vehicle...'))
    await user.click(screen.getByText('J 23'))
    await user.click(screen.getByPlaceholderText('Choose a vehicle...'))
    await user.keyboard('{Control>}A{/Control}[Backspace]')
    await user.click(screen.getByText('Save'))
    // failed validation
    expect(screen.getByPlaceholderText('Choose a vehicle...')).not.toBeValid()

    // now to proper vehicle selection
    await user.click(screen.getByPlaceholderText('Choose a vehicle...'))
    await user.click(screen.getByText('J 23'))

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/workshop-services?vehicleId=3001", 
        {"headers": {"Content-type": "application/json"}, "mode": "cors"}))

    // should have 2 workshop services
    expect(screen.queryAllByText(/Service started at/)).toHaveLength(2)
    await user.click(screen.getAllByRole('radio')[1])

    // ok, input date and quantity
    await user.click(document.querySelector('input[name="usageDate"]'))
    await user.keyboard("2022-02-05")
    await user.click(document.querySelector('input[name="quantity"]'))
    await user.keyboard("4")

    // go
    await user.click(screen.getByText('Save'))
    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/spare-part-utilizations", 
        {"body": "{\"vehicleId\":3001,\"vehicleNo\":\"J 23\",\"usageDate\":\"2022-02-05\",\"orderId\":1000,\"serviceId\":\"550001\",\"quantity\":\"4\",\"soldPrice\":8.8}", 
            "headers": {"Content-type": "application/json"}, "method": "POST", "mode": "cors"}))

    expect(setLoading).toBeCalledTimes(2)
    expect(refreshSparePartUsages).toBeCalledTimes(1)
    expect(refreshServices).toBeCalledTimes(1)
})