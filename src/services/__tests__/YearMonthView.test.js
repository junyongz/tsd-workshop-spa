import { render, screen, waitFor } from '@testing-library/react';
import {jest, test, expect, afterEach} from '@jest/globals'
import YearMonthView from '../YearMonthView';
import { useNavigate } from 'react-router-dom';
import { WorkshopServicesProvider } from '../ServiceContextProvider';
import { SupplierOrderContext } from '../../suppliers/SupplierOrderContextProvider';
import SupplierOrders from '../../suppliers/SupplierOrders';
import { months3EngChars } from '../../utils/dateUtils';
import userEvent from '@testing-library/user-event';

jest.mock('../OrderTooltip', () => ({ order, supplier }) => (
  <div>OrderTooltip for {order.id} from {supplier?.supplierName}</div>
));

jest.mock('bootstrap')
jest.mock('react-router-dom')

global.fetch = jest.fn()

const todayDate = new Date()

/**
 * @type {import('../../ServiceTransactions').WorkshopService[]}
 */
const transactions = [
    {id: 10000, creationDate: '2020-01-02', startDate: '2020-01-02', vehicleId: 20001, vehicleNo: "J 23"},
    {id: 10001, creationDate: '2020-01-12', startDate: '2020-01-12', vehicleId: 20001, vehicleNo: "J 23"},
    {id: 10002, creationDate: '2020-02-02', startDate: '2020-02-02', vehicleId: 20002, vehicleNo: "J 33"},
    {id: 10003, creationDate: '2020-03-02', startDate: '2020-03-02', vehicleId: 20003, vehicleNo: "J 34"},
    {id: 10004, creationDate: '2021-01-02', startDate: '2021-01-02', vehicleId: 20001, vehicleNo: "J 23"},
    {id: 10005, creationDate: '2021-03-02', startDate: '2021-03-02', vehicleId: 20002, vehicleNo: "J 33"},
    {id: 10006, creationDate: '2021-03-19', startDate: '2021-03-19', vehicleId: 20003, vehicleNo: "J 34"},
    {id: 10007, creationDate: '2022-04-07', startDate: '2022-04-07', vehicleId: 20001, vehicleNo: "J 23"},
    {id: 10008, creationDate: '2022-08-07', startDate: '2022-08-07', vehicleId: 20002, vehicleNo: "J 33"},
    {id: 10009, creationDate: '2022-08-09', startDate: '2022-08-09', vehicleId: 20003, vehicleNo: "J 34"},
    {id: 10010, creationDate: '2022-10-17', startDate: '2022-10-17', vehicleId: 20001, vehicleNo: "J 23"},
    {id: 10011, creationDate: '2022-11-09', startDate: '2022-11-09', vehicleId: 20002, vehicleNo: "J 33"},
    {id: 10012, creationDate: '2023-04-07', startDate: '2023-04-07', vehicleId: 20003, vehicleNo: "J 34"},
    {id: 10013, creationDate: '2023-04-27', startDate: '2023-04-27', vehicleId: 20001, vehicleNo: "J 23"},
    {id: 10014, creationDate: '2023-10-07', startDate: '2023-10-07', vehicleId: 20002, vehicleNo: "J 33"},
    {id: 10015, creationDate: '2023-10-10', startDate: '2023-10-10', vehicleId: 20003, vehicleNo: "J 34"}
]

const orders = [
  {id:1001, invoiceDate:"2019-01-19", supplierId:2000,
    itemCode:"E-100", partName:"Engine Oil", quantity:10, unit:"ltr", unitPrice:9,
    deliveryOrderNo:"DO001", status:"ACTIVE"},
  {id:1002, invoiceDate:"2019-03-22", supplierId:2001,
    itemCode:"A-100", partName:"Air Filter", quantity:5, unit:"pcs", unitPrice:80,
    deliveryOrderNo:"DO002", status:"ACTIVE"},
  {id:1003, invoiceDate:"2019-04-05", supplierId:2000, sheetName: 'JUL 23',
    itemCode:"BP-001", partName:"Brake Pads", quantity:8, unit:"set", unitPrice:14,
    deliveryOrderNo:"DO003", status:"ACTIVE"},
  {id:1004, invoiceDate:"2019-12-13", supplierId:2001, sheetName: 'JUL 23',
    itemCode:"BA-002", partName:"Brake Adjuster", quantity:4, unit: "pc", unitPrice:250,
    deliveryOrderNo:"DO003", status:"ACTIVE"}
];

afterEach(() => jest.clearAllMocks())

test('render the overview page with large screen', async() => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(transactions) // just return all
    })

    window.matchMedia = jest.fn(() => {
        return { matches: true }
    })

    render(<WorkshopServicesProvider initialServices={transactions}>
            <SupplierOrderContext value={new SupplierOrders(orders, jest.fn())}>
            <YearMonthView suppliers={[
                {id: 2000, supplierName: 'Kah Seng'}, 
                {id: 2001, supplierName: 'Seribu Bintang'} 
            ]} 
            taskTemplates={[]}></YearMonthView>
            </SupplierOrderContext></WorkshopServicesProvider>)

    document.documentElement.setAttribute('data-bs-theme', 'dark')

    await waitFor(() => expect(global.fetch).toBeCalledWith(`http://localhost:8080/api/workshop-services?year=${todayDate.getFullYear()}&month=${todayDate.getMonth()+1}`))
    await waitFor(() => expect(screen.queryAllByRole('document')).toHaveLength(0))
    await waitFor(() => expect(screen.queryAllByRole('listitem')).toHaveLength(0))
    
    await user.click(screen.getByRole('button', {name: todayDate.getFullYear()}))
    expect(screen.queryAllByLabelText(/change to year/)).toHaveLength(4)

    // change year
    let changeYear = screen.getByLabelText('change to year 2023')
    await user.click(changeYear)
    await waitFor(() => expect(global.fetch).lastCalledWith(`http://localhost:8080/api/workshop-services?year=${changeYear.textContent}&month=${todayDate.getMonth()}`))

    // change month
    await user.click(screen.getByLabelText('change to month Apr'))
    await waitFor(() => expect(screen.queryAllByRole('document')).toHaveLength(2))
    await user.click(screen.getByLabelText('change to month Oct'))
    await waitFor(() => expect(screen.queryAllByRole('document')).toHaveLength(2))

    // change another year
    await user.click(screen.getByRole('button', {name: '2023'}))
    changeYear = screen.getByLabelText('change to year 2020')
    await user.click(changeYear)
    await waitFor(() => expect(global.fetch).lastCalledWith(`http://localhost:8080/api/workshop-services?year=${changeYear.textContent}&month=9`))

    // change to another month
    await user.click(screen.getByLabelText(`change to month Jan`))
    await waitFor(() => expect(global.fetch).lastCalledWith(`http://localhost:8080/api/workshop-services?year=${changeYear.textContent}&month=1`))
    expect(screen.queryAllByRole('document')).toHaveLength(1)
    expect(screen.getAllByRole('document')[0]).toHaveTextContent('J 23$0.00')
})

test('render the overview page with small screen', async() => {
    const user = userEvent.setup()

    global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(transactions) // just return all
    })

    window.matchMedia = jest.fn(() => {
        return { matches: false }
    })

    render(<WorkshopServicesProvider initialServices={transactions}>
            <SupplierOrderContext value={new SupplierOrders(orders, jest.fn())}>
            <YearMonthView suppliers={[
                {id: 2000, supplierName: 'Kah Seng'}, 
                {id: 2001, supplierName: 'Seribu Bintang'} 
            ]} 
            taskTemplates={[]}></YearMonthView>
            </SupplierOrderContext></WorkshopServicesProvider>)

    document.documentElement.setAttribute('data-bs-theme', 'light')

    await waitFor(() => expect(global.fetch).toBeCalledWith(`http://localhost:8080/api/workshop-services?year=${todayDate.getFullYear()}&month=${todayDate.getMonth()+1}`))
    await waitFor(() => expect(screen.queryAllByRole('document')).toHaveLength(0))
    await waitFor(() => expect(screen.queryAllByRole('listitem')).toHaveLength(0))
    
    await user.click(screen.getByRole('button', {name: todayDate.getFullYear()}))
    expect(screen.queryAllByLabelText(/change to year/)).toHaveLength(4)

    // change year
    let changeYear = screen.getByLabelText('change to year 2023')
    await user.click(changeYear)
    await waitFor(() => expect(global.fetch).lastCalledWith(`http://localhost:8080/api/workshop-services?year=${changeYear.textContent}&month=${todayDate.getMonth()}`))

    // change month
    await user.click(screen.getByRole('button', {name: months3EngChars[todayDate.getMonth()]}))
    await user.click(screen.getByLabelText('change to month Apr'))
    await waitFor(() => expect(screen.queryAllByRole('document')).toHaveLength(2))
})

test('render the overview page with small screen, with parts and tasks', async() => {
    const user = userEvent.setup()

    const newTransactions = [...transactions]
    newTransactions[8].migratedHandWrittenSpareParts = [
        {index: 1000, itemDescription: 'Brake Adjuster', quantity: 1, unit: 'pc', unitPrice: 250, totalPrice: 250},
        {index: 1001, itemDescription: 'Brake Lining', quantity: 4, unit: 'pc', unitPrice: 12, totalPrice: 48},
        {index: 1002, itemDescription: 'Brake Shoes', quantity: 4, unit: 'pc'}
    ]
    newTransactions[9].sparePartUsages = [
        {id: 90001, orderId: 1001, quantity: 2, soldPrice: 5},
        {id: 90002, orderId: 1002, quantity: 1, soldPrice: 15, margin: 20},
        {id: 90003, orderId: 1005}
    ]
    newTransactions[9].tasks = [
        {id: 880001, taskId: 750001, recordedDate: '2022-08-10', remarks: 'to adjust brake', quotedPrice: 150},
    ]

    global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(newTransactions) // just return all
    })

    window.matchMedia = jest.fn(() => {
        return { matches: false }
    })

    render(<WorkshopServicesProvider initialServices={newTransactions}>
            <SupplierOrderContext value={new SupplierOrders(
                [...orders, {id: 1005, partName: 'polish service'}], jest.fn())}>
            <YearMonthView suppliers={[
                {id: 2000, supplierName: 'Kah Seng'}, 
                {id: 2001, supplierName: 'Seribu Bintang'} 
            ]} 
            taskTemplates={[{id: 750001, workmanship: 'adjust brake', component: {subsystem: 'Brake', componentName: 'Parking Brake'}}]}></YearMonthView>
            </SupplierOrderContext></WorkshopServicesProvider>)

    document.documentElement.setAttribute('data-bs-theme', 'light')

    await waitFor(() => expect(global.fetch).toBeCalledWith(`http://localhost:8080/api/workshop-services?year=${todayDate.getFullYear()}&month=${todayDate.getMonth()+1}`))
    await waitFor(() => expect(screen.queryAllByRole('document')).toHaveLength(0))
    await waitFor(() => expect(screen.queryAllByRole('listitem')).toHaveLength(0))
    
    await user.click(screen.getByRole('button', {name: todayDate.getFullYear()}))
    expect(screen.queryAllByLabelText(/change to year/)).toHaveLength(4)

    // change year
    let changeYear = screen.getByLabelText('change to year 2022')
    await user.click(changeYear)
    await waitFor(() => expect(global.fetch).lastCalledWith(`http://localhost:8080/api/workshop-services?year=${changeYear.textContent}&month=${todayDate.getMonth()}`))

    // change month
    await user.click(screen.getByRole('button', {name: months3EngChars[todayDate.getMonth()]}))
    await user.click(screen.getByLabelText('change to month Aug'))
    await waitFor(() => expect(screen.queryAllByRole('document')).toHaveLength(2))

    // check value
    expect(screen.getAllByRole('document')[0]).toHaveTextContent('J 34$NaN2022-08-09Engine Oil OrderTooltip for 1001 from Kah Seng2 ltr @ $5.00$ 18.002022-08-09Air Filter OrderTooltip for 1002 from Seribu Bintang1 pcs @ $15.00original: $80.00 20%$ 80.002022-08-09polish service OrderTooltip for 1005 from $ 02022-08-10 (Brake - Parking Brake) to adjust brake$ 150.00')
    expect(screen.getAllByRole('document')[1]).toHaveTextContent('J 33$298.002022-08-07Brake Adjuster1 pc @ $250.00$ 250.002022-08-07Brake Lining4 pc @ $12.00$ 48.00')

    // back
    await user.click(screen.getByText('Back to Service'))
    expect(useNavigate()).lastCalledWith('/')
})