import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Col, Container, Form, InputGroup, ListGroup, Modal, Row } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import remainingQuantity, { decimalPointUomAvailable } from "../utils/quantityUtils";
import { Calendar, Dollar, Suppliers, Tools, Trash } from "../Icons";

function AddSparePartsDialog({isShow, setShowDialog, orders=[], existingOrder=[], suppliers=[], spareParts=[], sparePartUsages=[], onSaveNewOrders}) {
    const formRef = useRef()
    const [validated, setValidated] = useState(false)

    const [isPending, startTransition] = useTransition();

    const defaultItem = {itemCode: '', partName: 'Choose one ...', quantity: 0, unit: 'pc', unitPrice: 0, selectedItemCode: [], selectedSparePart: []};

    const [items, setItems] = useState(existingOrder || [defaultItem])
    const editing = items && items[0]?.deliveryOrderNo

    const [selectedSupplier, setSelectedSupplier] = useState([])
    const [sparePartsSelection, setSparePartsSelection] = useState(spareParts)

    const dialogOpened = () => {
        setSparePartsSelection(spareParts)
    }

    const handleClose = () => {
        setItems([defaultItem])
        setShowDialog(false)
        setSelectedSupplier([])
        setValidated(false)
    }

    const clone = () => {
        setItems(prev => {
            const newItems = prev.map(v => {
                const newItem = {...v}
                delete newItem.id
                delete newItem.deliveryOrderNo
                delete newItem.invoiceDate
                delete newItem.disabled
                return newItem
            })
            return newItems
        })
    }

    const saveChange = () => {
        const nativeForm = formRef.current
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }

        const invoiceDate = nativeForm.querySelector('[name="invoiceDate"]')
        const deliveryOrderNo = nativeForm.querySelector('[name="deliveryOrderNo"]')

        const payload = items.map((v, i) => {
                return {
                    id: v.id,
                    invoiceDate: invoiceDate.value,
                    deliveryOrderNo: deliveryOrderNo.value,
                    supplierId: selectedSupplier[0].id,
                    itemCode: v.selectedItemCode[0]?.itemCode,
                    partName: v.selectedSparePart[0].partName,
                    notes: v.notes,
                    quantity: v.quantity,
                    unit: v.unit,
                    unitPrice: parseFloat(v.unitPrice),
                    totalPrice: v.quantity * v.unitPrice
                }
            })
        
        startTransition(() => {
            onSaveNewOrders(payload, handleClose)
        })
        
    }

    const addNewItem = () => {
        setValidated(false)
        setItems(prev => {
            return [...prev, defaultItem]
        })
    }

    const removeItem = (i) => {
        // you shouldn't change the "prevs" state, such as prevs.splice, it would cause 2-times rendering
        setItems(prevs => {
            const newItems = [...prevs]
            newItems.splice(i, 1)
            return newItems
        })
    }

    const afterChooseSupplier = ([supplier]) => {
        if (supplier) {
            setSelectedSupplier([supplier])
            setSparePartsSelection((spareParts.filter(sp => sp.supplierId === supplier.id)) || spareParts)
        }
        else {
            setSelectedSupplier([])
            setSparePartsSelection(spareParts)
        }
    }

    const afterChooseItemCode = ([sparePart], i) => {
        if (sparePart && suppliers.findIndex(s => s.id === sparePart.supplierId) >= 0) {
            setSelectedSupplier([suppliers.find(s => s.id === sparePart.supplierId)])
        }
        if (sparePart && sparePart.id) {
            delete sparePart.id // we dont want the item.id get replaced
        }
        setItems(prevs => {
            const newItem = [...prevs]
            newItem[i] = {...prevs[i], ...sparePart, 
                selectedSparePart: (sparePart && 
                    spareParts.findIndex(sp => sp.itemCode === sparePart.itemCode) >= 0 
                    && spareParts.filter(sp => sp.itemCode === sparePart.itemCode)) || [...prevs[i].selectedSparePart], 
                selectedItemCode: (sparePart && [sparePart]) || []}
            return newItem
        })
    }
  
    const afterChooseSparePart = ([sparePart], i) => {
        if (sparePart && suppliers.findIndex(s => s.id === sparePart.supplierId) >= 0) {
            setSelectedSupplier([suppliers.find(s => s.id === sparePart.supplierId)])
        }
        if (sparePart && sparePart.id) {
            delete sparePart.id // we dont want the item.id get replaced
        }
        setItems(prevs => {
            const newItem = [...prevs]
            newItem[i] = {...prevs[i], ...sparePart, 
                selectedSparePart: (sparePart && [sparePart]) || [], 
                selectedItemCode: (sparePart && sparePart.itemCode && [sparePart]) || [...prevs[i].selectedItemCode]}
            return newItem
        })
    }

    const updatePriceByQuantity = (val=0, i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...newItems[i], quantity: parseFloat(val)}
            return newItems
        })
    }

    const updatePriceByUnitPrice = (val=0.0, i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...newItems[i], unitPrice: parseFloat(val)}
            return newItems
        })
    }

    const updateUnit = (val, i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...newItems[i], unit: val}
            return newItems
        })
    }

    const updateSelectedSpartPart = (e, idx)  => {
        if (e.target.value) {
            setItems(prevs => {
                const newItems = [...prevs]
                newItems[idx] = {...newItems[idx], selectedSparePart: [{itemCode: '', partName: e.target.value}]}
                return newItems
            })
        }
    }

    const updateSelectedItemCode = (e, idx)  => {
        if (e.target.value) {
            setItems(prevs => {
                const newItems = [...prevs]
                newItems[idx] = {...newItems[idx], selectedItemCode: [{itemCode: e.target.value, partName: ''}]}
                return newItems
            })
        }
    }

    useEffect(() => {
        if (existingOrder && existingOrder.length > 0) {
            setItems(existingOrder.map(v => {
                return {...v, disabled: remainingQuantity(v, sparePartUsages) !== v.quantity, selectedItemCode: (v.itemCode && [{itemCode: v.itemCode}]) || [], selectedSparePart: [{partName: v.partName}]}
            }))
            setSelectedSupplier([suppliers.find(s => s.id === existingOrder[0].supplierId)])
        }
    }, [existingOrder, sparePartUsages, suppliers])

    return (
        <Modal show={isShow} onHide={handleClose} onShow={dialogOpened} backdrop="static" onEscapeKeyDown={(e) => e.preventDefault()} size="xl">
            <Modal.Header closeButton closeVariant="danger">
            <Modal.Title><Tools /> <span>{ editing ? "Update Spare Parts" : "Adding New Spare Parts" }</span></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Row className="mb-3">
                            <Col xs={{span: 6, order: 1}} lg={{span: 3, order: 0}} className="mb-2">
                                <InputGroup>
                                    <InputGroup.Text><Calendar /></InputGroup.Text>
                                    <Form.Control required type="date" name="invoiceDate" max={new Date().toISOString().split('T')[0]}
                                        placeholder="Key in Invoice Date" defaultValue={items[0]?.invoiceDate} disabled={editing}></Form.Control>
                                </InputGroup>
                            </Col>
                            <Col xs={{span: 12, order: 0}} lg={{span: 5, order: 1}} className="mb-2">
                                <InputGroup>
                                    <InputGroup.Text><Suppliers /></InputGroup.Text>
                                    <Typeahead
                                        inputProps={{required:true, name:'supplier'}}
                                        id="supplier-select"
                                        labelKey='supplierName'
                                        options={suppliers}
                                        onChange={(supplier) => afterChooseSupplier(supplier)}
                                        placeholder="Choose a supplier"
                                        selected={selectedSupplier}
                                        disabled={editing}
                                        clearButton
                                        />
                                </InputGroup>
                            </Col>
                            <Col xs={{span: 6, order: 2}} lg={{span: 4, order: 2}} className="text-end">
                                <InputGroup>
                                    <InputGroup.Text><i className="bi bi-file-earmark-spreadsheet"></i></InputGroup.Text>
                                    <Form.Control type="text" required name="deliveryOrderNo" placeholder="Key in DO. #" defaultValue={items[0]?.deliveryOrderNo} disabled={editing}></Form.Control>
                                </InputGroup>
                            </Col>
                        </Row>
                        <Row className="my-3">
                            <Col className="text-end">
                                <Button size="sm" disabled={editing} onClick={addNewItem}><i className="bi bi-plus-circle-fill me-2"></i>Add More</Button>
                            </Col>
                        </Row>
                        
                        <Row>
                        <ListGroup>
                        {items?.map((v, i) =>
                            <ListGroup.Item>
                                <Row>
                                { !editing && <Col xs="1"><span onClick={() => removeItem(i)} role="button" aria-label="remove" className="text-danger"><Trash /></span></Col> }
                                <Col xs={!editing ? 11 : 12}>
                                    <Row>
                                        <Col xs="12" lg="4" className="mb-2">
                                            <InputGroup>
                                            <InputGroup.Text><i className="bi bi-123"></i></InputGroup.Text>
                                            <Typeahead
                                                inputProps={{name: 'itemCode'}}
                                                labelKey='itemCode'
                                                options={sparePartsSelection.filter(v => !!v.itemCode)}
                                                onChange={(opts) => afterChooseItemCode(opts, i)}
                                                placeholder="Key in item code"
                                                clearButton
                                                allowNew
                                                onBlur={(e) => updateSelectedItemCode(e, i)}
                                                selected={v.selectedItemCode}
                                                disabled={v.disabled}
                                                />
                                            </InputGroup>
                                        </Col>
                                        <Col xs="12" lg="8" className="mb-2">
                                            <InputGroup>
                                            <InputGroup.Text><Tools /></InputGroup.Text>
                                            <Typeahead
                                                inputProps={{required: true, name: 'partName'}}
                                                labelKey='partName'
                                                options={sparePartsSelection}
                                                onChange={(opts) => afterChooseSparePart(opts, i)}
                                                placeholder="Find a existing one as template"
                                                renderMenuItemChildren={(option) => 
                                                    <div>
                                                        <div>{option.partName}</div>
                                                        {/** TODO: to add supplier info later on */} 
                                                        <small className="text-secondary">${option?.unitPrice} per {option?.unit} | <Calendar /> {orders.mapping[option.orderId]?.invoiceDate}</small>
                                                    </div>
                                                }
                                                clearButton
                                                allowNew
                                                onBlur={(e) => updateSelectedSpartPart(e, i)}
                                                selected={v.selectedSparePart}
                                                disabled={v.disabled}
                                                />
                                            </InputGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg="4"></Col>
                                        <Col xs="3" lg="2">
                                            <Form.Control onChange={(e) => updatePriceByQuantity(e.target.value, i)} required disabled={v.disabled} type="number" min={decimalPointUomAvailable(v?.unit) ? 0.1 : 1} step={decimalPointUomAvailable(v?.unit) ? 0.1 : 1} name="quantity" placeholder="Quantity" value={v?.quantity}/>
                                        </Col>
                                        <Col xs="3" lg="1">
                                            <Form.Control onChange={(e) => updateUnit(e.target.value, i)} required type="text" name="unit" placeholder="Unit" disabled={v.disabled} value={v?.unit}/>
                                        </Col>
                                        <Col xs="6" lg="3">
                                            <InputGroup>
                                                <InputGroup.Text><Dollar /></InputGroup.Text>
                                                <Form.Control onChange={(e) => updatePriceByUnitPrice(e.target.value, i)} required disabled={v.disabled} type="number" min="0" step="0.01" name="unitPrice" placeholder="Price $" value={v?.unitPrice} />
                                            </InputGroup>
                                        </Col>
                                        <Col xs="12" lg="2" className="text-end">
                                            <span className="fs-4">$ { (Number.isFinite(v.quantity) && Number.isFinite(v.unitPrice)) ? (v.quantity * v.unitPrice).toFixed(2) : 0}</span>
                                        </Col>
                                    </Row>
                                </Col>
                                </Row>
                            </ListGroup.Item>
                        )}
                        <ListGroup.Item key={'total'}><Col className="text-end fs-4">$ {items?.reduce((pv, cv) => pv + ((cv.quantity && cv.unitPrice && cv.quantity * cv.unitPrice) || 0), 0).toFixed(2)}</Col></ListGroup.Item>
                        </ListGroup>
                        </Row>
                    </Form>
                </Container>
            </Modal.Body>
            <Modal.Footer>
            {editing && <Button variant="secondary" onClick={clone} disabled={isPending}>
                <i className="bi bi-copy me-2"></i><span>Clone</span>
            </Button> }
            <Button variant="primary" onClick={saveChange} disabled={isPending || items.filter(it => !!!it.disabled).length === 0}>
                <i className="bi bi-save2 me-2"></i><span>Save</span> 
            </Button>
            </Modal.Footer>
        </Modal>
    )

}

export default AddSparePartsDialog