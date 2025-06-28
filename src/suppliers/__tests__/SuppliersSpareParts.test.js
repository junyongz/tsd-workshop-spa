import React from 'react';
import { render, screen, fireEvent, waitFor, createEvent } from '@testing-library/react';
import SuppliersSpareParts from '../SuppliersSpareParts';  
import SupplierOrders from '../SupplierOrders';

import { test, expect } from '@jest/globals'

// Mock dependencies
jest.mock('../../utils/getPaginationItems', () => () => [<div key="1">Pagination</div>]);
jest.mock('../AddSparePartsDialog', () => 
    ({onSaveNewOrders}) => <div>AddSparePartsDialog<span data-testid="add-spare-parts" onClick={(e) => onSaveNewOrders(e.target.orders)}></span></div>
);
jest.mock('../SparePartsUsageDialog', () => () => <div>SparePartsUsageDialog</div>);
jest.mock('../NoteTakingDialog', () => () => <div>NoteTakingDialog</div>);
jest.mock('../SparePartNotes', () => () => <div>SparePartNotes</div>);
jest.mock('../../autoRefreshWorker', () => ({ clearState: jest.fn() }));

// Mock fetch globally
global.fetch = jest.fn();
global.matchMedia = jest.fn();

describe('SuppliersSpareParts Component', () => {

  const mockOrders = [
      {
        id: 1,
        invoiceDate: '2023-01-01',
        supplierId: 1,
        itemCode: 'ABC123',
        partName: 'Engine Oil',
        quantity: 10,
        unit: 'ltr',
        unitPrice: 5,
        deliveryOrderNo: 'DO001',
        status: 'ACTIVE'
      },
      {
        id: 2,
        invoiceDate: '2023-01-02',
        supplierId: 2,
        itemCode: 'XYZ789',
        partName: 'Air Filter',
        quantity: 5,
        unit: 'pcs',
        unitPrice: 15,
        deliveryOrderNo: 'DO002',
        status: 'ACTIVE'
      },
      {
        id: 3,
        invoiceDate: '2023-01-03',
        supplierId: 1,
        itemCode: 'DEF456',
        partName: 'Brake Pads',
        quantity: 8,
        unit: 'set',
        unitPrice: 25,
        deliveryOrderNo: 'DO003',
        status: 'ACTIVE'
      }
  ];
  
  const mockSuppliers = [
      { id: 1, supplierName: 'Supplier A' },
      { id: 2, supplierName: 'Supplier B' }
  ]; 

  let defaultProps;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REACT_APP_API_URL = 'http://test-api';
    global.matchMedia.mockReturnValue({
        refCount: 0,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        matches: false,           // Added for completeness, can be adjusted
        media: '(min-width: 768px)', // Default media query, can be adjusted
        onchange: null            // Added for completeness
    })

    defaultProps = {
        orders: [...mockOrders],
        setFilteredOrders: jest.fn(),
        selectedSearchOptions: [],
        filterServices: jest.fn(),
        supplierOrders: {current: new SupplierOrders([...mockOrders], jest.fn())},
        suppliers: [...mockSuppliers],
        spareParts: [],
        vehicles: [],
        sparePartUsages: [],
        refreshSpareParts: jest.fn(),
        refreshSparePartUsages: jest.fn(),
        refreshServices: jest.fn(),
        onNewVehicleCreated: jest.fn(),
        setLoading: jest.fn(),
        showToastMessage: (msg) => console.error(msg),
        setTotalFilteredOrders: jest.fn()
    };
  });

  test('renders component with no orders', () => {
    const container = render(<SuppliersSpareParts {...defaultProps} orders={[]} />);
    
    expect(screen.getByText('Add New')).toBeInTheDocument();
    expect(screen.getByText('Showing All')).toBeInTheDocument();
    expect(screen.getByText('...')).toBeInTheDocument();

    container.unmount()
  });

  test('renders multiple orders correctly', () => {
    const container = render(<SuppliersSpareParts {...defaultProps} />);
    
    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('2023-01-02')).toBeInTheDocument();
    expect(screen.getByText('2023-01-03')).toBeInTheDocument();
    
    expect(screen.getByText('Engine Oil')).toBeInTheDocument();
    expect(screen.getByText('Air Filter')).toBeInTheDocument();
    expect(screen.getByText('Brake Pads')).toBeInTheDocument();
    
    expect(screen.getAllByText('Supplier A').length).toBe(2);
    expect(screen.getByText('Supplier B')).toBeInTheDocument();

    container.unmount()
  });

  test('opens Add Spare Parts dialog when clicking Add New button', async () => {
    const container = render(<SuppliersSpareParts {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Add New'));
    expect(screen.getByText('AddSparePartsDialog')).toBeInTheDocument();

    container.unmount()
  });

  test('handles supplier filter click with multiple orders', async () => {
    const container = render(<SuppliersSpareParts {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Showing All'));
    expect(screen.getByText('Suppliers')).toBeInTheDocument();
    
    fireEvent.click(Array.from(document.querySelectorAll('.nav-link'))
      .filter(el => el.textContent === 'Supplier A')[0]);
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(2))
    
    container.unmount()
  });

  test('calls recordUsage for specific order', () => {
    const container = render(<SuppliersSpareParts {...defaultProps} />);
    
    const usageButtons = document.querySelectorAll('.bi-truck')
    expect(usageButtons.length).toBe(3);
    
    fireEvent.click(usageButtons[1]);
    expect(screen.getByText('SparePartsUsageDialog')).toBeInTheDocument();
    
    container.unmount()
  });

  test('handles removal of specific order', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true });
    
    const container = render(<SuppliersSpareParts {...defaultProps} />);
    
    const deleteButtons = document.querySelectorAll('.bi-trash3')
    expect(deleteButtons.length).toBe(3);
    
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'remove' })[0]);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api/api/supplier-spare-parts/1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(defaultProps.setLoading).toHaveBeenCalledTimes(2);
    });

    container.unmount()
  });

  test('handles API POST for new orders', async () => {
    const newOrders = [
      { id: 4, supplierId: 1 },
      { id: 5, supplierId: 2 },
      { id: 6, supplierId: 1 }
    ];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newOrders)
    });
    
    const container = render(<SuppliersSpareParts {...defaultProps} />);
    
    const span = container.getByTestId('add-spare-parts')
    const evt = createEvent.click(span, {target: {orders: newOrders}})
    fireEvent.click(span, evt)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api/api/supplier-spare-parts',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newOrders)
        })
      );
      expect(defaultProps.refreshSpareParts).toHaveBeenCalled();
      expect(defaultProps.supplierOrders.current.list()).toHaveLength(6);
    });

    container.unmount()
  });

  test('updates filtered orders when selectedSearchOptions change', async () => {
    render(<SuppliersSpareParts 
      {...defaultProps}
      selectedSearchOptions={[{name: 'engine'}, {name: 'brake'}]}
    />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2)
  });

  test('displays correct quantities and supplier info for all orders', () => {
    const mockUsages = [
      { orderId: 1, quantity: 1 },
      { orderId: 2, quantity: 1 },
      { orderId: 3, quantity: 1 }
    ];
    
    const container = render(<SuppliersSpareParts 
      {...defaultProps} 
      sparePartUsages={mockUsages}
    />);
    
    const quantities = container.getAllByText(/left/);
    expect(quantities.length).toBe(3);
    expect(screen.getByText('9 left')).toBeInTheDocument();  
    expect(screen.getByText('4 left')).toBeInTheDocument();  
    expect(screen.getByText('7 left')).toBeInTheDocument();  
  });
});