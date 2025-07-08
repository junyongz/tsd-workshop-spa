import { Button, Col, Form, FormLabel, InputGroup, ListGroup, Row } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { Dollar, Suppliers, Tools, Trash } from "../Icons";
import remainingQuantity, { decimalPointUomAvailable } from "../utils/quantityUtils";
import { useSupplierOrders } from "../suppliers/SupplierOrderContextProvider";

export default function SparePartsSubDialog({
    items, setItems, suppliers, sparePartUsages, sparePartsMargin
}) {
    const orders = useSupplierOrders()

    const afterChooseSparePart = ([sparePart], i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...prevs[i], ...sparePart, quantity: 1, selectedSpareParts: (sparePart && [sparePart]) || []}
            return newItems
        })
    }

    const updatePriceByQuantity = (val, i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...newItems[i], quantity: val}
            return newItems
        })
    }

    const updatePriceByUnitPrice = (val, i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...newItems[i], unitPrice: val}
            return newItems
        })
    }

    const removeItem = (i) => {
        setItems(prev => {
            const newItems = [...prev]
            newItems.splice(i, 1)
            return newItems
        })
    }

    return (
        <ListGroup>
            {items?.map((v, i) =>
            <ListGroup.Item key={i}>
                <Row>                                
                    <Col xs="12" xl="6" className="mb-3 mb-xl-0">
                        <InputGroup>
                        <InputGroup.Text><Tools /></InputGroup.Text>
                        <Typeahead
                            inputProps={{required:true, name: 'partName'}}
                            labelKey={(option) => 
                                `${(option.itemCode && !option.partName.includes(option.itemCode)) ? (option.itemCode + ' ') : ''}${option.partName}`
                            }
                            options={orders.list().filter(mo => remainingQuantity(mo, sparePartUsages) > 0).filter(mo => mo.status === 'ACTIVE')}
                            onChange={(opts) => afterChooseSparePart(opts, i)}
                            placeholder="Find a spare part..."
                            renderMenuItemChildren={(order) => {
                                const supplier = suppliers.find(s => s.id === order.supplierId)
                                const quantityLeft = remainingQuantity(order, sparePartUsages)

                                return <div>
                                    <div>{ order.itemCode && !order.partName.includes(order.itemCode) && <span className='text-secondary'>{order.itemCode}&nbsp;</span> } {order.partName}</div>
                                    <small className="text-secondary">${order.unitPrice} / {quantityLeft} left / <Suppliers /> {supplier.supplierName} / {order.invoiceDate}</small>
                                </div>
                                }
                            }
                            clearButton
                            selected={v.selectedSpareParts}
                            />
                        </InputGroup>
                    </Col>
                    <Col xs="6" xl="2" className="mb-3 mb-xl-0">
                        <InputGroup>
                            <Form.Control onChange={(e) => updatePriceByQuantity(e.target.value, i)} required step={decimalPointUomAvailable(v?.unit) ? 0.1 : 1} type="number" name="quantity" min="1" max={(v.selectedSpareParts[0] && remainingQuantity(v.selectedSpareParts[0], sparePartUsages)) || 0} placeholder="Quantity" value={v?.quantity}/>
                            <InputGroup.Text>{v?.unit}</InputGroup.Text>
                        </InputGroup>
                    </Col>
                    <Col xs="6" xl="2" className="mb-3 mb-xl-0">
                        <InputGroup>
                            <InputGroup.Text><Dollar /></InputGroup.Text>
                            <Form.Control onChange={(e) => updatePriceByUnitPrice(e.target.value, i)} required type="number" step="0.10" name="unitPrice" placeholder="Price $" value={(v?.unitPrice * (1 + (sparePartsMargin || 0)/100) || 0).toFixed(2)} />
                        </InputGroup>
                    </Col>
                    <Col xs="6" xl="1" className="mb-3 mb-xl-0">
                        <FormLabel className="fs-5 text-end"><span>$&nbsp;{(v?.quantity * v?.unitPrice * (1 + (sparePartsMargin || 0)/100)).toFixed(2) || 0}</span></FormLabel>
                    </Col>
                    <Col xs="6" xl="1" className="text-end">
                    <Button variant="danger" className="fs-5" onClick={() => removeItem(i)}><Trash /></Button>
                    </Col>
                </Row>
            </ListGroup.Item>
            )}
        </ListGroup>
    )
}