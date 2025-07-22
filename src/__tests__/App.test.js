import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, jest, afterAll } from '@jest/globals'
import App from '../App';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ServiceContext } from '../services/ServiceContextProvider';
import { SupplierOrderContext } from '../suppliers/SupplierOrderContextProvider';
import ServiceTransactions from '../ServiceTransactions';
import SupplierOrders from '../suppliers/SupplierOrders';

jest.mock('react-bootstrap-typeahead/types/utils/getOptionLabel', () => ((opt, labelKey) => opt[labelKey]));

jest.mock('../schedule/SchedulingCalendarView', () => 
    ({onNewVehicleCreated}) => <div><span data-testid="onNewVehicleCreated"  onClick={() => onNewVehicleCreated("JJ 3")}></span></div>
)
jest.mock('../vehicles/Vehicles', () => 
    ({}) => <div data-testid="vehicle-page"></div>
)
jest.mock('../spare-parts/SpareParts', () => 
    ({}) => <div data-testid="parts-page"></div>
)
jest.mock('../services/InProgressTaskFocusListing', () => 
    ({}) => <div data-testid="task-page"></div>
)
jest.mock('../services/YearMonthView', () => 
    ({}) => <div data-testid="service-year-month-page"></div>
)
jest.mock('../suppliers/SuppliersSpareParts', () => 
    ({}) => <div data-testid="supplier-orders-page"></div>
)
jest.mock('../ServiceListing', () => 
    ({}) => <div data-testid="service-listing-page"></div>
)
jest.mock('../NavigationBar', () => ({}) => <div data-testid="navigation-bar"></div>)
jest.useFakeTimers()
global.fetch = jest.fn()

afterAll(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
})

test('draw with mocked components and click the new vehicle created', async () => {
    const user = userEvent.setup()

    useLocation.mockReturnValue({pathname: '/'})
    global.fetch
    .mockResolvedValueOnce({
        ok: true, // /api/suppliers
        json: () => Promise.resolve([{id: 1000, supplierName: "TKS"}, {id: 1001, supplierName: "HA"}]) 
    })
    .mockResolvedValueOnce({
        ok: true, // /api/tasks
        json: () => Promise.resolve([
            {id: 2000, component: {componentName: "Fuel Tank", subsystem: "Fuel"}},
            {id: 2001, component: {componentName: "Windows and Mirrors", subsystem: "Cab"}}
        ]) 
    })
    .mockResolvedValueOnce({ 
        ok: true, // /api/supplier-spare-parts?fetch=ACTIVE
        json: () => Promise.resolve([
            { id: 5000, deliveryOrderNo: "2005-001", partName: "Fuel Tank S/2", quantity: 10, supplierId: 1000, status: "ACTIVE"},
            { id: 5001, deliveryOrderNo: "2025-001", partName: "Brake Chamber", quantity: 20, supplierId: 1001, status: "ACTIVE"}
        ]) 
    })
    .mockResolvedValueOnce({ 
        ok: true, // /api/workshop-services?pageNumber=0&pageSize=30
        json: () => Promise.resolve([
            { id: 3000, startDate: "2005-01-01", vehicleNo: "JJ 1"},
            { id: 3001, startDate: "2005-02-01", vehicleNo: "JJ 2"}
        ]) 
    })
    .mockResolvedValueOnce({ 
        ok: true, // /api/spare-part-utilization?pageNumber=0&pageSize=30
        json: () => Promise.resolve([
            { id: 7000, serviceId: 3000, orderId: 5000 , quantity: 5},
            { id: 7001, serviceId: 3001, orderId: 5001 , quantity: 5},
        ]) 
    })
    .mockResolvedValueOnce({ 
        ok: true, // /api/companies
        json: () => Promise.resolve([
            { id: 8000, companyName: "TSD"},
            { id: 8001, companyName: "Harsoon"},
        ]) 
    })
    .mockResolvedValueOnce({ 
        ok: true, // /api/vehicles
        json: () => Promise.resolve([
            { id: 82001, vehicleNo: "JJ 1", companyId: 8000},
            { id: 82002, vehicleNo: "JJ 2", companyId: 8001},
        ]) 
    })
    .mockResolvedValueOnce({ 
        ok: true, // /api/supplier-spare-parts
        json: () => Promise.resolve([
            { id: 5000, deliveryOrderNo: "2005-001", partName: "Fuel Tank S/2", quantity: 10, supplierId: 1000, status: "ACTIVE"},
            { id: 5001, deliveryOrderNo: "2025-001", partName: "Brake Chamber", quantity: 20, supplierId: 1001, status: "ACTIVE"}
        ]) 
    })
    .mockResolvedValueOnce({ 
        ok: true, // /api/workshop-services
        json: () => Promise.resolve([
            { id: 3000, startDate: "2005-01-01", vehicleNo: "JJ 1"},
            { id: 3001, startDate: "2005-02-01", vehicleNo: "JJ 2"}
        ]) 
    })
    .mockResolvedValueOnce({ 
        ok: true, // /api/stats/dbtables
        json: () => Promise.resolve([
            { "tableName": "vehicle", "lastTransactionId": 45472 },
            { "tableName": "spare_part_usages", "lastTransactionId": 45496 },
            { "tableName": "workshop_service", "lastTransactionId": 45507 },
            { "tableName": "mig_supplier_spare_parts", "lastTransactionId": 45506 }
        ]) 
    })
    .mockResolvedValueOnce({
        ok: true, // POST /api/vehicles
        json: () => Promise.resolve({id: 82003, vehicleNo: "JJ 3"}) 
    })
    .mockResolvedValueOnce({ 
        ok: true, // /api/vehicles
        json: () => Promise.resolve([
            { id: 82001, vehicleNo: "JJ 1", companyId: 8000},
            { id: 82002, vehicleNo: "JJ 2", companyId: 8001},
            { id: 82003, vehicleNo: "JJ 3"}
        ]) 
    })

    render(<ServiceContext value={new ServiceTransactions([], jest.fn())}>
        <SupplierOrderContext value={new SupplierOrders([], jest.fn())}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </SupplierOrderContext>
        </ServiceContext>)

    jest.advanceTimersByTime(1000)
    await waitFor(() => expect(global.fetch).toBeCalledTimes(9))

    expect(global.fetch).nthCalledWith(1, "http://localhost:8080/api/suppliers", {"mode": "cors"})
    expect(global.fetch).nthCalledWith(2, "http://localhost:8080/api/tasks", {"headers": {"Content-type": "application/json"}, "mode": "cors"})
    expect(global.fetch).nthCalledWith(3, "http://localhost:8080/api/supplier-spare-parts?fetch=ACTIVE", {"mode": "cors"})
    expect(global.fetch).nthCalledWith(4, "http://localhost:8080/api/workshop-services?pageNumber=0&pageSize=30", {"mode": "cors"})
    expect(global.fetch).nthCalledWith(5, "http://localhost:8080/api/spare-part-utilizations", {"mode": "cors"})
    expect(global.fetch).nthCalledWith(6, "http://localhost:8080/api/companies", {"mode": "cors"})
    expect(global.fetch).nthCalledWith(7, "http://localhost:8080/api/vehicles", {"mode": "cors"})
    expect(global.fetch).nthCalledWith(8, "http://localhost:8080/api/supplier-spare-parts?fetch=ALL", {"mode": "cors"})
    expect(global.fetch).nthCalledWith(9, "http://localhost:8080/api/workshop-services", {"mode": "cors"})

    jest.advanceTimersByTime(30000)
    await waitFor(() => expect(global.fetch).toBeCalledTimes(10))
    expect(global.fetch).nthCalledWith(10, "http://localhost:8080/api/stats/dbtables", {"mode": "cors"})

    await waitFor(() => expect(global.fetch).toBeCalledTimes(10))
    expect(screen.getByTestId('onNewVehicleCreated')).toBeVisible()
    fireEvent.click(screen.getByTestId('onNewVehicleCreated'))

    await waitFor(() => expect(global.fetch).toBeCalledTimes(12))
    expect(global.fetch).nthCalledWith(11, "http://localhost:8080/api/vehicles", 
            {"body": "{\"vehicleNo\":\"JJ 3\"}", 
                "headers": {"Content-type": "application/json"}, "method": "POST", "mode": "cors"})
    expect(global.fetch).nthCalledWith(12, "http://localhost:8080/api/vehicles", {"mode": "cors"})

})