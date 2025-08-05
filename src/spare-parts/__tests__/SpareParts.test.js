import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest, test, expect, afterAll, afterEach } from '@jest/globals';

import SpareParts from '../SpareParts';
import SupplierOrders from '../../suppliers/SupplierOrders';
import { SupplierOrderContext } from '../../suppliers/SupplierOrderContextProvider';

jest.mock('../SparePartDialog', () => ({afterSave, afterRemoveMedia, sparePart}) => 
    <div>
        <span aria-label="existing part detail">{sparePart?.id} {sparePart?.partNo} {sparePart?.partName}</span>
        <span data-testid="afterSave" onClick={(e) => afterSave(e.target.sparePart)}></span>
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

afterEach(() => jest.restoreAllMocks())

const theOrders = [
    {id: 5000, supplierId: 2000, sparePartId: 1000, unitPrice: 5},
    {id: 5001, supplierId: 2001, sparePartId: 1001, unitPrice: 15},
    {id: 5002, supplierId: 2001, sparePartId: 1002, unitPrice: 25},
    {id: 5003, supplierId: 2000, sparePartId: 1003, unitPrice: 15},
    {id: 5004, supplierId: 2001, sparePartId: 1000, unitPrice: 8},
]
const mockSuppliers = [{ id: 2000, supplierName: 'Han Seng' }, { id: 2001, supplierName: 'Kok Song' }];


test('filters spare parts based on search options, then remove search options later on', async () => {
    const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})

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
            { id: 1001, partNo: '22220000', partName: 'Flame Tank', description: 'Flame F Tank', oems:[], compatibleTrucks:[] },
            { id: 1002, partNo: '33220000', partName: 'Brake Adjuster', description: 'Brake adjuster for Hino', oems:[], compatibleTrucks:[] }
        ])
    })
    .mockResolvedValueOnce({
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

    const mockOrders = new SupplierOrders([...theOrders], jest.fn());
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

    expect(screen.getAllByRole("menuitem")).toHaveLength(3)
    expect(document.querySelectorAll('img')).toHaveLength(0)

    expect(intersectionFunc).toBeDefined()
    intersectionFunc([
        {isIntersecting: true, target: {dataset: {sparePartId: 1000}}}, 
        {isIntersecting: true, target: {dataset: {sparePartId: 1001}}},
        {isIntersecting: true, target: {dataset: {sparePartId: 1002}}},
    ])
    intersectionFunc([
        {isIntersecting: false, target: {dataset: {sparePartId: 1002}}},
    ])
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
    expect(observeFn).toBeCalledTimes(3)
    expect(unobserveFn).toBeCalledTimes(2)

    // photo gallery popup
    expect(screen.getAllByRole('button', {name: 'view photos for part 1000'})).toHaveLength(2)
    await user.click(screen.getAllByRole('button', {name: 'view photos for part 1000'})[0])
    await waitFor(() => expect(screen.queryByText('11110000 - Air Tank')).toBeInTheDocument())
    expect(screen.queryByText('11110000 - Air Tank')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Close'))

    // test afterSave and afterRemoveMedia
    const mockAfterSave = screen.getByTestId('afterSave')
    const evt = createEvent.click(mockAfterSave, {target: {sparePart: {
        id: 1003, partNo: '33220001', partName: 'Brake Adjuster', description: 'Brake adjuster', oems:[], compatibleTrucks:[], orderIds: [] 
    }}})
    fireEvent.click(mockAfterSave, evt)
    // increase to 4 (from 3)
    expect(screen.getAllByRole("menuitem")).toHaveLength(4)

    fireEvent.click(screen.getByTestId('afterRemoveMedia'))
    // image reduce to 3 (from 4)
    expect(document.querySelectorAll('img')).toHaveLength(3)

    // finally remove the part
    expect(screen.getAllByRole('button', {'name': 'remove'})).toHaveLength(4)
    fireEvent.click(screen.getAllByRole('button', {'name': 'remove'})[0])
    fireEvent.click(screen.getAllByRole('button', {'name': 'remove'})[0])

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/spare-parts/1003", 
        {"headers": {"Content-type": "application/json"}, "method": "DELETE", "mode": "cors"}))
});

test('intersection observer and timeout navigation', async () => {
    const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})

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
            { id: 1000, partNo: '11110000', partName: 'Air Tank', description: 'Air A Tank', oems:[], compatibleTrucks:[{make: 'Hino', model: '700'}] },
            { id: 1001, partNo: '22220000', partName: 'Flame Tank', description: 'Flame F Tank', oems:[], compatibleTrucks:[{make: 'Hino', model: '500'}] },
            { id: 1002, partNo: '33220000', partName: 'Brake Adjuster', description: 'Brake adjuster for Fuso', oems:[], compatibleTrucks:[{make: 'Fuso', model: 'Super Great'}] }
        ])
    })
    .mockResolvedValueOnce({
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
    })

    const clearTimeoutFn = jest.spyOn(global, 'clearTimeout')
    const mockOrders = new SupplierOrders([...theOrders], jest.fn());
    const mockSearchOptions = [];

    const {rerender} =render(
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

    expect(screen.getAllByRole("menuitem")).toHaveLength(3)
    expect(document.querySelectorAll('img')).toHaveLength(0)

    const entries = [
        {isIntersecting: true, target: {dataset: {sparePartId: 1000}}}, 
        {isIntersecting: true, target: {dataset: {sparePartId: 1001}}},
        {isIntersecting: true, target: {dataset: {sparePartId: 1002}}},
    ]

    expect(intersectionFunc).toBeDefined()
    intersectionFunc(entries)
    entries[2].isIntersecting = false
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
    expect(observeFn).toBeCalledTimes(3)
    expect(unobserveFn).toBeCalledTimes(2)

    // complete the else-part flow
    entries[0].isIntersecting = false
    entries[1].isIntersecting = false
    intersectionFunc(entries)

    expect(clearTimeoutFn).toBeCalledTimes(3)

    // to clear by useEffect clean up
    intersectionFunc(entries.map(e => {e.isIntersecting=true; return e}))
    rerender(
        <SupplierOrderContext value={mockOrders}><SpareParts
        suppliers={mockSuppliers}
        selectedSearchOptions={[{name: 'tank'}, {name: 'Hino'}]}
        totalSpareParts={10}
        setTotalSpareParts={jest.fn()}
        /></SupplierOrderContext>)
    
    expect(clearTimeoutFn).toBeCalledTimes(4)
    expect(screen.getAllByRole("menuitem")).toHaveLength(2)
});

test('update existing parts', async() => {
    const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})

    jest.doMock('../SparePartDialog', () => ({afterSave, afterRemoveMedia}) => 
        <div>
            <span data-testid="afterSave" onClick={() => afterSave({id: 1002, partNo: '33220000', partName: 'Brake Adjuster B', description: 'Brake Adjuster B', oems: [], compatibleTrucks: []})}></span>
            <span data-testid="afterRemoveMedia" onClick={() => afterRemoveMedia({id: 3001})}></span>
        </div>
    )

    global.IntersectionObserver = jest.fn((fn) => {
        intersectionFunc = fn
        return {
            disconnect: jest.fn(), observe: jest.fn(), unobserve: jest.fn()
        }
    })

    global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            { id: 1000, partNo: '11110000', partName: 'Air Tank', description: 'Air A Tank', oems:[], compatibleTrucks:[] },
            { id: 1001, partNo: '22220000', partName: 'Flame Tank', description: 'Flame F Tank', oems:[], compatibleTrucks:[] },
            { id: 1002, partNo: '33220000', partName: 'Brake Adjuster', description: 'Brake adjuster for Hino', oems:[], compatibleTrucks:[] }
        ])
    })
    .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
    })

    // search parts with 'tank' keyword
    const mockOrders = new SupplierOrders([...theOrders], jest.fn());
    render(
        <SupplierOrderContext value={mockOrders}><SpareParts
        suppliers={mockSuppliers}
        selectedSearchOptions={[{name: "tank"}]}
        totalSpareParts={10}
        setTotalSpareParts={jest.fn()}
        /></SupplierOrderContext>
    );

    // Wait for the spare part to be rendered
    await waitFor(() => {
        screen.getByText('11110000');
    })
    expect(screen.getAllByRole("menuitem")).toHaveLength(2)
    expect(screen.queryAllByText('Air Tank')).toHaveLength(1)
    expect(screen.queryAllByText('Flame Tank')).toHaveLength(1)
    expect(screen.queryAllByText('Brake Adjuster')).toHaveLength(0)

    // also price range
    expect(screen.queryByText('$5 - $8')).toBeInTheDocument()

    // after save for to work on existing spare part
    const mockAfterSave = screen.getByTestId('afterSave')
    const evt = createEvent.click(mockAfterSave, {target: {sparePart: {
        id: 1002, partNo: '33220000', partName: 'Brake Adjuster XB', description: 'Brake adjuster for Heavy Tank', 
            oems:[{name: 'OSK', url: 'http://osk.com'}], 
            compatibleTrucks:[{make: 'Hino', model: '700'}], 
            orderIds: [] 
    }}})
    fireEvent.click(mockAfterSave, evt)

    expect(screen.getAllByRole("menuitem")).toHaveLength(3)

    // existing
    await user.click(screen.getByRole('button', {name: 'header for Brake Adjuster XB'}))
    expect(screen.getByLabelText('existing part detail')).toHaveTextContent('1002 33220000 Brake Adjuster XB')

    // create new
    await user.click(screen.getByRole('button', {name: 'button to show dialog for add/edit spare part'}))
    expect(screen.getByLabelText('existing part detail')).toHaveTextContent('')
})