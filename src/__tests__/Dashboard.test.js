import { test, expect, jest, afterEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Dashboard from '../Dashboard';
import { addDaysToDateStr } from '../utils/dateUtils';
import { clearAllThen } from '../__mocks__/userEventUtil';

global.fetch = jest.fn()
window.matchMedia = jest.fn()

afterEach(() => jest.clearAllMocks())

test('render empty dashboard', async () => {
    window.matchMedia.mockReturnValue({matches: true})

    global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
    })
    render(<Dashboard></Dashboard>)

    const todayDate = new Date()

    await waitFor(() => expect(global.fetch).lastCalledWith(`http://localhost:8080/api/transaction-stats?fromDate=${addDaysToDateStr(todayDate, -30)}&toDate=${addDaysToDateStr(todayDate, 0)}`))
})

test('render some data', async() => {
    const user = userEvent.setup()

    window.matchMedia.mockReturnValue({matches: false})

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":1383.0,"task_costs":null,"start_date":"2025-07-21","count":4,"repair_count":3,"service_count":0,"inspection_count":0,"tyre_count":1,"pending_count":4,"completion_count":0,"average_completion_days":0},
            {"company_name":"YSO Resources Sdn Bhd","part_costs":13,"task_costs":null,"start_date":"2025-07-21","count":1,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"Serba Wangi JH Sdn Bhd","part_costs":60,"task_costs":null,"start_date":"2025-07-21","count":1,"repair_count":0,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":3591.68,"task_costs":null,"start_date":"2025-07-22","count":3,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":3,"completion_count":0,"average_completion_days":1},
            {"company_name":"YSO Resources Sdn Bhd","part_costs":30,"task_costs":null,"start_date":"2025-07-22","count":1,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"Syarikat Sin Kwang Plastic Industries Sdn Bhd","part_costs":15,"task_costs":null,"start_date":"2025-07-22","count":1,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":1075.0,"task_costs":null,"start_date":"2025-07-23","count":3,"repair_count":1,"service_count":1,"inspection_count":0,"tyre_count":0,"pending_count":3,"completion_count":0,"average_completion_days":0},
            {"company_name":"YSO Resources Sdn Bhd","part_costs":316,"task_costs":null,"start_date":"2025-07-23","count":1,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"Syarikat Sin Kwang Plastic Industries Sdn Bhd","part_costs":887.8,"task_costs":null,"start_date":"2025-07-23","count":1,"repair_count":1,"service_count":0,"inspection_count":1,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":107.5,"task_costs":null,"start_date":"2025-07-24","count":3,"repair_count":2,"service_count":0,"inspection_count":0,"tyre_count":1,"pending_count":3,"completion_count":0,"average_completion_days":0},
            {"company_name":"Serba Wangi JH Sdn Bhd","part_costs":394.2,"task_costs":null,"start_date":"2025-07-24","count":1,"repair_count":1,"service_count":0,"inspection_count":1,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":2},
            {"company_name":null,"part_costs":896.8,"task_costs":null,"start_date":"2025-07-24","count":1,"repair_count":1,"service_count":0,"inspection_count":1,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":4},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":345,"task_costs":null,"start_date":"2025-07-25","count":1,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"Serba Wangi JH Sdn Bhd","part_costs":429.2,"task_costs":null,"start_date":"2025-07-25","count":1,"repair_count":1,"service_count":0,"inspection_count":1,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":2},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":771.0,"task_costs":null,"start_date":"2025-07-26","count":3,"repair_count":0,"service_count":1,"inspection_count":0,"tyre_count":0,"pending_count":3,"completion_count":0,"average_completion_days":0},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":2537.6,"task_costs":null,"start_date":"2025-07-27","count":1,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":1,"pending_count":1,"completion_count":0,"average_completion_days":1},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":929.1,"task_costs":null,"start_date":"2025-07-28","count":4,"repair_count":2,"service_count":1,"inspection_count":1,"tyre_count":0,"pending_count":4,"completion_count":0,"average_completion_days":0},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":292.1,"task_costs":null,"start_date":"2025-07-29","count":1,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"YSO Resources Sdn Bhd","part_costs":762.9,"task_costs":null,"start_date":"2025-07-29","count":1,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"Chang Huat Plastic Industries (Senai) Sdn Bhd","part_costs":575.3,"task_costs":null,"start_date":"2025-07-29","count":3,"repair_count":3,"service_count":1,"inspection_count":0,"tyre_count":0,"pending_count":3,"completion_count":0,"average_completion_days":1},
            {"company_name":null,"part_costs":3245.5,"task_costs":null,"start_date":"2025-07-29","count":2,"repair_count":2,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":2,"completion_count":0,"average_completion_days":10},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":122,"task_costs":null,"start_date":"2025-07-30","count":4,"repair_count":3,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":4,"completion_count":0,"average_completion_days":0},
            {"company_name":null,"part_costs":164.2,"task_costs":null,"start_date":"2025-07-30","count":1,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":1078,"task_costs":null,"start_date":"2025-07-31","count":1,"repair_count":0,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"KTS Transport Sdn Bhd","part_costs":null,"task_costs":null,"start_date":"2025-07-31","count":1,"repair_count":0,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"WMS Industrial Gas & Equipment Sdn Bhd","part_costs":136.4,"task_costs":null,"start_date":"2025-07-31","count":1,"repair_count":1,"service_count":1,"inspection_count":0,"tyre_count":0,"pending_count":0,"completion_count":1,"average_completion_days":null},
            {"company_name":"Chang Huat Plastic Industries (Senai) Sdn Bhd","part_costs":390,"task_costs":null,"start_date":"2025-07-31","count":1,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":126.0,"task_costs":null,"start_date":"2025-08-01","count":3,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":3,"completion_count":0,"average_completion_days":0},
            {"company_name":"KTS Transport Sdn Bhd","part_costs":4,"task_costs":null,"start_date":"2025-08-01","count":2,"repair_count":0,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":1,"average_completion_days":0},
            {"company_name":"Syarikat Sin Kwang Plastic Industries Sdn Bhd","part_costs":36,"task_costs":null,"start_date":"2025-08-01","count":1,"repair_count":0,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0}
        ])
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
            {"company_name":"WMS Industrial Gas & Equipment Sdn Bhd","part_costs":136.4,"task_costs":null,"start_date":"2025-07-31","count":1,"repair_count":1,"service_count":1,"inspection_count":0,"tyre_count":0,"pending_count":0,"completion_count":1,"average_completion_days":null},
            {"company_name":"Chang Huat Plastic Industries (Senai) Sdn Bhd","part_costs":390,"task_costs":null,"start_date":"2025-07-31","count":1,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0},
            {"company_name":"Harsoon Logistics Sdn Bhd","part_costs":126.0,"task_costs":null,"start_date":"2025-08-01","count":3,"repair_count":1,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":3,"completion_count":0,"average_completion_days":0},
            {"company_name":"KTS Transport Sdn Bhd","part_costs":4,"task_costs":null,"start_date":"2025-08-01","count":2,"repair_count":0,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":1,"average_completion_days":0},
            {"company_name":"Syarikat Sin Kwang Plastic Industries Sdn Bhd","part_costs":36,"task_costs":null,"start_date":"2025-08-01","count":1,"repair_count":0,"service_count":0,"inspection_count":0,"tyre_count":0,"pending_count":1,"completion_count":0,"average_completion_days":0}
        ])
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
    }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
    })
    render(<Dashboard></Dashboard>)

    const todayDate = new Date()

    await waitFor(() => expect(global.fetch).lastCalledWith(`http://localhost:8080/api/transaction-stats?fromDate=${addDaysToDateStr(todayDate, -30)}&toDate=${addDaysToDateStr(todayDate, 0)}`))
    await user.selectOptions(screen.getByLabelText('change company to'), 'Harsoon Logistics Sdn Bhd')
    await user.selectOptions(screen.getByLabelText('change company to'), 'All')
    await user.selectOptions(screen.getByLabelText('change company to'), 'KTS Transport Sdn Bhd')

    expect(screen.queryAllByRole('application')).toHaveLength(4)

    await user.click(screen.getByLabelText('change from date'))
    await user.keyboard(clearAllThen(addDaysToDateStr(todayDate, -10)))
    await waitFor(() => expect(global.fetch).nthCalledWith(2, `http://localhost:8080/api/transaction-stats?fromDate=${addDaysToDateStr(todayDate, -10)}&toDate=${addDaysToDateStr(todayDate, 0)}`))

    await user.click(screen.getByLabelText('change to date'))
    await user.keyboard(clearAllThen(addDaysToDateStr(todayDate, -5)))
    await waitFor(() => expect(global.fetch).nthCalledWith(3, `http://localhost:8080/api/transaction-stats?fromDate=${addDaysToDateStr(todayDate, -10)}&toDate=${addDaysToDateStr(todayDate, -5)}`))

    await user.click(screen.getByLabelText('for today date'))
    await waitFor(() => expect(global.fetch).nthCalledWith(4, `http://localhost:8080/api/transaction-stats?fromDate=${addDaysToDateStr(todayDate, -10)}&toDate=${addDaysToDateStr(todayDate, 0)}`))
})