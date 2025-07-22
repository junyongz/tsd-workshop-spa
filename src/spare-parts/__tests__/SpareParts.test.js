import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest, test, expect, afterAll } from '@jest/globals';

import SpareParts from '../SpareParts';
import SupplierOrders from '../../suppliers/SupplierOrders';
import { SupplierOrderContext } from '../../suppliers/SupplierOrderContextProvider';

jest.mock('../SparePartDialog', () => ({afterSave, afterRemoveMedia}) => 
    <div>
        <span data-testid="afterSave" onClick={() => afterSave({id: 3000, partNo: '111220000',  oems: [], compatibleTrucks: []})}></span>
        <span data-testid="afterRemoveMedia" onClick={() => afterRemoveMedia({id: 3001})}></span>
    </div>
)
jest.useFakeTimers()

global.URL.createObjectURL = jest.fn((blob) => 'mocked-url');

afterAll(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useRealTimers()
})

test('filters spare parts based on search options, then remove search options later on', async () => {
    const user = userEvent.setup()

    let intersectionFunc;
    const disconnectFn = jest.fn()
    const observeFn = jest.fn()
    const unobserveFn = jest.fn()
    global.IntersectionObserver = jest.fn((fn) => {
        intersectionFunc = fn
        return {
            disconnect: disconnectFn,
            observe: observeFn,
            unobserve: unobserveFn
        }
    })

    global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            { id: 1000, partNo: '11110000', partName: 'Air Tank', description: 'Air A Tank', oems:[], compatibleTrucks:[] },
            { id: 1001, partNo: '22220000', partName: 'Flame Tank', description: 'Flame F Tank', oems:[], compatibleTrucks:[] }
        ])
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{id: 3000, sparePartId: 1000}, {id: 3001, sparePartId: 1000}])
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{id: 3002, sparePartId: 1001}, {id: 3003, sparePartId: 1001}])
    }).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve("")
    }).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve("")
    }).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve("")
    }).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve("")
    }).mockResolvedValueOnce({
        ok: true, // DELETE /api/spare-parts/:id
        json: () => Promise.resolve(3000)
    })

    const mockOrders = new SupplierOrders([
        {id: 5000, supplierId: 2000, sparePartId: 1000},
        {id: 5001, supplierId: 2001, sparePartId: 1001},
        {id: 5002, supplierId: 2001, sparePartId: 1002},
        {id: 5003, supplierId: 2000, sparePartId: 1003}
    ], jest.fn());
    const mockSuppliers = [{ id: 2000, supplierName: 'Han Seng' }, { id: 2001, supplierName: 'Kok Song' }];
    const mockSearchOptions = [];

    render(
        <SupplierOrderContext value={mockOrders}><SpareParts
        suppliers={mockSuppliers}
        selectedSearchOptions={mockSearchOptions}
        totalSpareParts={10}
        setTotalSpareParts={jest.fn()}
        /></SupplierOrderContext>
    );

    // Wait for the spare part to be rendered
    await waitFor(() => {
        screen.getByText('11110000');
    })

    const partName = await screen.findByText('Flame Tank');
    expect(partName).toBeInTheDocument();

    expect(global.fetch).nthCalledWith(1, "http://localhost:8080/api/spare-parts", {"headers": {"Content-type": "application/json"}, "mode": "cors"})

    expect(screen.getAllByRole("menuitem")).toHaveLength(2)
    expect(document.querySelectorAll('img')).toHaveLength(0)

    expect(intersectionFunc).toBeDefined()
    intersectionFunc([{isIntersecting: true, target: {dataset: {sparePartId: 1000}}}, {isIntersecting: true, target: {dataset: {sparePartId: 1001}}}])
    jest.advanceTimersByTime(800)

    await waitFor(() => {
        expect(global.fetch).nthCalledWith(2, "http://localhost:8080/api/spare-parts/1000/medias")
        expect(global.fetch).nthCalledWith(3, "http://localhost:8080/api/spare-parts/1001/medias")
        expect(global.fetch).nthCalledWith(4, "http://localhost:8080/api/spare-parts/1000/medias/3000/data")
        expect(global.fetch).nthCalledWith(5, "http://localhost:8080/api/spare-parts/1000/medias/3001/data")
        expect(global.fetch).nthCalledWith(6, "http://localhost:8080/api/spare-parts/1001/medias/3002/data")
        expect(global.fetch).nthCalledWith(7, "http://localhost:8080/api/spare-parts/1001/medias/3003/data") 
    })

    expect(document.querySelectorAll('img')).toHaveLength(4)
    expect(disconnectFn).toBeCalledTimes(1)
    expect(observeFn).toBeCalledTimes(2)
    expect(unobserveFn).toBeCalledTimes(2)

    // test afterSave and afterRemoveMedia
    fireEvent.click(screen.getByTestId('afterSave'))
    // increase to 3 (from 2)
    expect(screen.getAllByRole("menuitem")).toHaveLength(3)

    fireEvent.click(screen.getByTestId('afterRemoveMedia'))
    // image reduce to 3 (from 4)
    expect(document.querySelectorAll('img')).toHaveLength(3)

    // finally remove the part
    expect(screen.getAllByRole('button', {'name': 'remove'})).toHaveLength(3)
    fireEvent.click(screen.getAllByRole('button', {'name': 'remove'})[0])
    fireEvent.click(screen.getAllByRole('button', {'name': 'remove'})[0])

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/spare-parts/3000", 
        {"headers": {"Content-type": "application/json"}, "method": "DELETE", "mode": "cors"}))
});