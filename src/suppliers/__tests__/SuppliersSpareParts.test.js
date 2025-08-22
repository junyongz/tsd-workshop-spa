import { test, expect, jest, afterEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor, createEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SuppliersSpareParts from '../SuppliersSpareParts';  
import SupplierOrders from '../SupplierOrders';
import { SupplierOrderContext, SupplierOrderProvider } from '../SupplierOrderContextProvider';

// Mock dependencies
jest.mock('../../utils/getPaginationItems', () => () => [<div key="1">Pagination</div>]);
jest.mock('../AddSparePartsDialog', () => 
    ({onSaveNewOrders, existingOrder}) => <div role="dialog">
        <span>AddSparePartsDialog</span>
        <span data-testid="add-spare-parts" onClick={(e) => onSaveNewOrders(e.target.orders, () => {})}></span>
        { existingOrder?.map(v => <span key={v.id}>{v.partName}</span>) }
      </div>
);

jest.mock('../SparePartsUsageDialog', () => () => <div>SparePartsUsageDialog</div>);
jest.mock('../NoteTakingDialog', () => () => <div>NoteTakingDialog</div>);
jest.mock('../SupplierSparePartsYearMonthView', () => ({backToOrders}) => 
  <div data-testid="back-to-orders" onClick={backToOrders}>SupplierSparePartsYearMonthView</div>
)

// Mock fetch globally
global.fetch = jest.fn();
global.matchMedia = jest.fn();

jest.useFakeTimers()

/** @type {import('../SupplierOrders').SupplierOrder[]} */
const mockOrders = [
  {id:1001, invoiceDate:"2023-01-01", supplierId:2000,
    itemCode:"ABC123", partName:"Engine Oil", quantity:10, unit:"ltr", unitPrice:5,
    deliveryOrderNo:"DO001", status:"ACTIVE"},
  {id:1002, invoiceDate:"2023-01-02", supplierId:2001,
    itemCode:"XYZ789", partName:"Air Filter", quantity:5, unit:"pcs", unitPrice:15,
    deliveryOrderNo:"DO002", status:"ACTIVE"},
  {id:1003, invoiceDate:"2023-01-03", supplierId:2000, sheetName: 'JUL 23',
    itemCode:"DEF456", partName:"Brake Pads", quantity:8, unit:"set", unitPrice:25,
    deliveryOrderNo:"DO003", status:"ACTIVE", sparePartId: 300003},
  {id:1004, invoiceDate:"2023-01-03", supplierId:2000, sheetName: 'JUL 23',
    itemCode:"777888A", partName:"Brake Adjuster", quantity:4, unit: "pc", unitPrice:215,
    deliveryOrderNo:"DO003", status:"ACTIVE"}
];

const mockSuppliers = [
    { id: 2000, supplierName: 'Han Seng' },
    { id: 2001, supplierName: 'PNB Precision' },
    { id: 2002, supplierName: 'Aik Leong' }
]; 

afterEach(() => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
})
afterAll(() => {
  jest.useRealTimers()
})

let defaultProps;
beforeEach(() => {
  global.matchMedia.mockReturnValue({
      refCount: 0,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      matches: false,           // Added for completeness, can be adjusted
      media: '(min-width: 768px)', // Default media query, can be adjusted
      onchange: null            // Added for completeness
  })

  defaultProps = {
      setFilteredOrders: jest.fn(),
      selectedSearchOptions: [],
      filterServices: jest.fn(),
      suppliers: [...mockSuppliers],
      vehicles: [],
      sparePartUsages: [],
      refreshSparePartUsages: jest.fn(),
      refreshServices: jest.fn(),
      onNewVehicleCreated: jest.fn(),
      setLoading: jest.fn(),
      showToastMessage: (msg) => console.error(msg),
      setTotalFilteredOrders: jest.fn()
  };
});

test('renders component with no orders', () => {
  const container = render(<SupplierOrderContext value={new SupplierOrders([], jest.fn())}><SuppliersSpareParts {...defaultProps} /></SupplierOrderContext>);
  
  expect(screen.getByText('Add New')).toBeInTheDocument();
  expect(screen.getByText('Showing All')).toBeInTheDocument();
  expect(screen.getByText('...')).toBeInTheDocument();

  container.unmount()
});

test('renders multiple orders correctly', async () => {
  const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})

  const container = render(<SupplierOrderProvider initialOrders={mockOrders}>
        <SuppliersSpareParts {...defaultProps} /></SupplierOrderProvider>);
  
  expect(screen.queryByText('2023-01-01')).toBeInTheDocument();
  expect(screen.queryByText('2023-01-02')).toBeInTheDocument();
  expect(screen.queryAllByText('2023-01-03')).toHaveLength(2)
  
  expect(screen.queryByText('Engine Oil')).toBeInTheDocument();
  expect(screen.queryByText('Air Filter')).toBeInTheDocument();
  expect(screen.queryByText('Brake Pads')).toBeInTheDocument();
  
  expect(screen.queryAllByText('Han Seng')).toHaveLength(3)
  expect(screen.queryByText('PNB Precision')).toBeInTheDocument();

  await user.click(screen.getByLabelText('view order DO001'))
  expect(screen.getByRole('dialog').querySelectorAll('span')[2]).toHaveTextContent('Engine Oil')

  container.unmount()
});

test('opens Add Spare Parts dialog when clicking Add New button', async () => {
  const container = render(<SupplierOrderContext value={new SupplierOrders([...mockOrders], jest.fn())}><SuppliersSpareParts {...defaultProps} /></SupplierOrderContext>);
  
  fireEvent.click(screen.getByText('Add New'));
  expect(screen.getByText('AddSparePartsDialog')).toBeInTheDocument();

  container.unmount()
});

test('handles supplier filter click with multiple orders', async () => {
  const container = render(<SupplierOrderContext value={new SupplierOrders([...mockOrders], jest.fn())}><SuppliersSpareParts {...defaultProps} /></SupplierOrderContext>);
  
  fireEvent.click(screen.getByText('Showing All'));
  expect(screen.getByText('Suppliers')).toBeInTheDocument();
  
  fireEvent.click(Array.from(document.querySelectorAll('.nav-link'))
    .filter(el => el.textContent === 'Han Seng')[0]);
  await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(3))
  
  container.unmount()
});

test('calls recordUsage for specific order', () => {
  const container = render(<SupplierOrderContext value={new SupplierOrders([...mockOrders], jest.fn())}><SuppliersSpareParts {...defaultProps} /></SupplierOrderContext>);
  
  const usageButtons = document.querySelectorAll('.bi-truck')
  expect(usageButtons.length).toBe(4);
  
  fireEvent.click(usageButtons[1]);
  expect(screen.getByText('SparePartsUsageDialog')).toBeInTheDocument();
  
  container.unmount()
});

test('handles removal of specific order', async () => {
  global.fetch
  .mockResolvedValueOnce({ ok: true })
  .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({status: "500", reason: "database down"}) });  
  
  const container = render(<SupplierOrderProvider initialOrders={[...mockOrders]}><SuppliersSpareParts {...defaultProps} /></SupplierOrderProvider>);
  
  let deleteButtons = document.querySelectorAll('.bi-trash3')
  expect(deleteButtons.length).toBe(2);
  
  fireEvent.click(deleteButtons[0]);
  fireEvent.click(screen.getAllByRole('button', { name: 'remove' })[0]);
  
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/supplier-spare-parts/1001',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(defaultProps.setLoading).toHaveBeenCalledTimes(2);
  });

  deleteButtons = document.querySelectorAll('.bi-trash3')
  expect(deleteButtons.length).toBe(1)

  // delete and failed
  const consoleError = jest.spyOn(console, 'error')
  fireEvent.click(deleteButtons[0])
  fireEvent.click(screen.getAllByRole('button', { name: 'remove' })[0]);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/supplier-spare-parts/1002',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(defaultProps.setLoading).toHaveBeenCalledTimes(4);
  });

  expect(consoleError).toBeCalledWith("failed to delete order {\"id\":1002,\"invoiceDate\":\"2023-01-02\",\"supplierId\":2001,\"itemCode\":\"XYZ789\",\"partName\":\"Air Filter\",\"quantity\":5,\"unit\":\"pcs\",\"unitPrice\":15,\"deliveryOrderNo\":\"DO002\",\"status\":\"ACTIVE\"} because: {\"status\":\"500\",\"reason\":\"database down\"}")

  container.unmount()
});

test('handles API POST for new orders', async () => {
  const newOrders = [
    { id: 1004, supplierId: 2001 },
    { id: 1005, supplierId: 2001 },
    { id: 1006, supplierId: 2001 }
  ];
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(newOrders)
  })
  .mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({status: 500, code: 'SPP-001', reason: 'already exists'})
  })

  const container = render(
    <SupplierOrderProvider initialOrders={[...mockOrders]}>
      <SuppliersSpareParts {...defaultProps} />
    </SupplierOrderProvider>);
  
  const span = container.getByTestId('add-spare-parts')
  const evt = createEvent.click(span, {target: {orders: newOrders}})
  fireEvent.click(span, evt)
  
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/supplier-spare-parts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newOrders)
      })
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(6)
  });

  container.unmount()
});

test('handles failed fetch for new orders', async () => {
  const newOrders = [
    { id: 1004, supplierId: 2001 },
    { id: 1005, supplierId: 2001 },
    { id: 1006, supplierId: 2001 }
  ];
  global.fetch.mockRejectedValueOnce(new Error("failed to connect database"))

  const container = render(
    <SupplierOrderProvider initialOrders={[...mockOrders]}>
      <SuppliersSpareParts {...defaultProps} />
    </SupplierOrderProvider>);
  
  const consoleError = jest.spyOn(console, 'error')
  const span = container.getByTestId('add-spare-parts')
  const evt = createEvent.click(span, {target: {orders: newOrders}})
  fireEvent.click(span, evt)

  await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/supplier-spare-parts", 
      {"body": "[{\"id\":1004,\"supplierId\":2001},{\"id\":1005,\"supplierId\":2001},{\"id\":1006,\"supplierId\":2001}]", 
        "headers": {"Content-type": "application/json"}, "method": "POST", "mode": "cors"}))
  
  expect(screen.getAllByRole("listitem")).toHaveLength(4)

  expect(consoleError).toBeCalledTimes(1)
  expect(consoleError.mock.calls[0][0]).toEqual('failed to save orders: failed to connect database')

  container.unmount()
});

test('updates filtered orders when selectedSearchOptions change', async () => {
  render(<SupplierOrderContext value={new SupplierOrders([...mockOrders], jest.fn())}><SuppliersSpareParts 
    {...defaultProps}
    selectedSearchOptions={[{name: 'engine'}, {name: 'brake'}]}
  /></SupplierOrderContext>);

  expect(screen.getAllByRole("listitem")).toHaveLength(3)
});

test('displays correct quantities and supplier info for all orders', async () => {
  const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})

  const mockUsages = [
    { id: 110001, orderId: 1001, quantity: 1, usageDate: "2024-01-02", vehicleNo: "JJ 1" },
    { id: 110002, orderId: 1001, quantity: 1, usageDate: "2024-02-02", vehicleNo: "JJ 2" },
    { id: 110003, orderId: 1001, quantity: 1, usageDate: "2024-03-02", vehicleNo: "JJ 3" },
    { id: 110004, orderId: 1001, quantity: 1, usageDate: "2024-01-03", vehicleNo: "JJ 4" },
    { id: 110005, orderId: 1001, quantity: 1, usageDate: "2024-02-12", vehicleNo: "JJ 5" },
    { id: 110006, orderId: 1001, quantity: 2, usageDate: "2024-02-13", vehicleNo: "JJ 6" },
    { id: 110007, orderId: 1001, quantity: 2, usageDate: "2024-03-02", vehicleNo: "JJ 7" },
    { id: 110008, orderId: 1002, quantity: 1, usageDate: "2024-01-02", vehicleNo: "JJ 8" },
    { id: 110009, orderId: 1003, quantity: 8, usageDate: "2024-01-02", vehicleNo: "JJ 9" },
  ];
  
  const container = render(<SupplierOrderContext value={new SupplierOrders([...mockOrders], jest.fn())}>
    <SuppliersSpareParts {...defaultProps} sparePartUsages={mockUsages} /></SupplierOrderContext>);
  
  const quantities = container.getAllByText(/left/);
  expect(quantities).toHaveLength(3)
  expect(screen.getByText('1 left')).toBeInTheDocument();  
  expect(screen.getByText('4 left')).toBeInTheDocument();  
  expect(screen.getByText('0 left')).toBeInTheDocument();

  expect(screen.queryAllByText(/Used by/)).toHaveLength(7)
  expect(Array.from(screen.queryAllByText(/Used by/))
    .map(elem => elem.textContent)
    .map(text => text.replaceAll(/[^\x20-\x7E]/g, ''))) // keep only ascii 32-126
  .toEqual(["Used by JJ 31 2024-03-02", 
    "Used by JJ 72 2024-03-02", 
    "Used by JJ 62 2024-02-13", 
    "Used by JJ 51 2024-02-12", 
    "Used by JJ 21 2024-02-02", 
    "Used by JJ 81 2024-01-02", 
    "Used by JJ 98 2024-01-02"])
  expect(screen.queryByText('Click to load more.')).toBeInTheDocument()

  // load the less of spare part usages
  await user.click(screen.getByText('Click to load more.'))
  expect(screen.queryAllByText(/Used by/)).toHaveLength(9)
  expect(Array.from(screen.queryAllByText(/Used by/))
    .map(elem => elem.textContent)
    .map(text => text.replaceAll(/[^\x20-\x7E]/g, ''))) // keep only ascii 32-126
    .toEqual(["Used by JJ 31 2024-03-02", 
      "Used by JJ 72 2024-03-02", 
      "Used by JJ 62 2024-02-13", 
      "Used by JJ 51 2024-02-12", 
      "Used by JJ 21 2024-02-02", 
      "Used by JJ 41 2024-01-03", 
      "Used by JJ 11 2024-01-02", 
      "Used by JJ 81 2024-01-02", 
      "Used by JJ 98 2024-01-02"])
  
});

test('deplete order and remain 2', async () => {
  const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve([
      { id: 1001, status: 'DEPLETED', supplierId: 2000}
    ])
  })
  .mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({status: 500, code: 'SPP-001', reason: 'Database down for 15minutes'})
  })

  render(
    <SupplierOrderProvider initialOrders={[...mockOrders]}>
      <SuppliersSpareParts {...defaultProps} />
    </SupplierOrderProvider>);

  expect(screen.queryByLabelText('deplete order Engine Oil')).toBeInTheDocument()
  
  await user.click(screen.getByLabelText('deplete order Engine Oil'))
  await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/supplier-spare-parts?op=DEPLETE", 
    {"body": "[{\"id\":1001,\"invoiceDate\":\"2023-01-01\",\"supplierId\":2000,\"itemCode\":\"ABC123\",\"partName\":\"Engine Oil\",\"quantity\":10,\"unit\":\"ltr\",\"unitPrice\":5,\"deliveryOrderNo\":\"DO001\",\"status\":\"ACTIVE\"}]", 
      "headers": {"Content-type": "application/json"}, "method": "POST", "mode": "cors"}))

  expect(screen.getAllByRole("listitem")).toHaveLength(4)
  await waitFor(() => expect(screen.queryByLabelText('deplete order Engine Oil')).not.toBeInTheDocument())
  
  // failed to deplete order
  const consoleError = jest.spyOn(console, 'error')
  await user.click(screen.getByLabelText('deplete order Brake Pads'))
  await waitFor(() => expect(global.fetch).lastCalledWith("http://localhost:8080/api/supplier-spare-parts?op=DEPLETE", 
    {"body": "[{\"id\":1003,\"invoiceDate\":\"2023-01-03\",\"supplierId\":2000,\"sheetName\":\"JUL 23\",\"itemCode\":\"DEF456\",\"partName\":\"Brake Pads\",\"quantity\":8,\"unit\":\"set\",\"unitPrice\":25,\"deliveryOrderNo\":\"DO003\",\"status\":\"ACTIVE\",\"sparePartId\":300003}]", 
      "headers": {"Content-type": "application/json"}, "method": "POST", "mode": "cors"}))

  expect(consoleError).toBeCalledTimes(2)
  expect(consoleError.mock.calls[0][0]).toEqual("failed to deplete order {\"id\":1003,\"invoiceDate\":\"2023-01-03\",\"supplierId\":2000,\"sheetName\":\"JUL 23\",\"itemCode\":\"DEF456\",\"partName\":\"Brake Pads\",\"quantity\":8,\"unit\":\"set\",\"unitPrice\":25,\"deliveryOrderNo\":\"DO003\",\"status\":\"ACTIVE\",\"sparePartId\":300003}")
  expect(consoleError.mock.calls[1][0]).toEqual("failed to update order, response: {\"status\":500,\"code\":\"SPP-001\",\"reason\":\"Database down for 15minutes\"}")
});

test('show supplier in recent order and name ordering', async () => {
  const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})

  render(
    <SupplierOrderProvider initialOrders={[...mockOrders]}>
      <SuppliersSpareParts {...defaultProps} />
    </SupplierOrderProvider>);

  await user.click(screen.getByText('Showing All'))

  expect(document.querySelectorAll('.nav-link')).toHaveLength(5)
  let navLinks = Array.from(document.querySelectorAll('.nav-link')).map(elem => elem.textContent)
  expect(navLinks).toEqual(["By Recent Order", "By Name", "Han Seng", "PNB Precision", "Aik Leong"])

  // change order to by name
  await user.click(screen.getByRole('button', {name: 'By Name'}))
  navLinks = Array.from(document.querySelectorAll('.nav-link')).map(elem => elem.textContent)
  expect(navLinks).toEqual(["By Recent Order", "By Name", "Aik Leong", "Han Seng", "PNB Precision"])

  // click Aik Leong
  await user.click(screen.getByRole('button', {name: 'Aik Leong'}))
  await user.click(screen.getByRole('button', {name: 'Close'}))
  expect(screen.queryAllByRole("listitem")).toHaveLength(0)

  // showing all again
  await user.click(screen.getByText('Showing for Aik Leong'))
  await user.click(screen.getByRole('button', {name: 'Aik Leong'}))
  await user.click(screen.getByRole('button', {name: 'Close'}))
  expect(screen.queryAllByRole("listitem")).toHaveLength(4)

  // by recent order
  await user.click(screen.getByText('Showing All'))
  await user.click(screen.getByRole('button', {name: 'By Recent Order'}))
  navLinks = Array.from(document.querySelectorAll('.nav-link')).map(elem => elem.textContent)
  expect(navLinks).toEqual(["By Recent Order", "By Name", "Han Seng", "PNB Precision", "Aik Leong"])
})

test('overview and un-overview', async () => {
  const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})

  render(
    <SupplierOrderProvider initialOrders={[...mockOrders]}>
      <SuppliersSpareParts {...defaultProps} />
    </SupplierOrderProvider>);

  expect(screen.queryByText('Showing All')).toBeInTheDocument()
  await user.click(screen.getByText('Overview'))
  expect(screen.queryByText('SupplierSparePartsYearMonthView')).toBeInTheDocument()
  expect(screen.queryByText('Showing All')).not.toBeInTheDocument()

  // go back
  await user.click(screen.getByText('SupplierSparePartsYearMonthView'))
  expect(screen.queryByText('Showing All')).toBeInTheDocument()
})

test('hover to view photos of the part', async () => {
  const user = userEvent.setup({advanceTimers: jest.advanceTimersByTime})
  URL.createObjectURL = jest.fn()

  global.fetch.mockResolvedValueOnce({
        ok: true, // /api/spare-parts/${sparePartId}/medias
        json: () => Promise.resolve([{id: 5000, sparePartId: 300003}, {id: 5001, sparePartId: 300003}])
  }).mockResolvedValueOnce({
        ok: true, // /api/spare-parts/${sparePartId}/medias/:mediaId/data
        blob: () => Promise.resolve("")
  }).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve("")
  })

  render(
    <SupplierOrderProvider initialOrders={[...mockOrders]}>
      <SuppliersSpareParts {...defaultProps} />
    </SupplierOrderProvider>);

  await user.hover(screen.getByLabelText('hover to view photos of part 300003'))
  jest.advanceTimersByTime(600)

  await waitFor(() => {
    expect(global.fetch).nthCalledWith(1, 'http://localhost:8080/api/spare-parts/300003/medias')
    expect(global.fetch).nthCalledWith(2, 'http://localhost:8080/api/spare-parts/300003/medias/5000/data')
    expect(global.fetch).nthCalledWith(3, 'http://localhost:8080/api/spare-parts/300003/medias/5001/data')
  })
  expect(screen.queryAllByRole('img')).toHaveLength(2)

  await user.click(screen.getByLabelText('Close'))
  expect(screen.queryAllByRole('img')).toHaveLength(0)

  // hover and unhover, then nothing happen
  await user.hover(screen.getByLabelText('hover to view photos of part 300003'))
  await user.unhover(screen.getByLabelText('hover to view photos of part 300003'))
  jest.advanceTimersByTime(600)

  expect(global.fetch).toBeCalledTimes(3)
})