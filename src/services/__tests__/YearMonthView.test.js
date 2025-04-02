import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import YearMonthView from '../YearMonthView';
import { ScrollSpy } from 'bootstrap';

// Mock OrderTooltip
jest.mock('../OrderTooltip', () => ({ order, supplier }) => (
  <div>OrderTooltip for {order.id} from {supplier.supplierName}</div>
));

// Mock ScrollSpy
jest.mock('bootstrap')

describe('YearMonthView Component', () => {
  const mockServices = {
    current: {
      filterByYearMonthGroupByVehicle(year, month) {
        const allServices = [
          { index: 1, orderId: 1, supplierId: 1, creationDate: '2023-01-01', itemDescription: 'Oil Change', totalPrice: 100, quantity: 2, unit: 'ltr', unitPrice: 50 },
          { index: 2, orderId: 2, supplierId: 2, creationDate: '2023-01-02', itemDescription: 'Tire Replacement', totalPrice: 200, quantity: 4, unit: 'pcs', unitPrice: 50 },
          { index: 3, orderId: 3, supplierId: 1, creationDate: '2023-01-03', itemDescription: 'Brake Pads', totalPrice: 150, quantity: 1, unit: 'set', unitPrice: 150 },
          { index: 4, orderId: 4, supplierId: 2, creationDate: '2023-01-04', itemDescription: 'Filter Change', totalPrice: 50, quantity: 1, unit: 'pcs', unitPrice: 50 }
        ];
        const filtered = allServices.filter(s => {
          const date = new Date(s.creationDate);
          return date.getFullYear() === year && date.getMonth() === month;
        });
        return {
          'Truck A': filtered.slice(0, 1),
          'Truck B': filtered.slice(1, 3),
          'Truck C': filtered.slice(3)
        };
      },
      availableYears() {
        return [2022, 2023, 2024];
      }
    }
  };

  const mockSuppliers = [
    { id: 1, supplierName: 'Supplier A' },
    { id: 2, supplierName: 'Supplier B' }
  ];

  const mockOrders = [
    { id: 1, details: 'Order 1' },
    { id: 2, details: 'Order 2' },
    { id: 3, details: 'Order 3' },
    { id: 4, details: 'Order 4' }
  ];

  const defaultProps = {
    services: mockServices,
    suppliers: mockSuppliers,
    orders: mockOrders,
    backToService: jest.fn()
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

  test('renders component with initial year and month', () => {
    render(<YearMonthView {...defaultProps} />);

    const yearButton = screen.getByRole('button', { name: '2023' });
    expect(yearButton).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Jan' })).toHaveClass('btn-outline-primary');

    expect(screen.getAllByText('Truck A').length).toBe(3);
    expect(screen.getAllByText('Truck B').length).toBe(3);
    expect(screen.getAllByText('Truck C').length).toBe(3);

    expect(screen.getByText('Trucks')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // 3 trucks
    expect(screen.getByText('$ 500.00')).toBeInTheDocument(); // Total amount
    expect(screen.getByText('4')).toBeInTheDocument(); // 4 items
  });

  test('changes year via dropdown', () => {
    render(<YearMonthView {...defaultProps} />);

    const yearButton = screen.getByRole('button', { name: '2023' });
    fireEvent.click(yearButton)

    const yearDropdown = screen.getAllByRole('group')[0];
    const year2022 = within(yearDropdown).getByText('2022');
    fireEvent.click(year2022);

    expect(screen.getAllByRole('button', { name: '2022' })[1]).toBeInTheDocument();
  });

  test('changes month via button', () => {
    render(<YearMonthView {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Jun' }));

    expect(screen.getByRole('button', { name: 'Jun' })).toHaveClass('btn-outline-primary');
  });

  test('calls backToService when Back to Service button is clicked', () => {
    render(<YearMonthView {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Service' }));
    expect(defaultProps.backToService).toHaveBeenCalledTimes(1);
  });

  test('displays vehicle transactions with order and supplier info', () => {
    render(<YearMonthView {...defaultProps} />);

    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('Oil Change')).toBeInTheDocument();
    expect(screen.getByText('OrderTooltip for 1 from Supplier A')).toBeInTheDocument();
    expect(screen.getByText('2 ltr @ $50.00')).toBeInTheDocument();
    expect(screen.getByText('$ 100.00')).toBeInTheDocument();

    expect(screen.getByText('2023-01-02')).toBeInTheDocument();
    expect(screen.getByText('Tire Replacement')).toBeInTheDocument();
    expect(screen.getByText('OrderTooltip for 2 from Supplier B')).toBeInTheDocument();
    expect(screen.getByText('4 pcs @ $50.00')).toBeInTheDocument();
    expect(screen.getByText('$ 200.00')).toBeInTheDocument();

    expect(screen.getByText('2023-01-04')).toBeInTheDocument();
    expect(screen.getByText('Filter Change')).toBeInTheDocument();
    expect(screen.getByText('OrderTooltip for 4 from Supplier B')).toBeInTheDocument();
    expect(screen.getByText('1 pcs @ $50.00')).toBeInTheDocument();
    expect(screen.getByText('$ 50.00')).toBeInTheDocument();
  });

  test('displays top 3 vehicles by amount in summary', () => {
    render(<YearMonthView {...defaultProps} />);

    const summaryCard = screen.getByText('Top 3:').closest('.card-body');
    const withinSummary = within(summaryCard);

    expect(withinSummary.getByText('Truck B')).toBeInTheDocument();
    expect(withinSummary.getByText('$350.00')).toBeInTheDocument();
    expect(withinSummary.getByText('Truck C')).toBeInTheDocument();
    expect(withinSummary.getByText('$50.00')).toBeInTheDocument();
    expect(withinSummary.getByText('Truck A')).toBeInTheDocument();
    expect(withinSummary.getByText('$100.00')).toBeInTheDocument();
  });
});