import { Button, Col, Form, FormLabel, InputGroup, ListGroup, Row } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { Dollar, Suppliers, Tools, Trash } from "../Icons";
import remainingQuantity, { decimalPointUomAvailable } from "../utils/quantityUtils";

export default function SparePartsSubDialog({
    items, setItems, spareParts, orders, suppliers, sparePartUsages
}) {
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
                    <Col xs="12" lg="6" className="mb-3 mb-lg-0">
                        <InputGroup>
                        <InputGroup.Text><Tools /></InputGroup.Text>
                        <Typeahead
                            inputProps={{required:true, name: 'partName'}}
                            labelKey={(option) => 
                                `${(option.itemCode && !option.partName.includes(option.itemCode)) ? (option.itemCode + ' ') : ''}${option.partName}`
                            }
                            options={spareParts}
                            onChange={(opts) => afterChooseSparePart(opts, i)}
                            placeholder="Find a spare part..."
                            renderMenuItemChildren={(option) => {
                                const order = orders?.mapping[option.orderId]
                                const supplier = suppliers.find(s => s.id === option.supplierId)
                                const quantityLeft = remainingQuantity(order, sparePartUsages)
                                    
                                if (quantityLeft === 0) {
                                    return;
                                }

                                return <div>
                                    <div>{ order.itemCode && !order.partName.includes(order.itemCode) && <span className='text-secondary'>{order.itemCode}&nbsp;</span> } {option.partName}</div>
                                    {/** TODO: to add supplier info later on */} 
                                    <small className="text-secondary">${option.unitPrice} / {quantityLeft} left / <Suppliers /> {supplier.supplierName} / {order.invoiceDate}</small>
                                </div>
                                }
                            }
                            clearButton
                            selected={v.selectedSpareParts}
                            />
                        </InputGroup>
                    </Col>
                    <Col xs="6" lg="2" className="mb-3 mb-lg-0">
                        <InputGroup>
                            <Form.Control onChange={(e) => updatePriceByQuantity(e.target.value, i)} required step={decimalPointUomAvailable(v?.unit) ? 0.1 : 1} type="number" name="quantity" min="1" max={(v.selectedSpareParts[0] && remainingQuantity(orders?.mapping[v.selectedSpareParts[0].orderId], sparePartUsages)) || 0} placeholder="Quantity" value={v?.quantity}/>
                            <InputGroup.Text>{v?.unit}</InputGroup.Text>
                        </InputGroup>
                    </Col>
                    <Col xs="6" lg="2" className="mb-3 mb-lg-0">
                        <InputGroup>
                            <InputGroup.Text><Dollar /></InputGroup.Text>
                            <Form.Control onChange={(e) => updatePriceByUnitPrice(e.target.value, i)} required type="number" step="0.10" name="unitPrice" placeholder="Price $" value={v?.unitPrice} />
                        </InputGroup>
                    </Col>
                    <Col xs="6" lg="1" className="mb-3 mb-lg-0">
                        <FormLabel className="fs-5 text-end"><span>$&nbsp;{(v?.quantity * v?.unitPrice).toFixed(2) || 0}</span></FormLabel>
                    </Col>
                    <Col xs="6" lg="1" className="text-end">
                    <Button variant="danger" className="fs-5" onClick={() => removeItem(i)}><Trash /></Button>
                    </Col>
                </Row>
            </ListGroup.Item>
            )}
        </ListGroup>
    )
}