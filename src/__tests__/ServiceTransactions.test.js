import { test, expect, jest, afterAll } from '@jest/globals'
import ServiceTransactions from '../ServiceTransactions';

const services = [
    {id: 5000, vehicleId: 82001, vehicleNo: "JJ 1", startDate: "2005-01-01", transactionTypes: ["SERVICE"]},
    {id: 5001, vehicleId: 82002, vehicleNo: "JJ 2", startDate: "2005-03-01", transactionTypes: ["INSPECTION"]},
    {id: 5002, vehicleId: 82003, vehicleNo: "JJ 3", startDate: "2006-02-01", transactionTypes: ["REPAIR"], mileageKm: 2000},
    {id: 5003, vehicleId: 82003, vehicleNo: "JJ 3", startDate: "2006-02-11", transactionTypes: ["SERVICE"], mileageKm: 3000},
    {id: 5004, vehicleId: 82004, vehicleNo: "JJ 4", startDate: "2006-04-01", transactionTypes: ["INSPECTION"], mileageKm: 10000},
]

const newTransactions = () => {
    return [...services].map((t, i) => {
        return {...t, 
            sparePartUsages: services[i].sparePartUsages ? [...services[i].sparePartUsages] : undefined, 
            tasks: services[i].tasks ? [...services[i].tasks]: undefined}
    })
}

afterAll(() => jest.clearAllMocks())

test('brand new empty transactions', () => {
    const dispatch = jest.fn()
    const trsx = new ServiceTransactions()
    trsx.acceptDispatch(dispatch)

    expect(trsx.services()).toEqual([])

    trsx.replaceTransactions(newTransactions())
    expect(dispatch).toBeCalledWith([{"id": 5004, "mileageKm": 10000, "sparePartUsages": undefined, "startDate": "2006-04-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82004, "vehicleNo": "JJ 4"}, 
        {"id": 5003, "mileageKm": 3000, "sparePartUsages": undefined, "startDate": "2006-02-11", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5002, "mileageKm": 2000, "sparePartUsages": undefined, "startDate": "2006-02-01", "tasks": undefined, "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5001, "sparePartUsages": undefined, "startDate": "2005-03-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}, 
        {"id": 5000, "sparePartUsages": undefined, "startDate": "2005-01-01", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}])
})

test('with some services transactions', () => {
    const trsx = new ServiceTransactions(newTransactions())
    expect(trsx.services()).toEqual(services)
})

test('year month group by vehicle', () => {
    const trsx = new ServiceTransactions(newTransactions())
    expect(trsx.filterByYearMonthGroupByVehicle(2005, 0)).toEqual({"JJ 1": 
        [{"id": 5000, "startDate": "2005-01-01", "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}]})

    expect(trsx.filterByYearMonthGroupByVehicle(2006, 1)).toEqual({"JJ 3": 
        [{"id": 5002, "mileageKm": 2000, "startDate": "2006-02-01", "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5003, "mileageKm": 3000, "startDate": "2006-02-11", "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}]
    })
})

test('add new service, brand new and existing', () => {
    const dispatch = jest.fn()
    const trsx = new ServiceTransactions(newTransactions(), dispatch)

    trsx.addNewTransaction({id: 5005, vehicleNo: "A 12", creationDate: "2006-02-12"})
    expect(dispatch).toBeCalledWith([{"creationDate": "2006-02-12", "id": 5005, "sparePartsCount": undefined, "vehicleNo": "A 12", "workmanshipTasksCount": undefined}, 
        {"id": 5004, "mileageKm": 10000, "startDate": "2006-04-01", "transactionTypes": ["INSPECTION"], "vehicleId": 82004, "vehicleNo": "JJ 4"}, 
        {"id": 5003, "mileageKm": 3000, "startDate": "2006-02-11", "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5002, "mileageKm": 2000, "startDate": "2006-02-01", "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5001, "startDate": "2005-03-01", "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}, 
        {"id": 5000, "startDate": "2005-01-01", "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}])

    trsx.addNewTransaction({id: 5005, vehicleNo: "A 12", creationDate: "2006-02-12"})
    expect(dispatch).lastCalledWith([{"creationDate": "2006-02-12", "id": 5005, "sparePartUsages": [], "sparePartsCount": 0, "tasks": [], "vehicleNo": "A 12", "workmanshipTasksCount": 0}, 
        {"id": 5004, "mileageKm": 10000, "startDate": "2006-04-01", "transactionTypes": ["INSPECTION"], "vehicleId": 82004, "vehicleNo": "JJ 4"}, 
        {"id": 5003, "mileageKm": 3000, "startDate": "2006-02-11", "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5002, "mileageKm": 2000, "startDate": "2006-02-01", "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5001, "startDate": "2005-03-01", "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}, 
        {"id": 5000, "startDate": "2005-01-01", "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}])

    // update with new spare parts usage and tasks
    trsx.addNewTransaction({id: 5005, vehicleNo: "A 12", creationDate: "2006-02-12", sparePartUsages: [{id: 60001}, {id: 60002}], tasks: [{id: 70001}, {id: 70002}]})
    expect(dispatch).lastCalledWith([{"creationDate": "2006-02-12", "id": 5005, "sparePartUsages": [{id: 60001}, {id: 60002}], "sparePartsCount": 2, "tasks": [{id: 70001}, {id: 70002}], "vehicleNo": "A 12", "workmanshipTasksCount": 2}, 
        {"id": 5004, "mileageKm": 10000, "startDate": "2006-04-01", "transactionTypes": ["INSPECTION"], "vehicleId": 82004, "vehicleNo": "JJ 4"}, 
        {"id": 5003, "mileageKm": 3000, "startDate": "2006-02-11", "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5002, "mileageKm": 2000, "startDate": "2006-02-01", "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5001, "startDate": "2005-03-01", "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}, 
        {"id": 5000, "startDate": "2005-01-01", "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}])

    // update with existing spare parts usage and tasks
    trsx.addNewTransaction({id: 5005, vehicleNo: "A 12", creationDate: "2006-02-12", sparePartUsages: [{id: 60001, quantity: 2}, {id: 60002}], tasks: [{id: 70001, remarks: 'test engine'}, {id: 70002}]})
    expect(dispatch).lastCalledWith([{"creationDate": "2006-02-12", "id": 5005, "sparePartUsages": [{id: 60001, quantity: 2}, {id: 60002}], "sparePartsCount": 2, "tasks": [{id: 70001, remarks: 'test engine'}, {id: 70002}], "vehicleNo": "A 12", "workmanshipTasksCount": 2}, 
        {"id": 5004, "mileageKm": 10000, "startDate": "2006-04-01", "transactionTypes": ["INSPECTION"], "vehicleId": 82004, "vehicleNo": "JJ 4"}, 
        {"id": 5003, "mileageKm": 3000, "startDate": "2006-02-11", "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5002, "mileageKm": 2000, "startDate": "2006-02-01", "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5001, "startDate": "2005-03-01", "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}, 
        {"id": 5000, "startDate": "2005-01-01", "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}])
})

test('update an existing trx', () => {
    const dispatch = jest.fn()
    const trsx = new ServiceTransactions(newTransactions(), dispatch)

    // not realistics, but just to test it
    trsx.updateTransaction({id: 5004, vehicleNo: "A 12", startDate: "2006-02-12"})
    expect(dispatch).toBeCalledWith([{"id": 5004, "startDate": "2006-02-12", "vehicleNo": "A 12"}, 
        {"id": 5003, "mileageKm": 3000, "sparePartUsages": undefined, "startDate": "2006-02-11", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5002, "mileageKm": 2000, "sparePartUsages": undefined, "startDate": "2006-02-01", "tasks": undefined, "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5001, "sparePartUsages": undefined, "startDate": "2005-03-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}, 
        {"id": 5000, "sparePartUsages": undefined, "startDate": "2005-01-01", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}])

    // with a non exists item
    trsx.updateTransactions([{id: 5004, vehicleNo: "A 12", startDate: "2006-02-12"}, {id: 5005, vehicleNo: "A 13", startDate: "2006-02-13"}])
    expect(dispatch).toBeCalledWith([{"id": 5004, "startDate": "2006-02-12", "vehicleNo": "A 12"}, 
        {"id": 5003, "mileageKm": 3000, "sparePartUsages": undefined, "startDate": "2006-02-11", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5002, "mileageKm": 2000, "sparePartUsages": undefined, "startDate": "2006-02-01", "tasks": undefined, "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5001, "sparePartUsages": undefined, "startDate": "2005-03-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}, 
        {"id": 5000, "sparePartUsages": undefined, "startDate": "2005-01-01", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}])
})

test('update for note', () => {
    const dispatch = jest.fn()
    const trsx = new ServiceTransactions(newTransactions(), dispatch)

    // only note field will be updated
    trsx.updateForNote({id: 5004, vehicleNo: "A 12", startDate: "2006-02-12", notes: 'Hello world'})
    expect(dispatch).toBeCalledWith([{"id": 5004, "mileageKm": 10000, "sparePartUsages": undefined, "startDate": "2006-04-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82004, "vehicleNo": "JJ 4", notes: 'Hello world'}, 
        {"id": 5003, "mileageKm": 3000, "sparePartUsages": undefined, "startDate": "2006-02-11", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5002, "mileageKm": 2000, "sparePartUsages": undefined, "startDate": "2006-02-01", "tasks": undefined, "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5001, "sparePartUsages": undefined, "startDate": "2005-03-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}, 
        {"id": 5000, "sparePartUsages": undefined, "startDate": "2005-01-01", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}])
})

test('remove service', () => {
    const dispatch = jest.fn()
    const trsx = new ServiceTransactions(newTransactions(), dispatch)

    trsx.removeService()
    expect(dispatch).not.toBeCalled()

    trsx.removeService({id: 5000})
    expect(dispatch).toBeCalledWith([{"id": 5004, "mileageKm": 10000, "sparePartUsages": undefined, "startDate": "2006-04-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82004, "vehicleNo": "JJ 4"}, 
        {"id": 5003, "mileageKm": 3000, "sparePartUsages": undefined, "startDate": "2006-02-11", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5002, "mileageKm": 2000, "sparePartUsages": undefined, "startDate": "2006-02-01", "tasks": undefined, "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5001, "sparePartUsages": undefined, "startDate": "2005-03-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}])
})

test('remove a spare part usage', () => {
    const dispatch = jest.fn()
    const trsx = new ServiceTransactions(newTransactions(), dispatch)
    trsx.addNewTransaction({id: 5005, vehicleNo: "A 12", creationDate: "2006-02-12", sparePartUsages: [{id: 60001}, {id: 60002}], tasks: [{id: 70001}, {id: 70002}]})
    expect(trsx.services().length).toBe(6)

    trsx.removeTransaction(5005, 60001)
    expect(dispatch).lastCalledWith([{"creationDate": "2006-02-12", "id": 5005, "sparePartUsages": [{"id": 60002}], "sparePartsCount": 2, "tasks": [{"id": 70001}, {"id": 70002}], "vehicleNo": "A 12", "workmanshipTasksCount": 2}, 
        {"id": 5004, "mileageKm": 10000, "sparePartUsages": undefined, "startDate": "2006-04-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82004, "vehicleNo": "JJ 4"}, 
        {"id": 5003, "mileageKm": 3000, "sparePartUsages": undefined, "startDate": "2006-02-11", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5002, "mileageKm": 2000, "sparePartUsages": undefined, "startDate": "2006-02-01", "tasks": undefined, "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5001, "sparePartUsages": undefined, "startDate": "2005-03-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}, 
        {"id": 5000, "sparePartUsages": undefined, "startDate": "2005-01-01", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}])

    expect(dispatch).toBeCalledTimes(2) 
    trsx.removeTransaction(5005, 60003)
    expect(dispatch).toBeCalledTimes(2)
})

test('remove a task', () => {
    const dispatch = jest.fn()
    const trsx = new ServiceTransactions(newTransactions(), dispatch)
    trsx.addNewTransaction({id: 5005, vehicleNo: "A 12", creationDate: "2006-02-12", sparePartUsages: [{id: 60001}, {id: 60002}], tasks: [{id: 70001}, {id: 70002}]})
    expect(trsx.services().length).toBe(6)

    trsx.removeTask(5005, 70001)
    expect(dispatch).lastCalledWith([{"creationDate": "2006-02-12", "id": 5005, "sparePartUsages": [{"id": 60001},{"id": 60002}], "sparePartsCount": 2, "tasks": [{"id": 70002}], "vehicleNo": "A 12", "workmanshipTasksCount": 2}, 
        {"id": 5004, "mileageKm": 10000, "sparePartUsages": undefined, "startDate": "2006-04-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82004, "vehicleNo": "JJ 4"}, 
        {"id": 5003, "mileageKm": 3000, "sparePartUsages": undefined, "startDate": "2006-02-11", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5002, "mileageKm": 2000, "sparePartUsages": undefined, "startDate": "2006-02-01", "tasks": undefined, "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"}, 
        {"id": 5001, "sparePartUsages": undefined, "startDate": "2005-03-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}, 
        {"id": 5000, "sparePartUsages": undefined, "startDate": "2005-01-01", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}])

    expect(dispatch).toBeCalledTimes(2)
    trsx.removeTask(5005, 70003)
    expect(dispatch).toBeCalledTimes(2)
})

test('sort with completion date too', () => {
    const dispatch = jest.fn()

    const trsx = new ServiceTransactions(newTransactions(), dispatch)

    const newServices = newTransactions()
    newServices[3].completionDate = '2006-2-12'
    newServices[4].completionDate = '2006-4-4'

    trsx.replaceTransactions(newServices)

    expect(dispatch).lastCalledWith([
        {"id": 5002, "mileageKm": 2000, "sparePartUsages": undefined, "startDate": "2006-02-01", "tasks": undefined, "transactionTypes": ["REPAIR"], "vehicleId": 82003, "vehicleNo": "JJ 3"},
        {"id": 5001, "sparePartUsages": undefined, "startDate": "2005-03-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82002, "vehicleNo": "JJ 2"}, 
        {"id": 5000, "sparePartUsages": undefined, "startDate": "2005-01-01", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82001, "vehicleNo": "JJ 1"}, 
        {"completionDate": "2006-4-4", "id": 5004, "mileageKm": 10000, "sparePartUsages": undefined, "startDate": "2006-04-01", "tasks": undefined, "transactionTypes": ["INSPECTION"], "vehicleId": 82004, "vehicleNo": "JJ 4"}, 
        {"completionDate": "2006-2-12", "id": 5003, "mileageKm": 3000, "sparePartUsages": undefined, "startDate": "2006-02-11", "tasks": undefined, "transactionTypes": ["SERVICE"], "vehicleId": 82003, "vehicleNo": "JJ 3"}
    ])
})