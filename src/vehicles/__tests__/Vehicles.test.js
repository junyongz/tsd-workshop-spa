import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, jest, afterAll } from '@jest/globals'

import Vehicles from '../Vehicles';
import { ServiceContext } from '../../services/ServiceContextProvider';
import ServiceTransactions from '../../ServiceTransactions';
import { addDaysToDateStr, addMonthsToDateStr } from '../../utils/dateUtils';

afterAll(() => jest.clearAllMocks())

global.fetch = jest.fn()

const services = [
    {id: 5000, vehicleId: 82001, vehicleNo: "JJ 1", startDate: "2005-01-01", transactionTypes: ["SERVICE"]},
    {id: 5001, vehicleId: 82002, vehicleNo: "JJ 2", startDate: "2005-03-01", transactionTypes: ["INSPECTION"]},
    {id: 5002, vehicleId: 82003, vehicleNo: "JJ 3", startDate: "2005-02-01", transactionTypes: ["REPAIR"], mileageKm: 2000},
    {id: 5003, vehicleId: 82003, vehicleNo: "JJ 3", startDate: "2005-02-11", transactionTypes: ["SERVICE"], mileageKm: 3000},
    {id: 5004, vehicleId: 82004, vehicleNo: "JJ 4", startDate: "2005-04-01", transactionTypes: ["INSPECTION"], mileageKm: 10000},
]

const companies = [
    {id: 8000, companyName: "TSD", internal: false},
    {id: 8001, companyName: "Harsoon", internal: true},
]

const vehicles = [
    {id: 82001, vehicleNo: "JJ 1", companyId: 8000, latestMileageKm: 20000},
    {id: 82002, vehicleNo: "JJ 2", companyId: 8000, latestMileageKm: 18000},
    {id: 82003, vehicleNo: "JJ 3", companyId: 8001, latestMileageKm: 12000},
    {id: 82004, vehicleNo: "JJ 4", companyId: 8001, latestMileageKm: 15000},
]

test('render many vehicles', () => {
    render(<ServiceContext value={new ServiceTransactions(services, jest.fn())}>
            <Vehicles vehicles={vehicles} companies={companies}></Vehicles>
        </ServiceContext>)

    expect(screen.getAllByRole("button")).toHaveLength(2)
    expect(screen.getAllByRole("button")
        .map(elem => elem.className)
        .filter(clz => clz === 'card')).toHaveLength(2)

    expect(screen.getAllByText('10,000 KM @ 2005-04-01')).toHaveLength(1)
    expect(screen.getAllByText('3,000 KM @ 2005-02-11')).toHaveLength(1)
})

test('filter service due soon', async () => {
    const user = userEvent.setup()

    const latestServices = [
        {id: 5002, vehicleId: 82003, vehicleNo: "JJ 3", startDate: addDaysToDateStr(new Date(), -5), transactionTypes: ["REPAIR"], mileageKm: 2000},
        {id: 5003, vehicleId: 82003, vehicleNo: "JJ 3", startDate: addMonthsToDateStr(new Date(), -3), transactionTypes: ["SERVICE"], mileageKm: 10000},
        {id: 5004, vehicleId: 82004, vehicleNo: "JJ 4", startDate: addDaysToDateStr(new Date(), -5), transactionTypes: ["SERVICE"], mileageKm: 14000},
        {id: 5004, vehicleId: 82004, vehicleNo: "JJ 4", startDate: addDaysToDateStr(new Date(), -5), transactionTypes: ["INSPECTION"], mileageKm: 14000},
    ]

    render(<ServiceContext value={new ServiceTransactions(latestServices, jest.fn())}>
            <Vehicles vehicles={vehicles} companies={companies}></Vehicles>
        </ServiceContext>)

    // default sorting by latest mileage km then number
    expect(screen.getAllByRole("button")[0]).toHaveTextContent(/15,000 KM/i)
    expect(screen.getAllByRole("button")[1]).toHaveTextContent(/12,000 KM/i)

    await user.click(screen.getByRole('checkbox', {name: 'Service due soon'}))

    // then sort by service due soon
    expect(screen.getAllByRole("button")[0]).toHaveTextContent(/12,000 KM/i)
    expect(screen.getAllByRole("button")[1]).toHaveTextContent(/15,000 KM/i)

    await user.click(screen.getByRole('checkbox', {name: 'Inspection due soon'}))
    
    expect(screen.getAllByRole("button")[0]).toHaveTextContent(/15,000 KM/i)
    expect(screen.getAllByRole("button")[1]).toHaveTextContent(/12,000 KM/i)
})

test('show update dialog for vehicle and update', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
            id: 820004, vehicleNo: "JJ 4"
        })
    })

    const setVehicles = jest.fn()

    render(<ServiceContext value={new ServiceTransactions(services, jest.fn())}>
            <Vehicles vehicles={vehicles} companies={companies} setVehicles={setVehicles}></Vehicles>
        </ServiceContext>)

    expect(screen.getAllByRole("button")).toHaveLength(2)
    await user.click(screen.getAllByRole("button")[0])
    expect(screen.getAllByPlaceholderText('Key in trailer no')).toHaveLength(1)
    await user.click(screen.getByRole('button', {name: 'Save'}))

    expect(document.querySelector('input[name="insuranceExpiryDate"]')).toBeInvalid()
    await user.click(document.querySelector('input[name="insuranceExpiryDate"]'))
    await user.keyboard(addMonthsToDateStr(new Date(), 6))

    expect(document.querySelector('input[name="roadTaxExpiryDate"]')).toBeInvalid()
    await user.click(document.querySelector('input[name="roadTaxExpiryDate"]'))
    await user.keyboard(addMonthsToDateStr(new Date(), 6))

    expect(document.querySelector('input[name="inspectionDueDate"]')).toBeInvalid()
    await user.click(document.querySelector('input[name="inspectionDueDate"]'))
    await user.keyboard(addMonthsToDateStr(new Date(), 3))

    await user.click(screen.getByRole('button', {name: 'Save'}))

    await waitFor(() => {
        expect(global.fetch).lastCalledWith("http://localhost:8080/api/vehicles", 
            {"body": "{\"id\":82004,\"vehicleNo\":\"JJ 4\",\"trailerNo\":\"\",\"companyId\":8001,\"insuranceExpiryDate\":\""+
                addMonthsToDateStr(new Date(), 6)+"\",\"roadTaxExpiryDate\":\""+
                addMonthsToDateStr(new Date(), 6)+"\",\"inspectionDueDate\":\""+
                addMonthsToDateStr(new Date(), 3)+"\",\"trailerInspectionDueDate\":\""+
                addMonthsToDateStr(new Date(), 3)+"\",\"nextInspectionDate\":\"\",\"nextTrailerInspectionDate\":\"\"}", 
            "headers": {"Content-type": "application/json"}, 
            "method": "POST"})
    })

    const updateFunc = setVehicles.mock.calls[0][0]
    const newVehicles = updateFunc([{id: 820004, vehicleNo: "JJ 4"}, {id: 820001, vehicleNo: "JJ 3"}])
    expect(newVehicles).toEqual([{id: 820004, vehicleNo: "JJ 4"}, {id: 820001, vehicleNo: "JJ 3"}])
})

test('trailier different inspection date', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
            id: 820004, vehicleNo: "JJ 4", trailerNo: "T/J 1"
        })
    })

    const setVehicles = jest.fn()

    render(<ServiceContext value={new ServiceTransactions(services, jest.fn())}>
            <Vehicles vehicles={vehicles} companies={companies} setVehicles={setVehicles}></Vehicles>
        </ServiceContext>)

    expect(screen.getAllByRole("button")).toHaveLength(2)
    await user.click(screen.getAllByRole("button")[0])

    await user.click(document.querySelector('input[name="insuranceExpiryDate"]'))
    await user.keyboard(addMonthsToDateStr(new Date(), 6))

    await user.click(document.querySelector('input[name="roadTaxExpiryDate"]'))
    await user.keyboard(addMonthsToDateStr(new Date(), 6))

    await user.click(document.querySelector('input[name="inspectionDueDate"]'))
    await user.keyboard(addMonthsToDateStr(new Date(), 3))

    // key in different date for trailer inspection
    await user.click(screen.getByRole('button', {name: 'Different for Trailer'}))

    await user.click(document.querySelector('input[name="trailerInspectionDueDate"]'))
    await user.keyboard(addMonthsToDateStr(new Date(), 2))

    await user.click(screen.getByRole('button', {name: 'Save'}))

    await waitFor(() => {
        expect(global.fetch).lastCalledWith("http://localhost:8080/api/vehicles", 
            {"body": "{\"id\":82004,\"vehicleNo\":\"JJ 4\",\"trailerNo\":\"\",\"companyId\":8001,\"insuranceExpiryDate\":\""+
                addMonthsToDateStr(new Date(), 6)+"\",\"roadTaxExpiryDate\":\""+
                addMonthsToDateStr(new Date(), 6)+"\",\"inspectionDueDate\":\""+
                addMonthsToDateStr(new Date(), 3)+"\",\"trailerInspectionDueDate\":\""+
                addMonthsToDateStr(new Date(), 2)+"\",\"nextInspectionDate\":\"\",\"nextTrailerInspectionDate\":\"\"}", 
            "headers": {"Content-type": "application/json"}, 
            "method": "POST"})
    })

    const updateFunc = setVehicles.mock.calls[0][0]
    const newVehicles = updateFunc([{id: 820004, vehicleNo: "JJ 4"}, {id: 820001, vehicleNo: "JJ 3"}])
    expect(newVehicles).toEqual([{id: 820004, trailerNo: "T/J 1", vehicleNo: "JJ 4"}, {id: 820001, vehicleNo: "JJ 3"}])
})