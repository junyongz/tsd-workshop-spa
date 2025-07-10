import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, jest } from '@jest/globals'
import { WorkshopServicesProvider } from '../services/ServiceContextProvider';
import { SupplierOrderContext } from '../suppliers/SupplierOrderContextProvider';
import ServiceListing from '../ServiceListing';
import SupplierOrders from '../suppliers/SupplierOrders';

test('listing no search options, delete one item, delete service', async () => {
    global.fetch = jest.fn()
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(990001)
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(10001)
    })

    const user = userEvent.setup()

    window.matchMedia = jest.fn(() => {return {
        refCount: 0,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        matches: false,           // Added for completeness, can be adjusted
        media: '(min-width: 768px)', // Default media query, can be adjusted
        onchange: null            // Added for completeness
    }})

    const suppliers = [{id: 60001, supplierName: "Tok Kong"}, {id: 60002, supplierName: "KHD"}]

    const transactions = [
        {id: 10001, startDate: '2022-02-02', vehicleId: 20001, vehicleNo: "J 23", mileageKm: 230000,
            sparePartUsages: [{id: 990001, orderId: 1000, quantity: 20, usageDate: '2022-02-03'}]
        },
        {id: 10002, startDate: '2022-01-10', vehicleId: 20002, vehicleNo: "J 33", mileageKm: 20000,
            sparePartUsages: [{id: 990002, orderId: 1000, quantity: 30, usageDate: '2022-01-11'}]    
        },
        {id: 10003, startDate: '2022-01-01', vehicleId: 20003, vehicleNo: "J 34", mileageKm: 3100,
            sparePartUsages: [{id: 990003, orderId: 1001, quantity: 2, usageDate: '2022-01-03'}]    
        }
    ]

    const orders = [{id: 1000, supplierId: 60001, itemCode: '1000', partName: 'Engine Oil 20w-50', quantity: 100, unit: 'litres', unitPrice: 9.7, status: 'ACTIVE'},
        {id: 2000, supplierId: 60002, itemCode: '2000', partName: 'Oil Filter', quantity: 5, unit: 'pc', unitPrice: 29.5, status: 'ACTIVE'}]

    const setTotalFilteredServices = jest.fn()    
    render(<WorkshopServicesProvider initialServices={transactions}>
        <SupplierOrderContext value={new SupplierOrders(orders, jest.fn())}>
            <ServiceListing selectedSearchOptions={[]} 
                setTotalFilteredServices={setTotalFilteredServices}
                suppliers={suppliers} />
        </SupplierOrderContext>
    </WorkshopServicesProvider>)

    expect(document.querySelectorAll('.list-group-item')).toHaveLength(3)

    // let's try delete one item
    const priceTags = document.querySelectorAll('.price-tag')
    await user.hover(priceTags[0])
    // click first time, become red
    await user.click(priceTags[0])
    // click 2nd time, deleted
    await user.click(priceTags[0])

    await waitFor(() => expect(document.querySelectorAll('.list-group-item')).toHaveLength(2))
    expect(global.fetch).toBeCalledWith("http://localhost:8080/api/spare-part-utilizations/990001", 
        {"headers": {"Content-type": "application/json"}, "method": "DELETE"})

    // delete service
    await user.click(document.querySelectorAll('.bi-trash3')[0])
    // click again when it is red
    await user.click(document.querySelectorAll('.bi-trash3')[0])

    await waitFor(() => expect(screen.queryByText("J 23")).not.toBeInTheDocument())
    expect(global.fetch).toBeCalledWith("http://localhost:8080/api/workshop-services/10001", 
        {"headers": {"Content-type": "application/json"}, "method": "DELETE"})

    // finally click on Add New button
    await user.click(screen.getByText('Add New'))
    expect(screen.queryByText('Service started at ' + new Date().toISOString().split('T')[0])).toBeInTheDocument()
})