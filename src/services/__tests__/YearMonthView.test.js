import React from 'react';
import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react';
import YearMonthView from '../YearMonthView';
import { ScrollSpy } from 'bootstrap';
import { wait } from '@testing-library/user-event/dist/cjs/utils/index.js';

// Mock OrderTooltip
jest.mock('../OrderTooltip', () => ({ order, supplier }) => (
  <div>OrderTooltip for {order.id} from {supplier.supplierName}</div>
));

// Mock ScrollSpy
jest.mock('bootstrap')

describe('YearMonthView Component', () => {
  const allServices = [
    { index: 1, itemDescription: 'Oil Change', totalPrice: 100, quantity: 2, unit: 'ltr', unitPrice: 50 },
    { index: 2, itemDescription: 'Tire Replacement', totalPrice: 200, quantity: 4, unit: 'pcs', unitPrice: 50 },
    { index: 3, itemDescription: 'Brake Pads', totalPrice: 300, quantity: 2, unit: 'set', unitPrice: 150 },
    { index: 4, itemDescription: 'Filter Change', totalPrice: 160, quantity: 2, unit: 'pcs', unitPrice: 80 },
    { id: 10, orderId: 1, supplierId: 1, creationDate: '2023-01-05', itemDescription: 'Diesel Change',  quantity: 2 },
    { id: 20, orderId: 2, supplierId: 2, creationDate: '2023-01-06', itemDescription: 'Tire Rotation',  quantity: 4 },
    { id: 30, orderId: 3, supplierId: 1, creationDate: '2023-01-07', itemDescription: 'Brake Lining',  quantity: 2 },
    { id: 40, orderId: 4, supplierId: 2, creationDate: '2023-01-08', itemDescription: 'Air Balloon Change',  quantity: 2 }
  ];

  const mockServices = {
    current: {
      filterByYearMonthGroupByVehicle(year, month) {
        return {
          'Truck A': [ { creationDate: '2023-01-01', sparePartUsages: allServices.slice(4, 5), migratedHandWrittenSpareParts: allServices.slice(0, 1) } ],
          'Truck B': [ { creationDate: '2023-01-02', sparePartUsages: allServices.slice(5, 7), migratedHandWrittenSpareParts: allServices.slice(1, 3) } ],
          'Truck C': [ { creationDate: '2023-01-03', sparePartUsages: allServices.slice(7), migratedHandWrittenSpareParts: allServices.slice(3, 4) } ]
        };
      },
      updateTransaction(ws) {

      },
      availableYears() {
        return [2022, 2023, 2024];
      },
      transactions: [{ creationDate: '2023-01-01', sparePartUsages: allServices.slice(4, 5), migratedHandWrittenSpareParts: allServices.slice(0, 1) },
        { creationDate: '2023-01-02', sparePartUsages: allServices.slice(5, 7), migratedHandWrittenSpareParts: allServices.slice(1, 3) },
        { creationDate: '2023-01-03', sparePartUsages: allServices.slice(7), migratedHandWrittenSpareParts: allServices.slice(3, 4) }
      ]
    }
  };

  const mockSuppliers = [
    { id: 1, supplierName: 'Supplier A' },
    { id: 2, supplierName: 'Supplier B' }
  ];

  const mockOrders = [
    { id: 1, details: 'Order 1', supplierId: 1, unit: 'ltr', unitPrice: 35 },
    { id: 2, details: 'Order 2', supplierId: 2, unit: 'pcs', unitPrice: 60 },
    { id: 3, details: 'Order 3', supplierId: 1, unit: 'set',  unitPrice: 150 },
    { id: 4, details: 'Order 4', supplierId: 2, unit: 'pcs', unitPrice: 80 }
  ];

  const defaultProps = {
    services: mockServices,
    suppliers: mockSuppliers,
    orders: {listing: mockOrders, mapping: mockOrders.reduce((acc, curr) => {acc[curr.id] = curr; return acc}, {})},
    backToService: jest.fn(),
    setFilteredServices: jest.fn()
  };

  beforeAll(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2023-01-01')); // June 15, 2023
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    ScrollSpy.mockClear(); // Clear ScrollSpy mock calls between tests
  });

  test('renders component with initial year and month', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ok: true, 
      json: () => Promise.resolve([])}));
    render(<YearMonthView {...defaultProps} />);

    await waitFor(() => {
      const yearButton = screen.getAllByRole('button', { name: '2023' });
      expect(yearButton[1]).toBeInTheDocument();

      expect(screen.getAllByRole('button', { name: 'Jan' })[1]).toHaveClass('btn-outline-primary');

      expect(screen.getAllByText('Truck A').length).toBe(3);
      expect(screen.getAllByText('Truck B').length).toBe(3);
      expect(screen.getAllByText('Truck C').length).toBe(3);

      expect(screen.getByText('Trucks')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 trucks
      expect(screen.getByText('$ 1530.00')).toBeInTheDocument(); // Total amount
      expect(screen.getByText('8')).toBeInTheDocument(); // 4 items
    })
  });

  test('changes month via button', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ok: true, 
      json: () => Promise.resolve([])}));
    render(<YearMonthView {...defaultProps} />);

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', {current: 'Jun'}));

      expect(screen.getByRole('button', { current: 'Jun' })).toHaveClass('btn-outline-primary');
    })
  });

  test('calls backToService when Back to Service button is clicked', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ok: true, 
      json: () => Promise.resolve([])}));
    render(<YearMonthView {...defaultProps} />);

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Back to Service' }));
      expect(defaultProps.backToService).toHaveBeenCalledTimes(1);
    })
  });

  test('displays vehicle transactions with order and supplier info', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ok: true, 
      json: () => Promise.resolve([])}));
    render(<YearMonthView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByText('2023-01-01').length).toBe(2)
      expect(screen.getByText('Oil Change')).toBeInTheDocument();
      expect(screen.getByText('OrderTooltip for 1 from Supplier A')).toBeInTheDocument();
      expect(screen.getByText('2 ltr @ $50.00')).toBeInTheDocument();
      expect(screen.getByText('$ 100.00')).toBeInTheDocument();

      expect(screen.getAllByText('2023-01-02').length).toBe(4)
      expect(screen.getByText('Tire Replacement')).toBeInTheDocument();
      expect(screen.getByText('OrderTooltip for 2 from Supplier B')).toBeInTheDocument();
      expect(screen.getByText('4 pcs @ $50.00')).toBeInTheDocument();
      expect(screen.getByText('$ 200.00')).toBeInTheDocument();

      expect(screen.getAllByText('2023-01-03').length).toBe(2)
      expect(screen.getByText('Filter Change')).toBeInTheDocument();
      expect(screen.getByText('OrderTooltip for 4 from Supplier B')).toBeInTheDocument();
      expect(screen.getByText('2 ltr @ $35.00')).toBeInTheDocument();
      expect(screen.getByText('$ 70.00')).toBeInTheDocument();
    })
  });

  test('displays top 3 vehicles by amount in summary', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ok: true, 
      json: () => Promise.resolve([])}));
    render(<YearMonthView {...defaultProps} />)

    await waitFor(() => {
      const summaryCard = screen.getByText('Top 3:').closest('.card-body');
      const withinSummary = within(summaryCard);

      expect(withinSummary.getByText('Truck B')).toBeInTheDocument();
      expect(withinSummary.getByText('$1040.00')).toBeInTheDocument();
      expect(withinSummary.getByText('Truck C')).toBeInTheDocument();
      expect(withinSummary.getByText('$320.00')).toBeInTheDocument();
      expect(withinSummary.getByText('Truck A')).toBeInTheDocument();
      expect(withinSummary.getByText('$170.00')).toBeInTheDocument();
    })
  });
});