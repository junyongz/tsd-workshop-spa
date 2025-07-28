import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, jest, afterEach } from '@jest/globals'
import { WorkshopServicesProvider } from '../services/ServiceContextProvider';
import { SupplierOrderContext } from '../suppliers/SupplierOrderContextProvider';
import ServiceListing from '../ServiceListing';
import SupplierOrders from '../suppliers/SupplierOrders';
import { addDaysToDateStr } from '../utils/dateUtils';

jest.mock('../services/ServiceNoteTakingDialog', () => ({isShow, onSaveNote}) => 
    <div>
        <span data-is-show={isShow} data-testid="onSaveNote" onClick={() => onSaveNote({id: 10001, vehicleNo: "J 23", notes: 'Hello World'})}></span>
    </div>
)

jest.mock('../services/ServiceMediaDialog', () => ({isShow, onSaveMedia}) => 
    <div>
        <span data-is-show={isShow} data-testid="onSaveMedia" onClick={() => onSaveMedia(
                {id: 10001, vehicleNo: "J 23"}, 
                new File([new Blob(['content'], { type: 'text/plain'})], 'test.txt', { type: 'text/plain' }), 
                () => {})}></span>
    </div>
)

global.fetch = jest.fn()

const suppliers = [{id: 60001, supplierName: "Tok Kong"}, {id: 60002, supplierName: "KHD"}]

const transactions = [
    {id: 10001, creationDate: '2022-02-02', startDate: '2022-02-02', vehicleId: 20001, vehicleNo: "J 23", mileageKm: 230000,
        sparePartUsages: [{id: 990001, orderId: 1000, quantity: 20, usageDate: '2022-02-03', soldPrice: 10}]
    },
    {id: 10002, creationDate: '2022-01-11', startDate: '2022-01-10', vehicleId: 20002, vehicleNo: "J 33", mileageKm: 20000,
        sparePartUsages: [{id: 990002, orderId: 1000, quantity: 30, usageDate: '2022-01-11', soldPrice: 11}]    
    },
    {id: 10003, creationDate: '2022-01-01', startDate: '2022-01-01', vehicleId: 20003, vehicleNo: "J 34", mileageKm: 3100,
        sparePartUsages: [{id: 990003, orderId: 2000, quantity: 2, usageDate: '2022-01-03', soldPrice: 35}]    
    }
]

const newTransactions = () => {
    return [...transactions].map((t, i) => {
        return {...t, sparePartUsages: [...transactions[i].sparePartUsages]}
    })
}

const orders = [{id: 1000, supplierId: 60001, itemCode: '1000', partName: 'Engine Oil 20w-50', quantity: 100, unit: 'litres', unitPrice: 9.7, status: 'ACTIVE'},
    {id: 2000, supplierId: 60002, itemCode: '2000', partName: 'Oil Filter', quantity: 5, unit: 'pc', unitPrice: 29.5, status: 'ACTIVE'}]

afterEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    cleanup()
})

test('listing no search options, delete one item, delete service', async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(990001)
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(10001)
    })

    window.matchMedia = jest.fn(() => {return {
        refCount: 0,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        matches: false,           // Added for completeness, can be adjusted
        media: '(min-width: 768px)', // Default media query, can be adjusted
        onchange: null            // Added for completeness
    }})

    const user = userEvent.setup()

    const setTotalFilteredServices = jest.fn()
    const setLoading = jest.fn()  
    const initialServices = newTransactions()
    const { container, unmount } = render(<WorkshopServicesProvider initialServices={initialServices}>
        <SupplierOrderContext value={new SupplierOrders([...orders], jest.fn())}>
            <ServiceListing selectedSearchOptions={[]} 
                setTotalFilteredServices={setTotalFilteredServices}
                suppliers={[...suppliers]} setLoading={setLoading} />
        </SupplierOrderContext>
    </WorkshopServicesProvider>)

    expect(screen.getAllByText('Complete Service')).toHaveLength(3)
    expect(container.querySelectorAll('.list-group-item')).toHaveLength(3)

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

    // check again
    expect(container.querySelectorAll('.list-group-item')).toHaveLength(2)
    await waitFor(() => expect(setLoading).toBeCalledTimes(4))

    // finally click on Add New button
    await user.click(screen.getByText('Add New'))
    expect(screen.queryByText('Service started at ' + addDaysToDateStr(new Date(), 0))).toBeInTheDocument()

    unmount()
})

test('to complete service', async () => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({...transactions[0], completionDate: addDaysToDateStr(new Date(), 0)})
    })

    window.matchMedia = jest.fn(() => {return {
        refCount: 0,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        matches: false,           // Added for completeness, can be adjusted
        media: '(min-width: 768px)', // Default media query, can be adjusted
        onchange: null            // Added for completeness
    }})

    const user = userEvent.setup()

    const setTotalFilteredServices = jest.fn()
    const setLoading = jest.fn()
    const initialServices = newTransactions()
    const { container, unmount } = render(<WorkshopServicesProvider initialServices={initialServices}>
        <SupplierOrderContext value={new SupplierOrders([...orders], jest.fn())}>
            <ServiceListing selectedSearchOptions={[]} 
                setTotalFilteredServices={setTotalFilteredServices}
                suppliers={[...suppliers]}
                setLoading={setLoading} />
        </SupplierOrderContext>
    </WorkshopServicesProvider>)

    expect(screen.getAllByText('Complete Service')).toHaveLength(3)
    expect(container.querySelectorAll('.list-group-item')).toHaveLength(3)

    // let's try complete a workshop service
    const completeButton = screen.getAllByText('Complete Service')[0]
    await user.click(completeButton)
    
    // choose a date
    const todayDate = new Date()
    const keyInCompletionDate = addDaysToDateStr(todayDate, 0)

    // click on green color go
    await user.click(screen.getByText('Go'))

    await waitFor(() => expect(global.fetch).toBeCalledWith("http://localhost:8080/api/workshop-services?op=COMPLETE", {"body": "{\"id\":10001,\"creationDate\":\"2022-02-02\",\"startDate\":\"2022-02-02\",\"vehicleId\":20001,\"vehicleNo\":\"J 23\",\"mileageKm\":230000,\"sparePartUsages\":[{\"id\":990001,\"orderId\":1000,\"quantity\":20,\"usageDate\":\"2022-02-03\",\"soldPrice\":10}],\"completionDate\":\""+keyInCompletionDate+"\"}", 
        "headers": {"Content-type": "application/json"}, "method": "POST"}))
    await waitFor(() => expect(screen.getAllByText(`Completed on ${keyInCompletionDate}`)).toHaveLength(1))

    unmount()
})

test('on save note and save media', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({...transactions[0], notes: 'Hello World'})
    }).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("222000009")
    })

    window.matchMedia = jest.fn(() => {return {
        refCount: 0,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        matches: false,           // Added for completeness, can be adjusted
        media: '(min-width: 768px)', // Default media query, can be adjusted
        onchange: null            // Added for completeness
    }})

    const setTotalFilteredServices = jest.fn()
    const setLoading = jest.fn()
    const initialServices = newTransactions()
    const { container, unmount } = render(<WorkshopServicesProvider initialServices={initialServices}>
        <SupplierOrderContext value={new SupplierOrders([...orders], jest.fn())}>
            <ServiceListing selectedSearchOptions={[]} 
                setTotalFilteredServices={setTotalFilteredServices}
                suppliers={[...suppliers]}
                setLoading={setLoading} />
        </SupplierOrderContext>
    </WorkshopServicesProvider>)

    expect(screen.getAllByText('Complete Service')).toHaveLength(3)
    expect(container.querySelectorAll('.list-group-item')).toHaveLength(3)

    expect(screen.queryAllByRole('button', {name: 'note-taking'})).toHaveLength(3)
    await user.click(screen.queryAllByRole('button', {name: 'note-taking'})[0])
    fireEvent.click(screen.getByTestId('onSaveNote'))

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/workshop-services?op=NOTE", 
        {"body": "{\"id\":10001,\"vehicleNo\":\"J 23\",\"notes\":\"Hello World\"}", 
            "headers": {"Content-type": "application/json"}, "method": "POST"}))

    expect(setLoading).nthCalledWith(1, true)
    expect(setLoading).nthCalledWith(2, false)

    expect(screen.queryAllByRole('button', {name: 'photo-taking'})).toHaveLength(3)
    await user.click(screen.queryAllByRole('button', {name: 'photo-taking'})[0])
    fireEvent.click(screen.getByTestId('onSaveMedia'))

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/workshop-services/10001/medias", 
        {"body": expect.any(FormData), "method": "POST"}))

    const formData = global.fetch.mock.calls[1][1].body
    expect(formData.get("file").name).toEqual('test.txt')

    expect(setLoading).nthCalledWith(3, true)
    expect(setLoading).nthCalledWith(4, false)

    unmount()
})

test('view the completed service, notes and medias', async () => {
    const user = userEvent.setup()

    URL.createObjectURL = jest.fn(() => 'http://image.data.url')

    global.fetch.mockResolvedValueOnce({
        ok: true,  // GET /api/workshop-services/:serviceId/medias
        json: () => Promise.resolve([{id: 3000, fileName: 'img_001.png'}, {id: 3001, fileName: 'img_002.jpg'}])
    }).mockResolvedValueOnce({
        ok: true, // GET /api/workshop-services/:serviceId/medias/3000/data
        blob: () => Promise.resolve("")
    }).mockResolvedValueOnce({
        ok: true, // GET /api/workshop-services/:serviceId/medias/3001/data
        blob: () => Promise.resolve("")
    })

    window.matchMedia = jest.fn(() => {return {
        refCount: 0,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        matches: false,           // Added for completeness, can be adjusted
        media: '(min-width: 768px)', // Default media query, can be adjusted
        onchange: null            // Added for completeness
    }})

    const setTotalFilteredServices = jest.fn()
    const setLoading = jest.fn()
    const initialServices = newTransactions()
    initialServices[0] = {...initialServices[0], notes: 'hello 2022-02-15', completionDate: '2022-02-15', uploadedMediasCount: 1}
    initialServices[1] = {...initialServices[1], notes: 'hello 2022-01-15', completionDate: '2022-01-15', uploadedMediasCount: 2}
    initialServices[2] = {...initialServices[2], notes: 'hello 2022-01-14', completionDate: '2022-01-14', uploadedMediasCount: 1}

    const { container, unmount } = render(<WorkshopServicesProvider initialServices={initialServices}>
        <SupplierOrderContext value={new SupplierOrders([...orders], jest.fn())}>
            <ServiceListing selectedSearchOptions={[]} 
                setTotalFilteredServices={setTotalFilteredServices}
                suppliers={[...suppliers]}
                setLoading={setLoading} />
        </SupplierOrderContext>
    </WorkshopServicesProvider>)

    expect(container.querySelectorAll('.list-group-item')).toHaveLength(3)
    expect(screen.getAllByLabelText('show note')).toHaveLength(3)
    expect(screen.getAllByLabelText('show medias')).toHaveLength(3)

    await user.click(screen.getAllByLabelText('show note')[0])
    expect(screen.queryAllByText('hello 2022-02-15')).toHaveLength(1)

    await user.click(screen.getAllByLabelText('show medias')[1])
    await waitFor(() => expect(global.fetch).nthCalledWith(1, "http://localhost:8080/api/workshop-services/10002/medias"))
    await waitFor(() => expect(global.fetch).nthCalledWith(2, "http://localhost:8080/api/workshop-services/10002/medias/3000/data"))
    await waitFor(() => expect(global.fetch).nthCalledWith(3, "http://localhost:8080/api/workshop-services/10002/medias/3001/data"))

    const removeChild = jest.spyOn(document.body, 'removeChild')
    await user.click(screen.getByLabelText('download media img_001.png'))
    expect(removeChild.mock.calls[0][0].href).toEqual('http://image.data.url/')
    expect(removeChild.mock.calls[0][0].download).toEqual('img_001.png')

    unmount()
})

test('view the completed service, and load individual', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true, // GET /api/workshop-services/10002
        json: () => Promise.resolve({
            id: 10002, creationDate: '2022-01-11', startDate: '2022-01-10', 
            vehicleId: 20002, vehicleNo: "J 33", mileageKm: 20000, completionDate: '2022-01-15',
            sparePartUsages: [
                {id: 990002, orderId: 1000, quantity: 30, usageDate: '2022-01-11', soldPrice: 11, margin: 20}
            ],
            migratedHandWrittenSpareParts: [
                {index: 9800001, totalPrice: 289.50, creationDate: '2022-01-09', itemDescription: 'Brake adjuster from L', quantity: 1, unitPrice: 289.50, unit: 'pc'}
            ],
            tasks: [
                {id: 9700001, recordedDate: '2022-01-09', quotedPrice: 250, taskId: 8700001, remarks: 'To adjust brake'}
            ]
        })
    })

    window.matchMedia = jest.fn(() => {return {
        refCount: 0,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        matches: false,           // Added for completeness, can be adjusted
        media: '(min-width: 768px)', // Default media query, can be adjusted
        onchange: null            // Added for completeness
    }})

    const setTotalFilteredServices = jest.fn()
    const setLoading = jest.fn()
    const initialServices = newTransactions()
    initialServices[0] = {...initialServices[0], sparePartsCount: 0, workmanshipTasksCount: 0, }
    initialServices[1] = {...initialServices[1], sparePartUsages: undefined, completionDate: '2022-01-15'}
    initialServices[2] = {...initialServices[2], sparePartUsages: undefined, completionDate: '2022-01-14'}

    render(<WorkshopServicesProvider initialServices={initialServices}>
        <SupplierOrderContext value={new SupplierOrders([...orders], jest.fn())}>
            <ServiceListing selectedSearchOptions={[]} 
                setTotalFilteredServices={setTotalFilteredServices}
                suppliers={[...suppliers]}
                taskTemplates={[
                    {id: 8700001, workmanshipTask: 'adjust brake', component: {subsystem: 'Braking', component: 'Parking Brake'}}
                ]}
                setLoading={setLoading} />
        </SupplierOrderContext>
    </WorkshopServicesProvider>)

    expect(screen.queryAllByLabelText('load individual service')).toHaveLength(2)
    expect(screen.queryByText('Refer to the notes (if there is something)')).toBeInTheDocument()

    await user.click(screen.queryAllByLabelText('load individual service')[0])
    await waitFor(() => expect(global.fetch).toBeCalledWith('http://localhost:8080/api/workshop-services/10002'))

    expect(screen.queryByText('To adjust brake')).toBeInTheDocument()

    // just add an item for non completed one
    await user.click(screen.getByText('Add Item'))
    expect(screen.queryByText('Service started at 2022-02-02')).toBeInTheDocument()
})