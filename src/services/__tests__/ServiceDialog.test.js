import { jest, test, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import ServiceDialog from '../ServiceDialog'
import { SupplierOrderContext } from '../../suppliers/SupplierOrderContextProvider'
import SupplierOrders from '../../suppliers/SupplierOrders'
import userEvent from '@testing-library/user-event'

test('add 2 spare parts', async () => {
    const user = userEvent.setup()

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
    const keyInStartDate = `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, 0)}-${(todayDate.getDate()-1).toString().padStart(2, 0)}`

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
    let sparePart = screen.getByPlaceholderText("Find a spare part...")
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

    // save it
    await user.click(screen.getByText("Save"))
    expect(saveService).toBeCalledWith({"id": undefined, "mileageKm": "135392", 
        "notes": undefined, 
        "sparePartUsages": [{"margin": 0, "orderId": 1000, "quantity": "20", "soldPrice": 9.7, "usageDate": keyInStartDate, "vehicleNo": "J 33"}, 
            {"margin": 0, "orderId": 2000, "quantity": "1", "soldPrice": 29.5, "usageDate": keyInStartDate, "vehicleNo": "J 33"}], 
        "sparePartsMargin": undefined, 
        "startDate": keyInStartDate, 
        "tasks": [], "transactionTypes": [], 
        "vehicleId": 50002, "vehicleNo": "J 33"})
    expect(setShow).toBeCalledWith(false)
})