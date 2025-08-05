import { jest, test, expect, afterAll } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ServiceDialog from '../ServiceDialog'
import { SupplierOrderContext } from '../../suppliers/SupplierOrderContextProvider'
import SupplierOrders from '../../suppliers/SupplierOrders'
import { addDaysToDateStr } from '../../utils/dateUtils'

global.fetch = jest.fn()

afterAll(() => jest.clearAllMocks())

test('add 2 spare parts', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
    })

    const orders = new SupplierOrders([
        {id: 1000, supplierId: 60001, itemCode: '1000', partName: 'Engine Oil 20w-50', quantity: 100, unit: 'litres', unitPrice: 9.7, status: 'ACTIVE'},
        {id: 2000, supplierId: 60002, itemCode: '2000', partName: 'Oil Filter', quantity: 5, unit: 'pc', unitPrice: 29.5, status: 'ACTIVE'}
    ], jest.fn())

    const saveService = jest.fn()
    const setShow = jest.fn()
    render(<SupplierOrderContext value={orders}>
        <ServiceDialog 
            isShow={true}
            setShow={setShow}
            vehicles={[{id: 50001, vehicleNo: "J 23"}, {id: 50002, vehicleNo: "J 33"}]} 
            suppliers={[{id: 60001, supplierName: "Kotong"}, {id: 60002, supplierName: "Facaw"}]}
            sparePartUsages={[]}
            onNewServiceCreated={saveService}
        />
        </SupplierOrderContext>)

    const todayDate = new Date()
    const keyInStartDate = addDaysToDateStr(todayDate, -1)

    const startDate = document.querySelector('input[name="startDate"]')
    expect(startDate).toBeInTheDocument()
    await user.click(startDate)
    await user.type(startDate, keyInStartDate)

    const vehicle = screen.getByPlaceholderText("Choose a vehicle...")
    expect(vehicle).toBeInTheDocument()
    await user.click(vehicle)
    await user.type(vehicle, "J 33")
    await user.click(screen.getByText('J 33'))

    const mileageKm = document.querySelector('input[name="mileageKm"]')
    expect(mileageKm).toBeInTheDocument()
    await user.click(mileageKm)
    await user.type(mileageKm, "135392")

    // add engine oil
    let sparePart = screen.queryByPlaceholderText("Find a spare part...")
    expect(sparePart).toBeInTheDocument()
    await user.click(sparePart)
    await user.click(screen.getByText('Engine Oil 20w-50'))

    await user.click(screen.getByPlaceholderText('Quantity'))
    // delete the key in 20
    await user.keyboard("[Backspace]20")
    expect(screen.getByText("$ 194.00")).toBeInTheDocument()

    // add more spare part
    await user.click(screen.getByText("Add More"))

    // add oil filter
    sparePart = screen.getAllByPlaceholderText("Find a spare part...")[1]
    await user.click(sparePart)
    await user.click(screen.getByText('Oil Filter'))

    await user.click(screen.getAllByPlaceholderText('Quantity')[1])
    await user.keyboard("[Backspace]1")
    expect(screen.getAllByText("$ 29.50")).toHaveLength(1)

    // change unit price for marking up
    await user.click(screen.getAllByPlaceholderText('Price $')[1])
    await user.keyboard('{Control>}A{/Control}[Backspace]30.50')
    expect(screen.queryAllByText("$ 30.50")).toHaveLength(1)

    // save it
    await user.click(screen.getByText("Save"))
    // console.log(Array.from(document.querySelector('form').elements).map(v => v.name + ' ' + v.validationMessage))
    expect(saveService).toBeCalledWith({"id": undefined, "mileageKm": "135392", 
        "notes": undefined, 
        "sparePartUsages": [{"margin": 0, "orderId": 1000, "quantity": "20", "soldPrice": 9.7, "usageDate": keyInStartDate, "vehicleNo": "J 33"}, 
            {"margin": 0, "orderId": 2000, "quantity": "1", "soldPrice": 30.5, "usageDate": keyInStartDate, "vehicleNo": "J 33"}], 
        "sparePartsMargin": undefined, 
        "startDate": keyInStartDate, 
        "tasks": [], "transactionTypes": [], 
        "vehicleId": 50002, "vehicleNo": "J 33"})
    expect(setShow).toBeCalledWith(false)
})

test('add 3 spare parts, then delete 2nd one', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
    })

    const orders = new SupplierOrders([
        {id: 1000, supplierId: 60001, itemCode: '1000', partName: 'Engine Oil 20w-50', quantity: 100, unit: 'litres', unitPrice: 9.7, status: 'ACTIVE'},
        {id: 1001, supplierId: 60002, itemCode: '2000', partName: 'Oil Filter', quantity: 5, unit: 'pc', unitPrice: 29.5, status: 'ACTIVE'},
        {id: 1002, supplierId: 60002, itemCode: '2000', partName: 'Fuel Filter', quantity: 10, unit: 'pc', unitPrice: 52.3, status: 'ACTIVE'}
    ], jest.fn())

    const saveService = jest.fn()
    const setShow = jest.fn()
    render(<SupplierOrderContext value={orders}>
        <ServiceDialog 
            isShow={true}
            setShow={setShow}
            vehicles={[{id: 50001, vehicleNo: "J 23"}, {id: 50002, vehicleNo: "J 33"}]} 
            suppliers={[{id: 60001, supplierName: "Kotong"}, {id: 60002, supplierName: "Facaw"}]}
            sparePartUsages={[]}
            onNewServiceCreated={saveService}
            trx={{current: {}}}
        />
        </SupplierOrderContext>)

    const todayDate = new Date()
    const keyInStartDate = addDaysToDateStr(todayDate, -1)

    const startDate = document.querySelector('input[name="startDate"]')
    await user.click(startDate)
    await user.type(startDate, keyInStartDate)

    const vehicle = screen.getByPlaceholderText("Choose a vehicle...")
    await user.click(vehicle)
    await user.type(vehicle, "J 33")
    await user.click(screen.getByText('J 33'))

    const mileageKm = document.querySelector('input[name="mileageKm"]')
    await user.click(mileageKm)
    await user.type(mileageKm, "135392")

    // add engine oil
    let sparePart = screen.getByPlaceholderText("Find a spare part...")
    await user.click(sparePart)
    await user.click(screen.getByText('Engine Oil 20w-50'))

    await user.click(screen.getByPlaceholderText('Quantity'))
    // delete then key in 20
    await user.keyboard("[Backspace]20")
    expect(screen.getByText("$ 194.00")).toBeInTheDocument()

    // add more spare part
    await user.click(screen.getByText("Add More"))

    // add oil filter
    sparePart = screen.getAllByPlaceholderText("Find a spare part...")[1]
    await user.click(sparePart)
    await user.click(screen.getByText('Oil Filter'))

    await user.click(screen.getAllByPlaceholderText('Quantity')[1])
    await user.keyboard("[Backspace]1")
    expect(screen.getAllByText("$ 29.50")).toHaveLength(1)

    // add more spare part
    await user.click(screen.getByText("Add More"))

    // fuel filter
    sparePart = screen.getAllByPlaceholderText("Find a spare part...")[2]
    await user.click(sparePart)
    await user.click(screen.getByText('Fuel Filter'))

    await user.click(screen.getAllByPlaceholderText('Quantity')[2])
    await user.keyboard("[Backspace]2")
    expect(screen.getAllByText("$ 104.60")).toHaveLength(1)

    // delete the 2nd one
    await user.click(screen.getByRole('button', {name: 'delete spare part 1'}))
    expect(screen.queryAllByText("$ 29.50")).toHaveLength(0)

    // save it
    await user.click(screen.getByText("Save"))
    expect(saveService).toBeCalledWith({"id": undefined, "mileageKm": "135392", 
        "notes": undefined, 
        "sparePartUsages": [{"margin": 0, "orderId": 1000, "quantity": "20", "soldPrice": 9.7, "usageDate": keyInStartDate, "vehicleNo": "J 33"}, 
            {"margin": 0, "orderId": 1002, "quantity": "2", "soldPrice": 52.3, "usageDate": keyInStartDate, "vehicleNo": "J 33"}], 
        "sparePartsMargin": undefined, 
        "startDate": keyInStartDate, 
        "tasks": [], "transactionTypes": [], 
        "vehicleId": 50002, "vehicleNo": "J 33"})
    expect(setShow).toBeCalledWith(false)
})

test('vehicles validity check', async () => {
    const user = userEvent.setup()

    const orders = new SupplierOrders([
        {id: 1000, supplierId: 60001, itemCode: '1000', partName: 'Engine Oil 20w-50', quantity: 100, unit: 'litres', unitPrice: 9.7, status: 'ACTIVE'},
        {id: 2000, supplierId: 60002, itemCode: '2000', partName: 'Oil Filter', quantity: 5, unit: 'pc', unitPrice: 29.5, status: 'ACTIVE'}
    ], jest.fn())

    const saveService = jest.fn()
    const setShow = jest.fn()
    const onNewVehicleCreated = jest.fn((vehNo) => Promise.resolve({id: 50003, vehicleNo: vehNo}))
    render(<SupplierOrderContext value={orders}>
        <ServiceDialog 
            isShow={true}
            setShow={setShow}
            vehicles={[{id: 50001, vehicleNo: "J 23"}, {id: 50002, vehicleNo: "J 33"}]} 
            suppliers={[{id: 60001, supplierName: "Kotong"}, {id: 60002, supplierName: "Facaw"}]}
            sparePartUsages={[]}
            onNewVehicleCreated={onNewVehicleCreated}
            onNewServiceCreated={saveService}
            trx={{current: {}}}
        />
        </SupplierOrderContext>)

    const vehicle = screen.getByPlaceholderText("Choose a vehicle...")
    expect(vehicle).toBeInTheDocument()
    await user.click(vehicle)
    await user.type(vehicle, "J 34")
    await user.click(screen.getByText("Create & add a new vehicle:"))

    // should have J 34
    await waitFor(() => expect(screen.getByPlaceholderText("Choose a vehicle...")).toHaveValue("J 34"))

    // key in another, but dont choose to create a new one
    await user.click(vehicle)
    await user.type(vehicle, "J 35")
    await user.click(screen.getByText("Save"))

    expect(vehicle.validationMessage).toBe('not a valid vehicle, either choose one and create one first')
})

test('add for existing service, to update mileage only', async () => {
    const user = userEvent.setup()

    const todayDate = new Date()
    const keyInStartDate = addDaysToDateStr(todayDate, -1)
    const prevStartDate = addDaysToDateStr(todayDate, -2)

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            {id: 10001, vehicleNo: "J 33", startDate: prevStartDate, mileageKm: 135392}
        ])
    })

    const orders = new SupplierOrders([
        {id: 1000, supplierId: 60001, itemCode: '1000', partName: 'Engine Oil 20w-50', quantity: 100, unit: 'litres', unitPrice: 9.7, status: 'ACTIVE'},
        {id: 2000, supplierId: 60002, itemCode: '2000', partName: 'Oil Filter', quantity: 5, unit: 'pc', unitPrice: 29.5, status: 'ACTIVE'}
    ], jest.fn())

    const saveService = jest.fn()
    const setShow = jest.fn()
    render(<SupplierOrderContext value={orders}>
        <ServiceDialog 
            isShow={true}
            setShow={setShow}
            vehicles={[{id: 50001, vehicleNo: "J 23"}, {id: 50002, vehicleNo: "J 33"}]} 
            suppliers={[{id: 60001, supplierName: "Kotong"}, {id: 60002, supplierName: "Facaw"}]}
            sparePartUsages={[]}
            onNewServiceCreated={saveService}
            trx={{current: {}}}
        />
        </SupplierOrderContext>)

    const startDate = document.querySelector('input[name="startDate"]')
    await user.click(startDate)
    await user.type(startDate, keyInStartDate)

    // before choose a vehicle with exiting service
    expect(screen.queryAllByText('Service started at ' + keyInStartDate)).toHaveLength(1)

    const vehicle = screen.getByPlaceholderText("Choose a vehicle...")
    expect(vehicle).toBeInTheDocument()
    await user.click(vehicle)
    await user.type(vehicle, "J 33")
    await user.click(screen.getByText('J 33'))

    // after choose, start date reflect at the dialog header
    expect(screen.queryAllByText('Service started at ' + prevStartDate)).toHaveLength(1)

    const mileageKm = document.querySelector('input[name="mileageKm"]')
    expect(mileageKm).toBeInTheDocument()
    await user.click(mileageKm)
    await user.keyboard('{Control>}A{/Control}[Backspace]137392')

    // delete the part
    await user.click(screen.getByRole('button', {name: 'delete spare part 0'}))  

    // save it
    await user.click(screen.getByText("Save"))
    expect(saveService).toBeCalledWith({"id": 10001, "mileageKm": "137392", "notes": undefined, 
        "sparePartUsages": [], "sparePartsMargin": undefined, "startDate": prevStartDate, "tasks": [], 
        "transactionTypes": [], "vehicleId": 50002, "vehicleNo": "J 33"})
    expect(setShow).toBeCalledWith(false)
})

test('add for existing service, navigate around', async () => {
    const user = userEvent.setup()

    const todayDate = new Date()
    const keyInStartDate = addDaysToDateStr(todayDate, -1)
    const prevStartDate = addDaysToDateStr(todayDate, -2)

    const orders = new SupplierOrders([
        {id: 1000, supplierId: 60001, itemCode: '1000', partName: 'Engine Oil 20w-50', quantity: 100, unit: 'litres', unitPrice: 9.7, status: 'ACTIVE'},
        {id: 2000, supplierId: 60002, itemCode: '2000', partName: 'Oil Filter', quantity: 5, unit: 'pc', unitPrice: 29.5, status: 'ACTIVE'}
    ], jest.fn())

    const saveService = jest.fn()
    const setShow = jest.fn()
    render(<SupplierOrderContext value={orders}>
        <ServiceDialog 
            isShow={true}
            setShow={setShow}
            vehicles={[{id: 50001, vehicleNo: "J 23"}, {id: 50002, vehicleNo: "J 33"}]} 
            suppliers={[{id: 60001, supplierName: "Kotong"}, {id: 60002, supplierName: "Facaw"}]}
            sparePartUsages={[]}
            onNewServiceCreated={saveService}
            trx={{current: {id: 100001, vehicleNo: "J 23", startDate: prevStartDate}}}
        />
        </SupplierOrderContext>)

    const startDate = document.querySelector('input[name="startDate"]')
    await user.click(startDate)
    await user.type(startDate, keyInStartDate)

    const vehicle = screen.getByPlaceholderText("Choose a vehicle...")
    expect(vehicle).toBeInTheDocument()
    expect(vehicle).toHaveValue("J 23")

    // navigate to workmanship tab
    await user.click(screen.getByText('Workmanship'))

    // add new item for task
    await user.click(screen.getByText('Add New'))
    expect(screen.queryAllByPlaceholderText('Find a suitable task')).toHaveLength(1)
    await user.click(screen.getByLabelText('remove task 0'))
    expect(screen.queryAllByPlaceholderText('Find a suitable task')).toHaveLength(0)

    // navigate back to spare parts
    await user.click(screen.getByText('Spare Parts'))
    expect(screen.queryAllByPlaceholderText('Find a spare part...')).toHaveLength(1)
    await user.click(screen.getByLabelText('delete spare part 0'))
    expect(screen.queryAllByPlaceholderText('Find a spare part...')).toHaveLength(0)

    // click all repair, service and inspection
    await user.click(screen.getByLabelText('service type: repair'))
    await user.click(screen.getByLabelText('service type: service'))
    await user.click(screen.getByLabelText('service type: inspection'))
    await user.click(screen.getByLabelText('service type: tyre'))

    // save it
    await user.click(screen.getByText("Save"))
    expect(saveService).toBeCalledWith({"id": 100001, "mileageKm": "", 
        "notes": undefined, "sparePartUsages": [], "sparePartsMargin": undefined, "startDate": prevStartDate, 
        "tasks": [], "transactionTypes": ['REPAIR', 'SERVICE', 'INSPECTION', 'TYRE'], "vehicleId": 50001, "vehicleNo": "J 23"})
})

test('choose a part, navigate to workmanship, back to part, part name retained', async () => {
    const user = userEvent.setup()

    const todayDate = new Date()
    const keyInStartDate = addDaysToDateStr(todayDate, -1)
    const prevStartDate = addDaysToDateStr(todayDate, -2)

    const orders = new SupplierOrders([
        {id: 1000, supplierId: 60001, itemCode: '1000', partName: 'Engine Oil 20w-50', quantity: 100, unit: 'litres', unitPrice: 9.7, status: 'ACTIVE'},
        {id: 2000, supplierId: 60002, itemCode: '2000', partName: 'Oil Filter', quantity: 5, unit: 'pc', unitPrice: 29.5, status: 'ACTIVE'}
    ], jest.fn())

    const saveService = jest.fn()
    const setShow = jest.fn()
    render(<SupplierOrderContext value={orders}>
        <ServiceDialog 
            isShow={true}
            setShow={setShow}
            vehicles={[{id: 50001, vehicleNo: "J 23"}, {id: 50002, vehicleNo: "J 33"}]} 
            suppliers={[{id: 60001, supplierName: "Kotong"}, {id: 60002, supplierName: "Facaw"}]}
            sparePartUsages={[]}
            onNewServiceCreated={saveService}
            trx={{current: {id: 100001, vehicleNo: "J 23", startDate: prevStartDate}}}
        />
        </SupplierOrderContext>)

    const startDate = document.querySelector('input[name="startDate"]')
    await user.click(startDate)
    await user.type(startDate, keyInStartDate)

    const vehicle = screen.getByPlaceholderText("Choose a vehicle...")
    expect(vehicle).toBeInTheDocument()
    expect(vehicle).toHaveValue("J 23")

    // add engine oil
    let sparePart = screen.getByPlaceholderText("Find a spare part...")
    await user.click(sparePart)
    await user.click(screen.getByText('Engine Oil 20w-50'))

    await user.click(screen.getByPlaceholderText('Quantity'))
    // delete the key in 20
    await user.keyboard("[Backspace]20")
    expect(screen.getByText("$ 194.00")).toBeInTheDocument()

    // to confirm is ok
    expect(screen.getByPlaceholderText("Find a spare part...")).toHaveValue('Engine Oil 20w-50')

    // navigate to 'Workmanship'
    await user.click(screen.getByRole('button', {name: 'Workmanship'}))
    // back to 'Spare Parts'
    await user.click(screen.getByRole('button', {name: 'Spare Parts'}))
    expect(screen.getByPlaceholderText("Find a spare part...")).toHaveValue('Engine Oil 20w-50')

    // save it
    await user.click(screen.getByText("Save"))
    expect(saveService).toBeCalledWith({"id": 100001, "mileageKm": "", "notes": undefined, 
        "sparePartUsages": [{"margin": 0, "orderId": 1000, "quantity": "20", "soldPrice": 9.7, 
            "usageDate": keyInStartDate, "vehicleNo": "J 23"}], 
            "sparePartsMargin": undefined, "startDate": prevStartDate, 
            "tasks": [], "transactionTypes": [], "vehicleId": 50001, "vehicleNo": "J 23"})
    expect(setShow).toBeCalledWith(false)
})