import { jest, test, expect, afterAll } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SupplierSparePartsYearMonthView from '../SupplierSparePartsYearMonthView'
import { SupplierOrderContext } from '../SupplierOrderContextProvider'
import SupplierOrders from '../SupplierOrders'

jest.mock('bootstrap', () => {
    return {
        ScrollSpy: class MockScrollSpy {
                        constructor() {}
                        dispose() {} 
                   }
    }
})

window.matchMedia = jest.fn()

afterAll(() => jest.clearAllMocks())

const mockSuppliers = [
    
    { id: 2001, supplierName: 'Kok Song' },
    { id: 2002, supplierName: 'Ak Ak Sook'},
    { id: 2000, supplierName: 'Han Seng' }, 
    ];

/** @type {import('../SupplierOrders').SupplierOrder[]} */
const theOrders = [
    {id: 5000, supplierId: 2000, partName: 'Air Tank', invoiceDate: '2005-01-01', status: 'ACTIVE', unitPrice: 20, quantity: 8, unit: 'pc'},
    {id: 5001, supplierId: 2001, partName: 'Air Hose', invoiceDate: '2005-02-01', status: 'ACTIVE', unitPrice: 230, quantity: 80, unit: 'unit'},
    {id: 5002, supplierId: 2001, partName: 'Fire Ext', invoiceDate: '2005-02-02', status: 'ACTIVE' },
    {id: 5003, supplierId: 2000, partName: 'Water Pipe', invoiceDate: '2005-01-02', status: 'ACTIVE', unitPrice: 30, quantity: 20, unit: 'pc'},
    {id: 5004, supplierId: 2001, partName: 'Fire Ext', invoiceDate: '2006-03-04', status: 'ACTIVE', unitPrice: 45, quantity: 900, unit: 'litres'},
    {id: 5005, supplierId: 2001, partName: 'Air Hose', invoiceDate: '2006-03-05', status: 'ACTIVE', unitPrice: 50, quantity: 10, unit: 'ft'},
    {id: 5006, supplierId: 2000, partName: 'AirX Hose', invoiceDate: '2005-02-04', status: 'ACTIVE'},
    {id: 5007, supplierId: 2000, partName: 'FireX Ext', invoiceDate: '2005-02-12', status: 'ACTIVE', unitPrice: 44, quantity: 30, unit: 'meters'},
    {id: 5008, supplierId: 2002, partName: 'Brake Chamber', invoiceDate: '2005-02-13', status: 'ACTIVE', unitPrice: 220, quantity: 2, unit: 'pc'},
    {id: 5009, supplierId: 2002, partName: 'Brake Shoe', invoiceDate: '2005-02-12', status: 'ACTIVE', unitPrice: 350, quantity: 3, unit: 'pc'},
    {id: 5010, supplierId: 2002, partName: 'Brake Adjuster', invoiceDate: '2005-02-14', status: 'ACTIVE', unitPrice: 290, quantity: 10, unit: 'unit'},
]

const makeNewOrders = () => new SupplierOrders([...theOrders], jest.fn());

test('this year only', async() => {
    const user = userEvent.setup()
    window.matchMedia.mockReturnValue({matches: true})

    const todayDate = new Date()

    render(<SupplierOrderContext value={makeNewOrders()}>
            <SupplierSparePartsYearMonthView suppliers={mockSuppliers}>
            </SupplierSparePartsYearMonthView>
        </SupplierOrderContext>)
    document.documentElement.setAttribute('data-bs-theme', 'dark')

    await waitFor(() => expect(screen.getAllByRole('button', {name: new Date().getFullYear()})).toHaveLength(1))
    await user.click(screen.getAllByRole('button', {name: new Date().getFullYear()})[0])

    expect(screen.getAllByRole('button', {name: todayDate.getFullYear()})).toHaveLength(1)
    expect(screen.getAllByRole('button', {name: 'change to year 2006'})).toHaveLength(1)

    // over here will failed the rest
    // document.documentElement.removeAttribute('data-bs-theme')

    // click on 2005
    await user.click(screen.getByRole('button', {name: 'change to year 2005'}))
    await user.click(screen.getByRole('button', {name: 'change to month Feb'}))

    // setting undefined wont work, just removeAttribute
    document.documentElement.removeAttribute('data-bs-theme')

    expect(screen.queryAllByRole('document')).toHaveLength(3)
    expect(screen.queryAllByText('Air Hose')).toHaveLength(1)
    expect(screen.queryAllByText('Fire Ext')).toHaveLength(1)
    expect(screen.queryAllByText('AirX Hose')).toHaveLength(1)
    expect(screen.queryAllByText('FireX Ext')).toHaveLength(1)
})