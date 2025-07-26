import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, jest, afterAll } from '@jest/globals'
import { ServiceContext } from '../ServiceContextProvider';
import ServiceTransactions from '../../ServiceTransactions';
import InProgressTaskFocusListing from '../InProgressTaskFocusListing';
import { SupplierOrderContext } from '../../suppliers/SupplierOrderContextProvider';
import SupplierOrders from '../../suppliers/SupplierOrders';

const suppliers = [{id: 60001, supplierName: "Tok Kong"}, {id: 60002, supplierName: "KHD"}]
const vehicles = [{id: 20001, vehicleNo: "J 23", companyId: 50001}, {id: 20002, vehicleNo: "J 33", companyId: 50002}, {id: 20003, vehicleNo: "J 34", companyId: 50001}]
const companies = [{id: 50001, internal: false}, {id: 50002, internal: true}]

const transactions = [
    {id: 10001, startDate: '2022-02-02', vehicleId: 20001, vehicleNo: "J 23", mileageKm: 230000,
        sparePartUsages: [{id: 990001, orderId: 1000, quantity: 20, usageDate: '2022-02-03'},
            {id: 990004, orderId: 2000, quantity: 1, usageDate: '2022-02-03'}
        ],
        tasks: [
            {id: 8800001, recordedDate: '2022-02-03', taskId: 540001, remarks: 'to adjust brake', quotedPrice: 50 }
        ]
    },
    {id: 10002, startDate: '2022-01-10', vehicleId: 20002, vehicleNo: "J 33", mileageKm: 20000,
        sparePartUsages: [{id: 990002, orderId: 1000, quantity: 30, usageDate: '2022-01-11'}],
        tasks: []
    },
    {id: 10003, startDate: '2022-01-01', vehicleId: 20003, vehicleNo: "J 34", mileageKm: 3100,
        sparePartUsages: [{id: 990003, orderId: 2000, quantity: 2, usageDate: '2022-01-03'}],
        tasks: []
    }
]

const newTransactions = () => {
    return [...transactions].map((t, i) => {
        return {...t, sparePartUsages: [...transactions[i].sparePartUsages], tasks: [...transactions[i].tasks]}
    })
}

const orders = [{id: 1000, supplierId: 60001, itemCode: '1000', partName: 'Engine Oil 20w-50', quantity: 100, unit: 'litres', unitPrice: 9.7, status: 'ACTIVE'},
    {id: 2000, supplierId: 60002, itemCode: '2000', partName: 'Oil Filter', quantity: 5, unit: 'pc', unitPrice: 29.5, status: 'ACTIVE'}]

const taskTemplates = [{id: 540001, component: {subsystem: 'brake'}, description: 'adjust brake', complexity: 'LOW', unitPrice: 150}, 
    {id: 540002, component: {subsystem: 'cab'}, description: 'touch up cabin seat', complexity: 'HIGH', unitPrice: 250 }]

afterAll(() => jest.clearAllMocks())

test('show all services with task', async () => {
    const user = userEvent.setup()

    const onNewServiceCreated = jest.fn()
    render(<ServiceContext value={new ServiceTransactions(newTransactions(), jest.fn())}>
        <SupplierOrderContext value={new SupplierOrders(orders, jest.fn())}>
            <InProgressTaskFocusListing 
                suppliers={suppliers} vehicles={vehicles} 
                companies={companies} taskTemplates={taskTemplates}
                onNewServiceCreated={onNewServiceCreated} />
        </SupplierOrderContext>
    </ServiceContext>)

    expect(document.querySelectorAll('.card')).toHaveLength(2)

    // click on the first one.
    await user.click(document.querySelectorAll('.card')[0])

    expect(screen.queryByText('Engine Oil 20w-50')).toBeInTheDocument()
    expect(screen.queryByText('Oil Filter')).toBeInTheDocument()

    // add new task
    await user.click(screen.queryByText('Add New'))
    // click on a suitable task
    await user.click(screen.queryAllByPlaceholderText('Find a suitable task')[0])
    // choose one
    await user.click(screen.getByText('adjust brake $150 (Complexity: low, estimated: H)'))
    // OKAY and save
    await user.click(screen.getByText('OKAY'))

    expect(onNewServiceCreated).toBeCalledWith({"id": 10001, "mileageKm": 230000, 
        "sparePartUsages": [
            {"id": 990001, "margin": 0, 
                "order": {"id": 1000, "itemCode": "1000", "partName": "Engine Oil 20w-50", "quantity": 100, "status": "ACTIVE", "supplierId": 60001, "unit": "litres", "unitPrice": 9.7}, 
                "orderId": 1000, "quantity": 20, "usageDate": "2022-02-03"}, 
            {"id": 990004, "margin": 0, 
                "order": {"id": 2000, "itemCode": "2000", "partName": "Oil Filter", "quantity": 5, "status": "ACTIVE", "supplierId": 60002, "unit": "pc", "unitPrice": 29.5}, 
                "orderId": 2000, "quantity": 1, "usageDate": "2022-02-03"}], 
            "startDate": "2022-02-02", 
            "tasks": [
                {"quotedPrice": 150, "recordedDate": "2022-02-02", "remarks": undefined, "rid": expect.anything(), 
                    "selectedTask": [{"complexity": "LOW", "component": {"subsystem": "brake"}, "description": "adjust brake", "id": 540001, "unitPrice": 150}], "taskId": 540001}, 
                {"id": 8800001, "quotedPrice": 50, "recordedDate": "2022-02-02", "remarks": "to adjust brake", "rid": expect.anything(), 
                    "selectedTask": [{"complexity": "LOW", "component": {"subsystem": "brake"}, "description": "adjust brake", "id": 540001, "unitPrice": 150}], "taskId": 540001}], 
                "vehicleId": 20001, "vehicleNo": "J 23"})
})

test('change margin to 30%', async () => {
    const user = userEvent.setup()

    const onNewServiceCreated = jest.fn()
    render(<ServiceContext value={new ServiceTransactions(newTransactions(), jest.fn())}>
        <SupplierOrderContext value={new SupplierOrders(orders, jest.fn())}>
            <InProgressTaskFocusListing 
                suppliers={suppliers} vehicles={vehicles} 
                companies={companies} taskTemplates={taskTemplates}
                onNewServiceCreated={onNewServiceCreated} />
        </SupplierOrderContext>
    </ServiceContext>)

    expect(document.querySelectorAll('.card')).toHaveLength(2)

    // click on the first one.
    await user.click(document.querySelectorAll('.card')[0])

    expect(screen.queryByText('Engine Oil 20w-50')).toBeInTheDocument()
    expect(screen.queryByText('Oil Filter')).toBeInTheDocument()

    await user.click(screen.getByText('30%'))
    // OKAY and save
    await user.click(screen.getByText('OKAY'))

    expect(onNewServiceCreated).toBeCalledWith({"id": 10001, "mileageKm": 230000, 
        "sparePartUsages": [
            {"id": 990001, "margin": "30", 
                "order": {"id": 1000, "itemCode": "1000", "partName": "Engine Oil 20w-50", "quantity": 100, "status": "ACTIVE", "supplierId": 60001, "unit": "litres", "unitPrice": 9.7}, 
                "orderId": 1000, "quantity": 20, "soldPrice": 12.61, "usageDate": "2022-02-03"}, 
            {"id": 990004, "margin": "30", 
                "order": {"id": 2000, "itemCode": "2000", "partName": "Oil Filter", "quantity": 5, "status": "ACTIVE", "supplierId": 60002, "unit": "pc", "unitPrice": 29.5}, 
                "orderId": 2000, "quantity": 1, "soldPrice": 38.35, "usageDate": "2022-02-03"}], 
        "sparePartsMargin": "30", "startDate": "2022-02-02", 
        "tasks": [{"id": 8800001, "quotedPrice": 50, "recordedDate": "2022-02-02", "remarks": "to adjust brake", "rid": expect.anything(), 
            "selectedTask": [{"complexity": "LOW", "component": {"subsystem": "brake"}, "description": "adjust brake", "id": 540001, "unitPrice": 150}], "taskId": 540001}], 
        "vehicleId": 20001, "vehicleNo": "J 23"})
})

test('change margin individually', async () => {
    const user = userEvent.setup()

    const onNewServiceCreated = jest.fn()
    render(<ServiceContext value={new ServiceTransactions(newTransactions(), jest.fn())}>
        <SupplierOrderContext value={new SupplierOrders(orders, jest.fn())}>
            <InProgressTaskFocusListing 
                suppliers={suppliers} vehicles={vehicles} 
                companies={companies} taskTemplates={taskTemplates}
                onNewServiceCreated={onNewServiceCreated} />
        </SupplierOrderContext>
    </ServiceContext>)

    expect(document.querySelectorAll('.card')).toHaveLength(2)

    // click on the first one.
    await user.click(document.querySelectorAll('.card')[0])

    expect(screen.queryByText('Engine Oil 20w-50')).toBeInTheDocument()
    expect(screen.queryByText('Oil Filter')).toBeInTheDocument()

    await user.click(screen.queryByText('Engine Oil 20w-50'))
    await user.click(screen.getByLabelText('individual margin 40%'))
    await user.click(screen.getByText('OK'))

    // OKAY and save
    await user.click(screen.getByText('OKAY'))

    expect(onNewServiceCreated).toBeCalledWith({"id": 10001, "mileageKm": 230000, 
        "sparePartUsages": [
            {"id": 990001, "margin": "40", 
                "order": {"id": 1000, "itemCode": "1000", "partName": "Engine Oil 20w-50", "quantity": 100, "status": "ACTIVE", "supplierId": 60001, "unit": "litres", "unitPrice": 9.7}, 
                "orderId": 1000, "quantity": 20, "soldPrice": 13.579999999999998, "usageDate": "2022-02-03"}, 
            {"id": 990004, "margin": 0, 
                "order": {"id": 2000, "itemCode": "2000", "partName": "Oil Filter", "quantity": 5, "status": "ACTIVE", "supplierId": 60002, "unit": "pc", "unitPrice": 29.5}, 
                "orderId": 2000, "quantity": 1, "usageDate": "2022-02-03"}], 
        "startDate": "2022-02-02", 
        "tasks": [{"id": 8800001, "quotedPrice": 50, "recordedDate": "2022-02-02", "remarks": "to adjust brake", "rid": expect.anything(), 
            "selectedTask": [{"complexity": "LOW", "component": {"subsystem": "brake"}, "description": "adjust brake", "id": 540001, "unitPrice": 150}], "taskId": 540001}], 
        "vehicleId": 20001, "vehicleNo": "J 23"})
})

test('just view and go back', async () => {
    const user = userEvent.setup()

    const onNewServiceCreated = jest.fn()
    render(<ServiceContext value={new ServiceTransactions(newTransactions(), jest.fn())}>
        <SupplierOrderContext value={new SupplierOrders(orders, jest.fn())}>
            <InProgressTaskFocusListing 
                suppliers={suppliers} vehicles={vehicles} 
                companies={companies} taskTemplates={taskTemplates}
                onNewServiceCreated={onNewServiceCreated} />
        </SupplierOrderContext>
    </ServiceContext>)

    expect(document.querySelectorAll('.card')).toHaveLength(2)

    // click on the first one.
    await user.click(document.querySelectorAll('.card')[0])

    expect(screen.queryByText('Engine Oil 20w-50')).toBeInTheDocument()
    expect(screen.queryByText('Oil Filter')).toBeInTheDocument()

    await user.click(screen.queryByText('Engine Oil 20w-50'))
    await user.click(screen.getByText('OK'))

    await user.click(screen.queryByText('Oil Filter'))
    await user.click(screen.getByText('OK'))

    // OKAY and save
    await user.click(screen.getByText('OKAY'))

    expect(onNewServiceCreated).not.toBeCalled()
})