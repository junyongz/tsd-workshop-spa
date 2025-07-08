import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddSparePartsDialog from '../AddSparePartsDialog';
import SupplierOrders from '../SupplierOrders';
import { SupplierOrderContext, SupplierOrderProvider } from '../SupplierOrderContextProvider';

describe('AddSparePartsDialog Component', () => {
  const mockSuppliers = [
    { id: 1, supplierName: 'Supplier A' },
    { id: 2, supplierName: 'Supplier B' }
  ];

  const mockOrders = [
    { id: 1, supplierId: 1, invoiceDate: '2023-01-01', itemCode: 'ABC123', partName: 'Engine Oil', unitPrice: 50, unit: 'ltr'},
    { id: 2, supplierId: 2, invoiceDate: '2023-01-02', itemCode: 'XYZ789', partName: 'Tire', unitPrice: 75, unit: 'pcs' }
  ];

  const mockSparePartUsages = [
    { orderId: 1, quantity: 5 }
  ];

  const defaultProps = {
    isShow: true,
    setShowDialog: jest.fn(),
    existingOrder: undefined,
    suppliers: mockSuppliers,
    sparePartUsages: mockSparePartUsages,
    onSaveNewOrders: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dialog with initial state', () => {
    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}><AddSparePartsDialog {...defaultProps} /></SupplierOrderContext>);

    fireEvent.click(screen.getByText('Add More'));

    expect(screen.getByText('Adding New Spare Parts')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Choose a supplier')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Key in DO. #')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Key in item code')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Find a existing one as template')).toBeInTheDocument();
    expect(screen.getByText('Add More')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('closes dialog and resets state', () => {
    const setShowDialog = jest.fn();
    render(<AddSparePartsDialog {...defaultProps} setShowDialog={setShowDialog} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(setShowDialog).toHaveBeenCalledWith(false);
  });

  test('adds new item', () => {
    render(<AddSparePartsDialog {...defaultProps} />);

    expect(document.querySelectorAll('.list-group-item').length).toBe(1) // Subtract total row
    fireEvent.click(screen.getByText('Add More'));
    expect(document.querySelectorAll('.list-group-item').length).toBe(2)
  });

  test('removes an item', () => {
    render(<AddSparePartsDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Add More')); // Add a second item

    expect(document.querySelectorAll('.list-group-item').length).toBe(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'remove' })[0]); // Remove first item
    fireEvent.click(screen.getAllByRole('button', { name: 'remove' })[0]); // to click 1 more time
    expect(document.querySelectorAll('.list-group-item').length).toBe(1)
  });

  test('updates supplier and filters spare parts', async () => {
    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}><AddSparePartsDialog {...defaultProps} /></SupplierOrderContext>);

    const supplierInput = screen.getByPlaceholderText('Choose a supplier');
    fireEvent.click(supplierInput);
    fireEvent.change(supplierInput, { target: { value: 'Supplier A' } });
    await waitFor(() => {
      const supplierOption = screen.getByText('Supplier A');
      fireEvent.click(supplierOption);
    });

    expect(supplierInput).toHaveValue('Supplier A');
    fireEvent.click(screen.getByText('Add More'));

    // Check spare part options are filtered
    const sparePartInput = screen.getByPlaceholderText('Find a existing one as template');
    fireEvent.click(sparePartInput);
    await waitFor(() => {
      expect(screen.getByText('Engine Oil')).toBeInTheDocument();
      expect(screen.queryByText('Tire')).not.toBeInTheDocument();
    });
  });

  test('selects item code and updates supplier', async () => {
    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}><AddSparePartsDialog {...defaultProps} /></SupplierOrderContext>);

    fireEvent.click(screen.getByText('Add More'));

    const itemCodeInput = screen.getByPlaceholderText('Key in item code');
    fireEvent.click(itemCodeInput);
    fireEvent.change(itemCodeInput, { target: { value: 'ABC123' } });
    await waitFor(() => {
      const itemCodeOption = screen.getByText('ABC123');
      fireEvent.click(itemCodeOption);
    });

    expect(screen.getByPlaceholderText('Choose a supplier')).toHaveValue('Supplier A');
    expect(itemCodeInput).toHaveValue('ABC123');
  });

  test('selects spare part and updates supplier', async () => {
    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}><AddSparePartsDialog {...defaultProps} /></SupplierOrderContext>);

    fireEvent.click(screen.getByText('Add More'));

    const sparePartInput = screen.getByPlaceholderText('Find a existing one as template');
    fireEvent.click(sparePartInput);
    fireEvent.change(sparePartInput, { target: { value: 'Tire' } });
    await waitFor(() => {
      const sparePartOption = screen.getByText('Tire');
      fireEvent.click(sparePartOption);
    });

    expect(screen.getByPlaceholderText('Choose a supplier')).toHaveValue('Supplier B');
    expect(sparePartInput).toHaveValue('Tire');
  });

  test('updates quantity and unit price', () => {
    render(<AddSparePartsDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Add More'));

    const quantityInput = screen.getByPlaceholderText('Quantity');
    fireEvent.change(quantityInput, { target: { value: '5' } });

    const unitPriceInput = screen.getByPlaceholderText('Price $');
    fireEvent.change(unitPriceInput, { target: { value: '10' } });

    expect(quantityInput).toHaveValue(5);
    expect(unitPriceInput).toHaveValue(10);
    expect(screen.getAllByText('$ 50.00').length).toEqual(2)
  });

  test('validates form and prevents save on invalid input', async () => {
    render(<AddSparePartsDialog {...defaultProps} />);

    const addMoreButton = screen.getByText('Add More')
    fireEvent.click(addMoreButton)

    fireEvent.click(screen.getByText('Save'));
    expect(screen.getByPlaceholderText('Find a existing one as template').closest('form')).toHaveClass('was-validated');
    expect(defaultProps.onSaveNewOrders).not.toHaveBeenCalled();
  });

  test('saves valid form data', async () => {
    render(<SupplierOrderContext value={new SupplierOrders(mockOrders, jest.fn())}><AddSparePartsDialog {...defaultProps} /></SupplierOrderContext>);

    fireEvent.change(screen.getByPlaceholderText('Key in Invoice Date'), { target: { value: '2023-01-01' } });
    const supplierInput = screen.getByPlaceholderText('Choose a supplier');
    fireEvent.click(supplierInput);
    fireEvent.change(supplierInput, { target: { value: 'Supplier A' } });
    await waitFor(() => {
      fireEvent.click(screen.getByText('Supplier A'));
    });
    fireEvent.change(screen.getByPlaceholderText('Key in DO. #'), { target: { value: 'DO123' } });

    const addMoreButton = screen.getByText('Add More')
    fireEvent.click(addMoreButton)

    const sparePartInput = screen.getByPlaceholderText('Find a existing one as template');
    fireEvent.click(sparePartInput);
    fireEvent.change(sparePartInput, { target: { value: 'Engine Oil' } });
    await waitFor(() => {
      fireEvent.click(screen.getByText('Engine Oil'));
    });
    fireEvent.change(screen.getByPlaceholderText('Quantity'), { target: { value: '5' } });
    fireEvent.change(screen.getByPlaceholderText('Price $'), { target: { value: '50' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(defaultProps.onSaveNewOrders).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            invoiceDate: '2023-01-01',
            deliveryOrderNo: 'DO123',
            supplierId: 1,
            itemCode: 'ABC123',
            partName: 'Engine Oil',
            quantity: 5,
            unit: 'ltr',
            unitPrice: 50,
            totalPrice: 250
          })
        ]),
        expect.any(Function)
      );
    });
  });

  test('saves valid form data, using "onblur"', async () => {
    const user = userEvent.setup()

    render(<AddSparePartsDialog {...defaultProps} />);

    await user.click(screen.getByPlaceholderText('Key in Invoice Date'))
    await user.keyboard('2023-01-01')

    await user.click(screen.getByPlaceholderText('Choose a supplier'))
    await user.click(screen.getByText('Supplier A'))

    await user.click(screen.getByPlaceholderText('Key in DO. #'))
    await user.keyboard('DO123')

    await user.click(screen.getByText('Add More'))
    await user.click(screen.getByPlaceholderText('Find a existing one as template'))
    await user.keyboard('Engine Oil')

    await user.click(screen.getByPlaceholderText('Quantity'))
    await user.keyboard('5')

    // replace the default 'pc'
    await user.dblClick(screen.getByPlaceholderText('Unit'))
    await user.keyboard('ltr')

    await user.click(screen.getByPlaceholderText('Price $'))
    await user.keyboard('50')

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(defaultProps.onSaveNewOrders).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            invoiceDate: '2023-01-01',
            deliveryOrderNo: 'DO123',
            supplierId: 1,
            partName: 'Engine Oil',
            quantity: 5,
            unit: 'ltr',
            unitPrice: 50,
            totalPrice: 250
          })
        ]),
        expect.any(Function)
      );
    });
  });

  test('renders existing order in edit mode with disabled fields', () => {
    const existingOrder = [{
      id: 1,
      invoiceDate: '2023-01-01',
      deliveryOrderNo: 'DO123',
      supplierId: 1,
      itemCode: 'ABC123',
      partName: 'Engine Oil',
      quantity: 10,
      unit: 'ltr',
      unitPrice: 50
    }];
    render(<AddSparePartsDialog {...defaultProps} existingOrder={existingOrder} />);

    expect(screen.getByText('Update Spare Parts')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Key in Invoice Date')).toHaveValue('2023-01-01');
    expect(screen.getByPlaceholderText('Choose a supplier')).toHaveValue('Supplier A');
    expect(screen.getByPlaceholderText('Key in DO. #')).toHaveValue('DO123');
    expect(screen.getByPlaceholderText('Key in item code')).toHaveValue('ABC123');
    expect(screen.getByPlaceholderText('Find a existing one as template')).toHaveValue('Engine Oil');
    expect(screen.getByPlaceholderText('Quantity')).toHaveValue(10);
    expect(screen.getByPlaceholderText('Price $')).toHaveValue(50);

    expect(screen.getByPlaceholderText('Key in item code')).toBeDisabled();
    expect(screen.getByPlaceholderText('Find a existing one as template')).toBeDisabled();
    expect(screen.getByPlaceholderText('Quantity')).toBeDisabled();
    expect(screen.getByPlaceholderText('Price $')).toBeDisabled();
    expect(screen.getByText('Add More')).toBeDisabled();
    expect(screen.getByText('Clone')).toBeInTheDocument();
  });

  test('renders existing order with full quantity available', () => {
    const existingOrder = [{
      id: 2,
      invoiceDate: '2023-01-02',
      deliveryOrderNo: 'DO456',
      supplierId: 2,
      itemCode: 'XYZ789',
      partName: 'Tire',
      quantity: 8,
      unit: 'pcs',
      unitPrice: 75
    }];
    render(<AddSparePartsDialog {...defaultProps} existingOrder={existingOrder} />);

    expect(screen.getByPlaceholderText('Key in item code')).toHaveValue('XYZ789');
    expect(screen.getByPlaceholderText('Find a existing one as template')).toHaveValue('Tire');
    expect(screen.getByPlaceholderText('Quantity')).toHaveValue(8);
    expect(screen.getByPlaceholderText('Price $')).toHaveValue(75);

    expect(screen.getByPlaceholderText('Key in item code')).not.toBeDisabled();
    expect(screen.getByPlaceholderText('Find a existing one as template')).not.toBeDisabled();
    expect(screen.getByPlaceholderText('Quantity')).not.toBeDisabled();
    expect(screen.getByPlaceholderText('Price $')).not.toBeDisabled();
  });
});