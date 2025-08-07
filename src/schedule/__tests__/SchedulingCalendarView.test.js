import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, jest, afterAll, afterEach } from '@jest/globals'
import SchedulingCalendarView from '../SchedulingCalendarView';
import { addDaysToDateStr, sameMonth } from '../../utils/dateUtils';

afterAll(() => jest.clearAllMocks())

afterEach(() => jest.restoreAllMocks())

test('scheduling info only', async () => {
    const todayDate = new Date()

    const events = [
            {id: 1000, scheduledDate: addDaysToDateStr(todayDate, 3), vehicleNo: "J 23", notes: 'Sent for inspection'},
            {id: 1001, scheduledDate: addDaysToDateStr(todayDate, -3), vehicleNo: "J 33", notes: 'Sent for inspection'},
            {id: 1002, scheduledDate: addDaysToDateStr(todayDate, 6), vehicleNo: "J 34", notes: 'Sent for repair'},
            {id: 1003, scheduledDate: addDaysToDateStr(todayDate, -3), vehicleNo: "J 56", notes: 'Sent for repair'}
        ]

    global.fetch = jest.fn(() => Promise.resolve( {
        ok: true,
        json: () => Promise.resolve(events)
    }))

    const sameMonthEvents = events.map(evt => new Date(evt.scheduledDate))
        .filter(evtDate => sameMonth(todayDate,evtDate))
        .length

    render(<SchedulingCalendarView vehicles={[]} ></SchedulingCalendarView>)
    await waitFor(() => {
        expect(global.fetch).lastCalledWith("http://localhost:8080/api/scheduling", 
            {"headers": {"Content-type": "application/json"}})
        
        expect(Array.from(document.querySelectorAll('span.badge'))
            .filter(elem => elem.textContent.startsWith("J "))).toHaveLength(sameMonthEvents)
    })
})

test('scheduling info with inspection and roadtax', async () => {
    const todayDate = new Date()

    const events = [
            {id: 1000, scheduledDate: addDaysToDateStr(todayDate, 3), vehicleNo: "J 23", notes: 'Sent for inspection'},
            {id: 1001, scheduledDate: addDaysToDateStr(todayDate, -3), vehicleNo: "J 33", notes: 'Sent for inspection'},
            {id: 1002, scheduledDate: addDaysToDateStr(todayDate, 6), vehicleNo: "J 34", notes: 'Sent for repair'},
            {id: 1003, scheduledDate: addDaysToDateStr(todayDate, -3), vehicleNo: "J 56", notes: 'Sent for repair'}
        ]
    
    const vehicles = [
        {id: 7001, vehicleNo: "J 99", roadTaxExpiryDate: addDaysToDateStr(todayDate, 3), nextInspectionDate: addDaysToDateStr(todayDate, 6)},
        {id: 7002, vehicleNo: "J 100", roadTaxExpiryDate: addDaysToDateStr(todayDate, 5), nextInspectionDate: addDaysToDateStr(todayDate, 10)},
        {id: 7003, vehicleNo: "J 88", roadTaxExpiryDate: addDaysToDateStr(todayDate, 10), nextInspectionDate: addDaysToDateStr(todayDate, 20)},
        {id: 7004, vehicleNo: "J 56", roadTaxExpiryDate: addDaysToDateStr(todayDate, 15), nextInspectionDate: addDaysToDateStr(todayDate, 22)},
        {id: 7005, vehicleNo: "J 59", roadTaxExpiryDate: addDaysToDateStr(todayDate, 0), nextInspectionDate: addDaysToDateStr(todayDate, 0)}
    ]

    global.fetch = jest.fn(() => Promise.resolve( {
        ok: true,
        json: () => Promise.resolve(events)
    }))

    const sameMonthEvents = events.map(evt => new Date(evt.scheduledDate))
            .filter(evtDate => sameMonth(todayDate,evtDate)).length 
        + vehicles.map(evt => new Date(evt.roadTaxExpiryDate))
            .filter(evtDate => sameMonth(todayDate,evtDate)).length
        + vehicles.map(evt => new Date(evt.nextInspectionDate))
            .filter(evtDate => sameMonth(todayDate,evtDate)).length

    render(<SchedulingCalendarView vehicles={vehicles} ></SchedulingCalendarView>)
    await waitFor(() => {
        expect(global.fetch).lastCalledWith("http://localhost:8080/api/scheduling", 
            {"headers": {"Content-type": "application/json"}})
        
        expect(Array.from(document.querySelectorAll('span.badge'))
            .filter(elem => elem.textContent.startsWith("J "))).toHaveLength(sameMonthEvents)
    })
})

test('create a new event', async () => {
    const user = userEvent.setup()

    global.fetch = jest.fn(() => Promise.resolve( {
        ok: true,
        json: () => Promise.resolve([])
    }))
    .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
    })
    .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({id: 1004})
    })

    window.matchMedia = jest.fn(() => {return {
        matches: true
    }})

    const onNewVehicleCreated = jest.fn((vehNo) => Promise.resolve({
        id: 70005, vehiclenNo: vehNo
    }))

    const todayDate = new Date()
    const vehicles = []

    render(<SchedulingCalendarView vehicles={vehicles} onNewVehicleCreated={onNewVehicleCreated}></SchedulingCalendarView>)
    await waitFor(() => {
        expect(global.fetch).lastCalledWith("http://localhost:8080/api/scheduling", 
            {"headers": {"Content-type": "application/json"}})
        
        expect(document.querySelectorAll('span.badge')).toHaveLength(0)
    })

    await user.click(screen.getByRole('button', {name: `day of ${todayDate.getMonth()}-${todayDate.getDate()}`}))
    // key in vehicle new number
    await user.click(screen.getByPlaceholderText('Choose a vehicle...'))
    await user.keyboard("JJ 23")

    // save and hit validation error
    await user.click(screen.getByText('Save'))
    expect(screen.getByPlaceholderText('Choose a vehicle...').validationMessage)
        .toEqual('not a valid vehicle, either choose one and create one first')

    // click to add new vehicle
    await user.click(screen.getByPlaceholderText('Choose a vehicle...'))
    await user.click(screen.getByText("Create & add a new vehicle:"))

    // add to vehicles state for validation check later
    vehicles.push({id: 70005, vehicleNo: 'JJ 23'})

    // clear the button and choose again
    await user.click(screen.getByLabelText('Clear'))
    await user.click(screen.getByPlaceholderText('Choose a vehicle...'))
    await user.click(screen.getByText('JJ 23'))

    // notes
    await user.click(screen.getByPlaceholderText('What to take note?'))
    await user.keyboard("Sent for inspection")

    // save
    await user.click(screen.getByText('Save'))

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/scheduling", 
        {"body": "{\"scheduledDate\":\""+ addDaysToDateStr(todayDate, 0) +"\",\"vehicleId\":70005,\"vehicleNo\":\"JJ 23\",\"notes\":\"Sent for inspection\"}", 
            "headers": {"Content-type": "application/json"}, "method": "POST"}))
})

test('failed to create a new event', async () => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
    })
    .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({status: 500, reason: 'system down'})
    })

    window.matchMedia = jest.fn(() => {return {
        matches: true
    }})

    const onNewVehicleCreated = jest.fn((vehNo) => Promise.resolve({
        id: 70005, vehiclenNo: vehNo
    }))

    const todayDate = new Date()
    const vehicles = [{id: 70005, vehicleNo: 'JJ 23'}]

    render(<SchedulingCalendarView vehicles={vehicles} onNewVehicleCreated={onNewVehicleCreated}></SchedulingCalendarView>)
    await waitFor(() => {
        expect(global.fetch).lastCalledWith("http://localhost:8080/api/scheduling", 
            {"headers": {"Content-type": "application/json"}})
        
        expect(document.querySelectorAll('span.badge')).toHaveLength(0)
    })

    await user.click(screen.getByRole('button', {name: `day of ${todayDate.getMonth()}-${todayDate.getDate()}`}))
    // key in vehicle new number
    await user.click(screen.getByPlaceholderText('Choose a vehicle...'))
    await user.keyboard("JJ 23")

    // notes
    await user.click(screen.getByPlaceholderText('What to take note?'))
    await user.keyboard("Sent for inspection")

    // save
    const consoleError = jest.spyOn(console, 'error')
    await user.click(screen.getByText('Save'))

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/scheduling", 
        {"body": "{\"scheduledDate\":\""+ addDaysToDateStr(todayDate, 0) +"\",\"vehicleId\":70005,\"vehicleNo\":\"JJ 23\",\"notes\":\"Sent for inspection\"}", 
            "headers": {"Content-type": "application/json"}, "method": "POST"}))

    expect(consoleError).nthCalledWith(1, 'failed to create new schedule: {"scheduledDate":"2025-08-07","vehicleId":70005,"vehicleNo":"JJ 23","notes":"Sent for inspection"}')
    expect(consoleError).nthCalledWith(2, 'failed to create because: {"status":500,"reason":"system down"}')
})


test('removing scheduling', async () => {
    const user = userEvent.setup()
    const todayDate = new Date()

    const events = [
            {id: 1000, scheduledDate: addDaysToDateStr(todayDate, 0), vehicleNo: "J 23", notes: 'Sent for inspection'},
            {id: 1001, scheduledDate: addDaysToDateStr(todayDate, 0), vehicleNo: "J 33", notes: 'Sent for inspection'},
            {id: 1002, scheduledDate: addDaysToDateStr(todayDate, 0), vehicleNo: "J 34", notes: 'Sent for repair'},
            {id: 1003, scheduledDate: addDaysToDateStr(todayDate, 0), vehicleNo: "J 56", notes: 'Sent for repair'}
        ]

    global.fetch = jest.fn()
    global.fetch
        .mockResolvedValueOnce(Promise.resolve( {
            ok: true,
            json: () => Promise.resolve(events)
        }))
        .mockResolvedValueOnce(Promise.resolve( {
            ok: true,
            json: () => Promise.resolve(1000)
        }))

    window.matchMedia = jest.fn(() => {return {
        matches: true
    }})

    render(<SchedulingCalendarView vehicles={[]} ></SchedulingCalendarView>)
    await waitFor(() => {
        expect(global.fetch).lastCalledWith("http://localhost:8080/api/scheduling", 
            {"headers": {"Content-type": "application/json"}})
        
        expect(Array.from(document.querySelectorAll('span.badge'))
            .filter(elem => elem.textContent.startsWith("J "))).toHaveLength(3)
    })

    await user.click(screen.getByRole('button', {name: 'more...'}))
    // the bottom part and the dialog
    expect(document.querySelectorAll('.bi-trash3')).toHaveLength(8)
    await user.click(document.querySelectorAll('.bi-trash3')[0])

    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/scheduling/1000", 
        {"headers": {"Content-type": "application/json"}, "method": "DELETE"}))

    await waitFor(() => expect(document.querySelectorAll('.bi-trash3')).toHaveLength(6))
})