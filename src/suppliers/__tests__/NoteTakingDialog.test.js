import { jest, test, expect, afterAll } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SuppliersSpareParts from '../SuppliersSpareParts'
import { SupplierOrderContext } from '../SupplierOrderContextProvider'
import SupplierOrders from '../SupplierOrders'

window.matchMedia = jest.fn()
const setLoading = jest.fn()

afterAll(() => jest.clearAllMocks())

test('test together with SupplierSpareParts.jsx', async () => {
    const user = userEvent.setup()

    global.fetch = jest.fn()
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{id: 1001}])
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
        {id: 1000, itemCode: '100001', partName: 'Brake Pads', supplierId: 2001, quantity: 8, unit: 'pc', unitPrice: 8.8, notes: 'Hello World', status: 'ACTIVE'},
        {id: 1001, itemCode: '100001', partName: 'Brake Adjuster', supplierId: 2002, quantity: 5, unit: 'pc', unitPrice: 230, notes: 'To return to Supplier', status: 'ACTIVE'}
    ]

    render(
    <SupplierOrderContext value={
        new SupplierOrders(orders, jest.fn())
    }>
        <SuppliersSpareParts suppliers={suppliers}
            vehicles={vehicles}
            setLoading={setLoading}
        />
    </SupplierOrderContext>)

    const noteButtons = document.querySelectorAll('.bi-pencil')
    expect(noteButtons).toHaveLength(2)
        
    await user.click(noteButtons[1])
    expect(screen.getByText('Brake Adjuster (5 left)')).toBeInTheDocument()

    // key in the information
    expect(screen.getAllByText('To return to Supplier')).toHaveLength(2)
    await user.click(document.querySelector('textarea[name="notes"]'))
    await user.keyboard('{Control>}A{/Control}[Backspace]What am i going to do without you')

    // and save it to call fetch api
    await user.click(screen.getByText('Save'))
    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/supplier-spare-parts?op=NOTES", 
        {"body": "[{\"id\":1001,\"itemCode\":\"100001\",\"partName\":\"Brake Adjuster\",\"supplierId\":2002,\"quantity\":5,\"unit\":\"pc\",\"unitPrice\":230,\"notes\":\"What am i going to do without you\",\"status\":\"ACTIVE\",\"remaining\":5,\"supplierName\":\"GD Workzone\"}]", 
            "headers": {"Content-type": "application/json"}, "method": "POST", "mode": "cors"}))
})