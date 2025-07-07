import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpareParts from '../SpareParts';
import SupplierOrders from '../../suppliers/SupplierOrders';
import { jest, test, expect } from '@jest/globals';
import '@testing-library/jest-dom';

jest.mock('react-bootstrap-typeahead/types/utils/getOptionLabel', () => ({
    getOptionLabel: (opt, labelKey) => opt[labelKey]
}));

global.URL.createObjectURL = jest.fn((blob) => 'mocked-url');

test('filters spare parts based on search options, then remove search options later on', async () => {
    const user = userEvent.setup()

    global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            { id: 1000, partNo: '11110000', partName: 'Air Tank', description: 'Air A Tank', oems:[], compatibleTrucks:[] },
            { id: 1001, partNo: '22220000', partName: 'Flame Tank', description: 'Flame F Tank', oems:[], compatibleTrucks:[] }
        ]),
        headers: {
            get: (key) => ({
            'X-Total-Elements': '10',
            'X-Total-Pages': '3',
            }[key] || null),
        },
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
        ok: true,
        json: () => Promise.resolve([
            { id: 1002, partNo: '33330000', partName: 'Air Compressor', description: 'Super Huge', oems:[], compatibleTrucks:[] },
        ]),
        headers: {
            get: (key) => ({
            'X-Total-Elements': '10',
            'X-Total-Pages': '3',
            }[key] || null),
        },
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{id: 3004, sparePartId: 1002}])
    }).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve("")
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            { id: 1003, partNo: '44444000', partName: 'Cabin Absorber', description: 'Cabin Absorber', oems:[], compatibleTrucks:[] },
        ]),
        headers: {
            get: (key) => ({
            'X-Total-Elements': '10',
            'X-Total-Pages': '3',
            }[key] || null),
        },
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{id: 3005, sparePartId: 1003}])
    }).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve("")
    })
    ;

    const mockOrders = new SupplierOrders([
        {id: 5000, supplierId: 2000, sparePartId: 1000},
        {id: 5001, supplierId: 2001, sparePartId: 1001},
        {id: 5002, supplierId: 2001, sparePartId: 1002},
        {id: 5003, supplierId: 2000, sparePartId: 1003}
    ], jest.fn());
    const mockSuppliers = [{ id: 2000, supplierName: 'Han Seng' }, { id: 2001, supplierName: 'Kok Song' }];
    const mockSearchOptions = [{ name: 'Hino' }];

    const { rerender } = render(
        <SpareParts
        orders={mockOrders}
        suppliers={mockSuppliers}
        selectedSearchOptions={mockSearchOptions}
        totalSpareParts={10}
        setTotalSpareParts={jest.fn()}
        />
    );

    // Wait for the spare part to be rendered
    const partNo = await screen.findByText('11110000');
    expect(partNo).toBeInTheDocument();

    const partName = await screen.findByText('Flame Tank');
    expect(partName).toBeInTheDocument();

    expect(global.fetch).nthCalledWith(1, "http://localhost:8080/api/spare-parts?pageNumber=1&pageSize=4&keyword=Hino", {"headers": {"Content-type": "application/json"}, "mode": "cors"})
    expect(global.fetch).nthCalledWith(2, "http://localhost:8080/api/spare-parts/1000/medias")
    expect(global.fetch).nthCalledWith(3, "http://localhost:8080/api/spare-parts/1001/medias")
    expect(global.fetch).nthCalledWith(4, "http://localhost:8080/api/spare-parts/1000/medias/3000/data")
    expect(global.fetch).nthCalledWith(5, "http://localhost:8080/api/spare-parts/1000/medias/3001/data")
    expect(global.fetch).nthCalledWith(6, "http://localhost:8080/api/spare-parts/1001/medias/3002/data")
    expect(global.fetch).nthCalledWith(7, "http://localhost:8080/api/spare-parts/1001/medias/3003/data")

    const moreButton = document.querySelector('#more-button')
    await user.click(moreButton)

    expect(global.fetch).nthCalledWith(8, "http://localhost:8080/api/spare-parts?pageNumber=2&pageSize=4&keyword=Hino", {"headers": {"Content-type": "application/json"}, "mode": "cors"})
    expect(global.fetch).nthCalledWith(9, "http://localhost:8080/api/spare-parts/1002/medias")
    expect(global.fetch).nthCalledWith(10, "http://localhost:8080/api/spare-parts/1002/medias/3004/data")

    rerender(
        <SpareParts
        orders={mockOrders}
        suppliers={mockSuppliers}
        selectedSearchOptions={[]}
        totalSpareParts={1}
        setTotalSpareParts={jest.fn()}
        />
    )

    // await would only make .fetch assertion to be correct
    const newPartNo = await screen.findByText('44444000');
    expect(newPartNo).toBeInTheDocument();

    try {
        await screen.findByText('Air Tank');
    }
    catch (err) {
        expect(err.message).toEqual(expect.stringContaining("Unable to find an element with the text: Air Tank"))
    }

    expect(global.fetch).nthCalledWith(11, "http://localhost:8080/api/spare-parts?pageNumber=1&pageSize=4", {"headers": {"Content-type": "application/json"}, "mode": "cors"})
    expect(global.fetch).nthCalledWith(12, "http://localhost:8080/api/spare-parts/1003/medias")
    expect(global.fetch).nthCalledWith(13, "http://localhost:8080/api/spare-parts/1003/medias/3005/data")
    expect(global.fetch).not.nthCalledWith(14, expect.anything())
});