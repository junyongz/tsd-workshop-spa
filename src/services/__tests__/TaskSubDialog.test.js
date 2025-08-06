import { jest, test, expect, afterAll } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskSubDialog from '../TaskSubDialog'
import { useState } from 'react'

const taskTemplates = [
    {id: 540001, workmanshipTask: 'Adjust brake', component: {componentName: 'Parking Brake', subsystem: 'Braking'}, 
        description: 'adjust brake for smoother braking', complexity: 'LOW', unitPrice: 150}, 
    {id: 540002, workmanshipTask: 'Touch up seat', component: {componentName: "Driver's Seat", subsystem: 'Cab'}, 
        description: 'touch up cabin seat with thread and needle', complexity: 'HIGH', unitPrice: 250 },
    {id: 540003, workmanshipTask: 'Replace filter', component: {componentName: "Oil Filter", subsystem: 'Lubrication'}, 
        description: 'Installs new oil filter to trap contaminants', complexity: 'LOW', unitPrice: 50 }
]

global.fetch = jest.fn()

jest.useFakeTimers()
afterAll(() => jest.useRealTimers())

test('with existing tasks', async () => {
    const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})

    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{description: 'to adjust brake and apply grease', unitPrice: 200}])
    })

    const removeTask = jest.fn()
    const TaskSubDialogWrapper = () => {
        const [tasks, setTasks] = useState([
                {id: 8800001, serviceId: 10001, quotedPrice: 150, recordedDate: "2022-02-02", remarks: undefined, subsystem: 'Parking Brake',
                    selectedTask: [{complexity: "LOW", workmanshipTask: 'Adjust brake', component: {componentName: 'Braking', subsystem: 'Parking Brake'}, description: "adjust brake", id: 540001, unitPrice: 150}], taskId: 540001}, 
                {id: 8800002, serviceId: 10001, quotedPrice: 50, recordedDate: "2022-02-02", remarks: "sew it nicely", subsystem: 'cab', 
                    selectedTask: [{complexity: "HIGH", workmanshipTask: 'Touch up seat', component: {componentName: "Driver's Seat", subsystem: 'Cab'}, description: "touch up cabin seat", id: 540002, unitPrice: 250}], taskId: 540002}])

        return (<TaskSubDialog taskTemplates={taskTemplates} tasks={tasks} setTasks={setTasks} removeTask={removeTask}></TaskSubDialog>)
    }

    render(<TaskSubDialogWrapper></TaskSubDialogWrapper>)
    expect(screen.queryAllByPlaceholderText('Find a suitable task')).toHaveLength(2)

    // change unit price of the 2nd one
    await user.click(screen.getByLabelText('price for labour 1'))
    await user.keyboard('{Control>}A{/Control}[Backspace]350')

    await waitFor(() => expect(screen.getByLabelText('price for labour 1')).toHaveValue(350))

    // key in remarks and call for mig_task fetching, for the 1st one
    await user.click(screen.getByLabelText('remarks for task 0'))
    await user.keyboard('adjust brake')

    await waitFor(() => expect(global.fetch).toBeCalledWith('http://localhost:8080/api/mig-tasks?keyword=adjust brake'))
    await waitFor(() => expect(screen.queryByText('to adjust brake and apply grease ($200)')).toBeVisible())

    // chose the one!
    await user.click(screen.getByText('to adjust brake and apply grease ($200)'))
    await waitFor(() => {
        expect(screen.queryByText('to adjust brake and apply grease')).toBeVisible()
        expect(screen.queryByText('$200')).toBeVisible()
    })

    // delete the first one
    await user.click(screen.getByLabelText('remove task 0'))
    expect(removeTask).toBeCalledWith(10001, 8800001)
    expect(screen.queryByLabelText('price for labour 1')).not.toBeInTheDocument()
})

test('with brand new tasks', async () => {
    const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})

    global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{description: 'to adjust brake and apply grease', unitPrice: 200}])
    })
    .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{description: 'to sew the cushion seat for passenger', unitPrice: 50}])
    })

    const removeTask = jest.fn()
    const TaskSubDialogWrapper = () => {
        const [tasks, setTasks] = useState([])

        return (<div><span onClick={() => setTasks(prev => [...prev, {}])}>Add New</span><TaskSubDialog taskTemplates={taskTemplates} tasks={tasks} setTasks={setTasks} removeTask={removeTask}></TaskSubDialog></div>)
    }

    render(<TaskSubDialogWrapper></TaskSubDialogWrapper>)

    await user.click(screen.getByText('Add New'))

    await user.click(screen.getByPlaceholderText('Find a suitable task'))
    await user.click(screen.getByLabelText('Replace filter (Lubrication - Oil Filter)'))
    jest.advanceTimersByTime(600)
    await waitFor(() => expect(global.fetch).toBeCalledWith("http://localhost:8080/api/mig-tasks?workshopTasks=Replace filter&subsystem=Lubrication"))

    expect(screen.getByLabelText('price for labour 0')).toHaveValue(50)

    // add one more
    await user.click(screen.getByText('Add New'))

    await user.click(screen.getAllByPlaceholderText('Find a suitable task')[1])
    await user.click(screen.getByLabelText('Touch up seat (Cab - Driver\'s Seat)'))
    jest.advanceTimersByTime(600)
    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/mig-tasks?workshopTasks=Touch up seat&subsystem=Cab"))

    expect(screen.getByLabelText('price for labour 1')).toHaveValue(250)

    // let's remove the first one
    await user.click(screen.getByLabelText('remove task 0'))
    expect(screen.getByLabelText('price for labour 0')).toHaveValue(250)
})

test('with brand new tasks, chosen from picture', async () => {
    const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})

    global.fetch.mockResolvedValue({
        ok: true, // GET /api/mig-tasks
        json: () => Promise.resolve([{description: 'to adjust brake and apply grease', unitPrice: 200}])
    })
    .mockResolvedValue({
        ok: true, // GET /api/mig-tasks
        json: () => Promise.resolve([{description: 'to sew the cushion seat for passenger', unitPrice: 50}])
    })
    .mockResolvedValue({ 
        ok: true, // GET /api/mig-tasks (after choose sub task)
        json: () => Promise.resolve([])
    })
    .mockResolvedValue({
        ok: true, // GET /api/mig-tasks (after key remark)
        json: () => Promise.resolve([])
    })

    const removeTask = jest.fn()
    const TaskSubDialogWrapper = () => {
        const [tasks, setTasks] = useState([])

        return (<div><span onClick={() => setTasks(prev => [...prev, {}])}>Add New</span>
            <TaskSubDialog taskTemplates={taskTemplates} tasks={tasks} 
                setTasks={setTasks} removeTask={removeTask}>
            </TaskSubDialog></div>)
    }

    render(<TaskSubDialogWrapper></TaskSubDialogWrapper>)

    await user.click(screen.getByText('Add New'))

    await user.click(screen.getByLabelText('choose subsystem braking.png'))
    await user.click(screen.getByPlaceholderText('Find a suitable task'))
    await user.click(screen.getByLabelText('Adjust brake (Braking - Parking Brake)'))
    jest.advanceTimersByTime(600)
    await waitFor(() => expect(global.fetch).toBeCalledWith("http://localhost:8080/api/mig-tasks?workshopTasks=Adjust brake&subsystem=Braking"))

    expect(screen.getByLabelText('price for labour 0')).toHaveValue(150)

    // add one more
    await user.click(screen.getByText('Add New'))

    await user.click(screen.getByLabelText('choose subsystem cab.png'))
    await user.click(screen.getAllByPlaceholderText('Find a suitable task')[1])
    await user.click(screen.getByLabelText('Touch up seat (Cab - Driver\'s Seat)'))
    jest.advanceTimersByTime(600)
    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/mig-tasks?workshopTasks=Touch up seat&subsystem=Cab"))

    // 2 more 
    await user.click(screen.getByText('Add New'))

    await user.click(screen.getByLabelText('choose subsystem cab.png'))
    await user.click(screen.getAllByPlaceholderText('Find a suitable task')[1])
    await user.click(screen.getByLabelText('Touch up seat (Cab - Driver\'s Seat)'))
    jest.advanceTimersByTime(600)
    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/mig-tasks?workshopTasks=Touch up seat&subsystem=Cab"))

    await user.click(screen.getByRole('textbox', {name: 'remarks for task 2'}))
    await user.keyboard('Hello world')
    jest.advanceTimersByTime(600)
    await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/mig-tasks?keyword=Hello world"))
})