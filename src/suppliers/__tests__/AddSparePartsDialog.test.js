import { jest, test, expect } from '@jest/globals'
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddSparePartsDialog from '../AddSparePartsDialog';
import SupplierOrders from '../SupplierOrders';
import { SupplierOrderContext } from '../SupplierOrderContextProvider';
import { addDaysToDateStr } from '../../utils/dateUtils';
import clearAllThen from '../../__mocks__/userEventUtil';

/** @type {import('../SupplierOrders').Supplier} */
const suppliers = [ 
    {id: 2000, supplierName: 'Aik Han'}, 
    {id: 2001, supplierName: 'Mutiara Bintang'},
    {id: 2002, supplierName: 'TSD'} 
]

/** @type {import('../SupplierOrders').SupplierOrder[]} */
const mockOrders = [
  {id:1001, invoiceDate: "2023-01-01", supplierId: 2000,
    itemCode: "00016", partName:"Engine Oil", quantity: 600, unit: "ltr", unitPrice: 9,
    deliveryOrderNo: "DO001", status: "ACTIVE"},
  {id:1002, invoiceDate: "2023-01-02", supplierId: 2001,
    itemCode: "06690", partName:"Air Filter", quantity: 5, unit: "pcs", unitPrice: 80,
    deliveryOrderNo: "DO002", status: "ACTIVE"},
  {id:1003, invoiceDate: "2023-01-03", supplierId: 2000, sheetName: 'JUL 23',
    itemCode :"07411", partName:"Brake Pads", quantity: 100, unit:"set", unitPrice: 25,
    deliveryOrderNo: "DO003", status: "ACTIVE"},
  {id:1004, invoiceDate: "2023-01-03", supplierId: 2001, sheetName: 'JUL 23',
    itemCode: "26283", partName: "Hub Bolt", quantity: 40, unit: "pc", unitPrice: 8,
    deliveryOrderNo: "DO003", status: "ACTIVE"}
];

const todayDateStr = addDaysToDateStr(new Date(), 0)

test('show dialog to add new parts, and close it', async () => {
    const user = userEvent.setup()

    const setShowDialog = jest.fn()
    const onSaveNewOrders = jest.fn()

    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}>
        <AddSparePartsDialog isShow={true} setShowDialog={setShowDialog} 
            onSaveNewOrders={onSaveNewOrders} sparePartUsages={[]} suppliers={suppliers}></AddSparePartsDialog>
        </SupplierOrderContext>)

    expect(screen.queryByText('Adding New Spare Parts')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Key in item code')).toBeInTheDocument()
    expect(screen.queryByLabelText('Clone orders')).not.toBeInTheDocument()

    // just delete the only item
    await user.click(document.querySelector('.bi-trash3'))
    await user.click(document.querySelector('.bi-trash3'))
    expect(screen.queryByPlaceholderText('Key in item code')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Save orders')).toBeDisabled()

    // add new and save to throw error
    await user.click(screen.getByLabelText('Add new order'))
    await user.click(screen.getByLabelText('Save orders'))

    // close it
    await user.keyboard('{Escape}')
    expect(setShowDialog).not.toBeCalled()
    await user.click(screen.getByLabelText('Close'))
    expect(setShowDialog).toBeCalledWith(false)
})

test('create a single item order, choose ordered before parts', async () => {
    const user = userEvent.setup()

    const setShowDialog = jest.fn()
    const onSaveNewOrders = jest.fn()

    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}>
        <AddSparePartsDialog isShow={true} setShowDialog={setShowDialog} 
            onSaveNewOrders={onSaveNewOrders} sparePartUsages={[]} suppliers={suppliers}></AddSparePartsDialog>
        </SupplierOrderContext>)

    await user.click(screen.getByPlaceholderText('Key in Invoice Date'))
    await user.keyboard(todayDateStr)

    await user.click(screen.getByPlaceholderText('Choose a supplier'))
    await user.click(screen.getByText('Mutiara Bintang'))

    await user.click(screen.getByPlaceholderText('Key in DO. #'))
    await user.keyboard("DO-00002")

    // start to add items
    await user.click(screen.getByPlaceholderText('Key in item code'))
    await user.click(screen.getByText('06690'))

    expect(screen.getByPlaceholderText('Find a existing one as template')).toHaveValue('Air Filter')
    // remove item code
    await user.click(screen.getAllByLabelText('Clear')[1])
    // manually key the item code
    await user.click(screen.getByPlaceholderText('Key in item code'))
    await user.keyboard('06690A')

    // key in quantity
    await user.click(screen.getByPlaceholderText('Quantity'))
    await user.keyboard('10')

    // key in unit, although already have the value
    expect(screen.getByPlaceholderText('Unit')).toHaveValue('pcs')
    await user.click(screen.getByPlaceholderText('Unit'))
    await user.keyboard(clearAllThen('pc'))

    // Unit price, although already have the value
    expect(screen.getByPlaceholderText('Price $')).toHaveValue(80)
    await user.click(screen.getByPlaceholderText('Price $'))
    await user.keyboard(clearAllThen('82'))

    // save it
    await user.click(screen.getByLabelText('Save orders'))
    expect(onSaveNewOrders).toBeCalledWith([{"deliveryOrderNo": "DO-00002", "id": undefined, "invoiceDate": todayDateStr, 
        "itemCode": "06690A", "notes": undefined, 
        "partName": "Air Filter", "quantity": 10, "sparePartId": undefined, 
        "supplierId": 2001, "totalPrice": 820, "unit": "pc", "unitPrice": 82}], expect.anything())
    
    onSaveNewOrders.mock.calls[0][1]()
    expect(setShowDialog).toBeCalledWith(false)
})

test('create a single item order, newly order parts', async () => {
    const user = userEvent.setup()

    const setShowDialog = jest.fn()
    const onSaveNewOrders = jest.fn()

    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}>
        <AddSparePartsDialog isShow={true} setShowDialog={setShowDialog} 
            onSaveNewOrders={onSaveNewOrders} sparePartUsages={[]} suppliers={suppliers}></AddSparePartsDialog>
        </SupplierOrderContext>)

    await user.click(screen.getByPlaceholderText('Key in Invoice Date'))
    await user.keyboard(todayDateStr)

    await user.click(screen.getByPlaceholderText('Choose a supplier'))
    await user.click(screen.getByText('Mutiara Bintang'))

    await user.click(screen.getByPlaceholderText('Key in DO. #'))
    await user.keyboard("DO-00002")

    // start to add items
    await user.click(screen.getByPlaceholderText('Key in item code'))
    await user.keyboard('06690A')

    await user.click(screen.getByPlaceholderText('Find a existing one as template'))
    await user.keyboard('Air Filter 6642')

    await user.click(screen.getByPlaceholderText('Quantity'))
    await user.keyboard('5')

    await user.click(screen.getByPlaceholderText('Unit'))
    await user.keyboard(clearAllThen('set'))

    await user.click(screen.getByPlaceholderText('Price $'))
    await user.keyboard('105')

    // save it
    await user.click(screen.getByLabelText('Save orders'))
    expect(onSaveNewOrders).toBeCalledWith([{"deliveryOrderNo": "DO-00002", "id": undefined, "invoiceDate": todayDateStr, 
        "itemCode": "06690A", "notes": undefined, 
        "partName": "Air Filter 6642", "quantity": 5, "sparePartId": undefined, 
        "supplierId": 2001, "totalPrice": 525, "unit": "set", "unitPrice": 105}], expect.anything())
})

test('create a 2 items order, same supplier', async() => {
    const user = userEvent.setup()

    const setShowDialog = jest.fn()
    const onSaveNewOrders = jest.fn()

    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}>
        <AddSparePartsDialog isShow={true} setShowDialog={setShowDialog} 
            onSaveNewOrders={onSaveNewOrders} sparePartUsages={[]} suppliers={suppliers}></AddSparePartsDialog>
        </SupplierOrderContext>)

    await user.click(screen.getByPlaceholderText('Key in Invoice Date'))
    await user.keyboard(todayDateStr)

    await user.click(screen.getByPlaceholderText('Choose a supplier'))
    await user.click(screen.getByText('Aik Han'))

    await user.click(screen.getByPlaceholderText('Key in DO. #'))
    await user.keyboard("DO-00003")

    // start to add items
    await user.click(screen.getByPlaceholderText('Key in item code'))
    await user.keyboard('06690A')

    await user.click(screen.getByPlaceholderText('Find a existing one as template'))
    await user.keyboard('Air Filter 6642')

    await user.click(screen.getByPlaceholderText('Quantity'))
    await user.keyboard('5')

    await user.click(screen.getByPlaceholderText('Unit'))
    await user.keyboard(clearAllThen('set'))

    await user.click(screen.getByPlaceholderText('Price $'))
    await user.keyboard('105')

    // add item #2
    await user.click(screen.getByLabelText('Add new order'))

    await user.click(screen.getAllByPlaceholderText('Key in item code')[1])
    await user.keyboard('00016-X') // it will get changed later on to 00016

    await user.click(screen.getAllByPlaceholderText('Find a existing one as template')[1])
    await user.click(screen.getByText('Engine Oil'))

    await user.click(screen.getAllByPlaceholderText('Quantity')[1])
    await user.keyboard('400')

    await user.click(screen.getAllByPlaceholderText('Price $')[1])
    await user.keyboard(clearAllThen(9.7))

    // save it
    await user.click(screen.getByLabelText('Save orders'))
    expect(onSaveNewOrders).toBeCalledWith([
        {"deliveryOrderNo": "DO-00003", "id": undefined, 
            "invoiceDate": todayDateStr, "itemCode": "06690A", "notes": undefined, 
            "partName": "Air Filter 6642", "quantity": 5, "sparePartId": undefined, 
            "supplierId": 2000, "totalPrice": 525, "unit": "set", "unitPrice": 105}, 
        {"deliveryOrderNo": "DO-00003", "id": undefined, 
            "invoiceDate": todayDateStr, "itemCode": "00016", "notes": undefined, 
            "partName": "Engine Oil", "quantity": 400, "sparePartId": undefined, 
            "supplierId": 2000, "totalPrice": 3879.9999999999995, "unit": "ltr", "unitPrice": 9.7}
        ], expect.anything())

    onSaveNewOrders.mock.calls[0][1]()
    expect(setShowDialog).toBeCalledWith(false)
})

test('create a 2 items order, from different suppliers, then choose a new supplier', async() => {
    const user = userEvent.setup()

    const setShowDialog = jest.fn()
    const onSaveNewOrders = jest.fn()

    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}>
        <AddSparePartsDialog isShow={true} setShowDialog={setShowDialog} 
            onSaveNewOrders={onSaveNewOrders} sparePartUsages={[]} suppliers={suppliers}></AddSparePartsDialog>
        </SupplierOrderContext>)

    // let the parts below to choose the supplier

    await user.click(screen.getByPlaceholderText('Key in Invoice Date'))
    await user.keyboard(todayDateStr)

    await user.click(screen.getByPlaceholderText('Key in DO. #'))
    await user.keyboard("DO-00003")

    // start to add items
    await user.click(screen.getByPlaceholderText('Key in item code'))
    await user.click(screen.getByText('07411'))

    expect(screen.getByPlaceholderText('Find a existing one as template')).toHaveValue('Brake Pads')
    await user.click(screen.getAllByLabelText('Clear')[2])
    await user.click(screen.getByPlaceholderText('Find a existing one as template'))
    await user.keyboard('Brake Pads Yz')

    await user.click(screen.getByPlaceholderText('Quantity'))
    await user.keyboard('8')

    await user.click(screen.getByPlaceholderText('Unit'))
    await user.keyboard(clearAllThen('pc'))

    await user.click(screen.getByPlaceholderText('Price $'))
    await user.keyboard(clearAllThen(250))

    // add item #2
    await user.click(screen.getByLabelText('Add new order'))

    await user.click(screen.getAllByPlaceholderText('Key in item code')[1])
    await user.keyboard('06690')

    await user.click(screen.getAllByPlaceholderText('Find a existing one as template')[1])
    await user.keyboard('Engine Oil')

    await user.click(screen.getAllByPlaceholderText('Quantity')[1])
    await user.keyboard('200')

    await user.click(screen.getAllByPlaceholderText('Price $')[1])
    await user.keyboard(clearAllThen('9.7'))

    // finally select a different supplier
    await user.click(screen.getAllByLabelText('Clear')[0])
    await user.click(screen.getByPlaceholderText('Choose a supplier'))
    await user.click(screen.getByText('TSD'))

    // save it
    await user.click(screen.getByLabelText('Save orders'))
    expect(onSaveNewOrders).toBeCalledWith([
        {"deliveryOrderNo": "DO-00003", "id": undefined, "invoiceDate": todayDateStr,
            "itemCode": "07411", "notes": undefined, "partName": "Brake Pads Yz", 
            "quantity": 8, "sparePartId": undefined, "supplierId": 2002, 
            "totalPrice": 2000, "unit": "pc", "unitPrice": 250}, 
        {"deliveryOrderNo": "DO-00003", "id": undefined, "invoiceDate": todayDateStr, 
            "itemCode": "06690", "notes": undefined, "partName": "Engine Oil", 
            "quantity": 200, "sparePartId": undefined, "supplierId": 2002, 
            "totalPrice": 1939.9999999999998, "unit": "pc", "unitPrice": 9.7}], expect.anything())

    onSaveNewOrders.mock.calls[0][1]()
    expect(setShowDialog).toBeCalledWith(false)
})

test('create a 2 items orders, delete 1st, then 2nd one should be the only one', async() => {
    const user = userEvent.setup()

    const setShowDialog = jest.fn()
    const onSaveNewOrders = jest.fn()

    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}>
        <AddSparePartsDialog isShow={true} setShowDialog={setShowDialog} 
            onSaveNewOrders={onSaveNewOrders} sparePartUsages={[]} suppliers={suppliers}></AddSparePartsDialog>
        </SupplierOrderContext>)

    await user.click(screen.getByPlaceholderText('Key in Invoice Date'))
    await user.keyboard(todayDateStr)

    await user.click(screen.getByPlaceholderText('Choose a supplier'))
    await user.click(screen.getByText('Aik Han'))

    await user.click(screen.getByPlaceholderText('Key in DO. #'))
    await user.keyboard("DO-00003")

    // start to add items
    await user.click(screen.getByPlaceholderText('Key in item code'))
    await user.keyboard('06690A')

    await user.click(screen.getByPlaceholderText('Find a existing one as template'))
    await user.keyboard('Air Filter 6642')

    await user.click(screen.getByPlaceholderText('Quantity'))
    await user.keyboard('5')

    await user.click(screen.getByPlaceholderText('Unit'))
    await user.keyboard(clearAllThen('set'))

    await user.click(screen.getByPlaceholderText('Price $'))
    await user.keyboard('105')

    // add item #2
    await user.click(screen.getByLabelText('Add new order'))

    await user.click(screen.getAllByPlaceholderText('Key in item code')[1])
    await user.keyboard('00016-X') // it will get changed later on to 00016

    await user.click(screen.getAllByPlaceholderText('Find a existing one as template')[1])
    await user.click(screen.getByText('Engine Oil'))

    await user.click(screen.getAllByPlaceholderText('Quantity')[1])
    await user.keyboard('400')

    await user.click(screen.getAllByPlaceholderText('Price $')[1])
    await user.keyboard(clearAllThen(9.7))

    // delete the first one
    await user.click(document.querySelectorAll('.bi-trash3')[0])
    await user.click(document.querySelectorAll('.bi-trash3')[0])

    expect(screen.getByPlaceholderText('Key in item code')).toHaveValue('00016')
})

test('edit existing order, not allow to add and change value', async() => {
    const user = userEvent.setup()

    const setShowDialog = jest.fn()
    const onSaveNewOrders = jest.fn()

    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}>
        <AddSparePartsDialog isShow={true} setShowDialog={setShowDialog} 
            existingOrder={[
        {"deliveryOrderNo": "DO-00003", "id": 20001, "invoiceDate": todayDateStr, 
            "itemCode": "07411", "notes": "hello world", "partName": "Brake Pads Yz", 
            "quantity": 8, "sparePartId": 900001, "supplierId": 2002, 
            "totalPrice": 2000, "unit": "pc", "unitPrice": 250}, 
        {"deliveryOrderNo": "DO-00003", "id": 20002, "invoiceDate": todayDateStr, 
            "itemCode": undefined, "notes": "hi", "partName": "Engine Oil", 
            "quantity": 200, "sparePartId": undefined, "supplierId": 2002, 
            "totalPrice": 1939.9999999999998, "unit": "pc", "unitPrice": 9.7}]}
            onSaveNewOrders={onSaveNewOrders} sparePartUsages={[
                {id: 990001, orderId: 20001 , quantity: 5}
            ]} suppliers={suppliers}></AddSparePartsDialog>
        </SupplierOrderContext>)

    expect(screen.queryByText('Update Spare Parts')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Key in DO. #')).toBeDisabled()
    expect(screen.getAllByPlaceholderText('Key in item code')[0]).toBeDisabled()
    expect(screen.getAllByPlaceholderText('Key in item code')[1]).toBeEnabled()

    // clone the orders
    await user.click(screen.getByLabelText('Clone orders'))
    await waitFor(() => expect(screen.queryByText('Adding New Spare Parts')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText('Key in Invoice Date'), todayDateStr)
    // await user.keyboard(todayDateStr) // weird, this is not working

    await user.click(screen.getByPlaceholderText('Key in DO. #'))
    await user.keyboard(clearAllThen('DO-00004'))

    await user.click(screen.getByLabelText('Save orders'))
    // console.log(Array.from(document.querySelector('form').elements).map(v => v.name + ' ' + v.validationMessage))
    expect(onSaveNewOrders).toBeCalledWith([
        {"deliveryOrderNo": "DO-00004", "id": undefined, "invoiceDate": todayDateStr, 
            "itemCode": "07411", "notes": 'hello world', "partName": "Brake Pads Yz", 
            "quantity": 8, "sparePartId": 900001, "supplierId": 2002, 
            "totalPrice": 2000, "unit": "pc", "unitPrice": 250}, 
        {"deliveryOrderNo": "DO-00004", "id": undefined, "invoiceDate": todayDateStr, 
            "itemCode": undefined, "notes": 'hi', "partName": "Engine Oil", 
            "quantity": 200, "sparePartId": undefined, "supplierId": 2002, 
            "totalPrice": 1939.9999999999998, "unit": "pc", "unitPrice": 9.7}], expect.anything())

    onSaveNewOrders.mock.calls[0][1]()
    expect(setShowDialog).toBeCalledWith(false)
})