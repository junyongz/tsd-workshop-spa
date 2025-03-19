import { useRef, useState, useTransition } from "react";
import { Button, Col, Container, Form, InputGroup, ListGroup, Modal, Row } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";

function AddSparePartsDialog({isShow, setShowDialog, suppliers=[], spareParts=[], onSaveNewOrders}) {
    const formRef = useRef()
    const [validated, setValidated] = useState(false)

    const [isPending, startTransition] = useTransition();

    const defaultItem = {itemCode: '', partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedItemCode: [], selectedSparePart: []};

    const [items, setItems] = useState([defaultItem])

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

    const saveChange = () => {
        const nativeForm = formRef.current
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }

        const invoiceDate = nativeForm['invoiceDate']
        const deliveryOrderNo = nativeForm['deliveryOrderNo']

        const itemCodes = nativeForm['itemCode'].length === undefined ? [nativeForm['itemCode']] 
            : Array.from(nativeForm['itemCode'])
        const partNames = nativeForm['partName'].length === undefined ? [nativeForm['partName']] 
            : Array.from(nativeForm['partName'])
        const formQuantity = nativeForm['quantity'].length === undefined ? [nativeForm['quantity']] 
            : Array.from(nativeForm['quantity'])
        const formUnits = nativeForm['unit'].length === undefined ? [nativeForm['unit']] 
            : Array.from(nativeForm['unit'])
        const formUnitPrices = nativeForm['unitPrice'].length === undefined ? [nativeForm['unitPrice']] 
            : Array.from(nativeForm['unitPrice'])

        const payload = partNames.map((v, i) => {
                return {
                    invoiceDate: invoiceDate.value,
                    deliveryOrderNo: deliveryOrderNo.value,
                    supplierId: selectedSupplier[0].id,
                    itemCode: itemCodes[i].value,
                    partName: v.value,
                    quantity: parseInt(formQuantity[i].value),
                    unit: formUnits[i].value,
                    unitPrice: parseFloat(formUnitPrices[i].value),
                    totalPrice: formQuantity[i].value * formUnitPrices[i].value
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
        // you shouldn't change the "prevs" state, such as prevs.splice, it would case 2-times rendering
        setItems(prevs => {
            const newItems = [...prevs]
            newItems.splice(i, 1)
            return newItems
        })
    }

    const afterChooseSupplier = ([supplier]) => {
        if (supplier) {
            setSelectedSupplier([supplier])
            setSparePartsSelection((spareParts.filter(sp => sp.supplierId == supplier.id)) || spareParts)
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
        setItems(prevs => {
            const newItem = [...prevs]
            newItem[i] = {...prevs[i], ...sparePart, 
                selectedSparePart: (sparePart && 
                    spareParts.findIndex(sp => sp.itemCode ==sparePart.itemCode) >= 0 
                    && spareParts.filter(sp => sp.itemCode == sparePart.itemCode)) || [...prevs[i].selectedSparePart], 
                selectedItemCode: (sparePart && [sparePart]) || []}
            return newItem
        })
    }
  
    const afterChooseSparePart = ([sparePart], i) => {
        if (sparePart && suppliers.findIndex(s => s.id === sparePart.supplierId) >= 0) {
            setSelectedSupplier([suppliers.find(s => s.id === sparePart.supplierId)])
        }
        setItems(prevs => {
            const newItem = [...prevs]
            newItem[i] = {...prevs[i], ...sparePart, 
                selectedSparePart: (sparePart && [sparePart]) || [], 
                selectedItemCode: (sparePart && sparePart.itemCode && [sparePart]) || [...prevs[i].selectedItemCode]}
            return newItem
        })
    }

    const updatePriceByQuantity = (val, i) => {
        setItems(prevs => {
            prevs[i] = {...prevs[i], quantity: val}
            return [...prevs]
        })
    }

    const updatePriceByUnitPrice = (val, i) => {
        setItems(prevs => {
            prevs[i] = {...prevs[i], unitPrice: val}
            return [...prevs]
        })
    }

    return (
        <Modal show={isShow} onHide={handleClose} onShow={dialogOpened} size="lg">
            <Modal.Header closeButton>
            <Modal.Title>Adding New Spare Parts</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Row className="mb-3">
                            <Col sm="4">
                                <InputGroup>
                                    <InputGroup.Text><i class="bi bi-calendar-event"></i></InputGroup.Text>
                                    <Form.Control required type="date" name="invoiceDate"></Form.Control>
                                </InputGroup>
                            </Col>
                            <Col sm="5">
                                <Typeahead
                                    inputProps={{required:true, name:'supplier'}}
                                    id="supplier-select"
                                    labelKey='supplierName'
                                    options={suppliers}
                                    onChange={(supplier) => afterChooseSupplier(supplier)}
                                    placeholder="Choose a supplier..."
                                    selected={selectedSupplier}
                                    clearButton
                                    />
                            </Col>
                            <Col className="text-sm-end">
                                <Form.Control type="text" required name="deliveryOrderNo" placeholder="Key in DO. number"></Form.Control>
                            </Col>
                        </Row>
                        <Row className="my-3">
                            <Col className="text-sm-end">
                                <Button size="sm" onClick={addNewItem}>More</Button>
                            </Col>
                        </Row>
                        
                        <ListGroup>
                        {items?.map((v, i) =>
                            <ListGroup.Item>
                                <Row>
                                    <Col xs="1"><span onClick={() => removeItem(i)} role="button"><i className="bi bi-x-lg text-danger"></i></span></Col>
                                    <Form.Group as={Col} className="mb-3 col-4" controlId="itemCode">
                                        <Typeahead
                                            inputProps={{name: 'itemCode'}}
                                            labelKey='itemCode'
                                            options={sparePartsSelection.filter(v => !!v.itemCode)}
                                            onChange={(opts) => afterChooseItemCode(opts, i)}
                                            placeholder="Key in item code"
                                            clearButton
                                            allowNew
                                            selected={v.selectedItemCode}
                                            />
                                    </Form.Group>
                                    <Form.Group as={Col} className="mb-3" controlId="sparePart">
                                    <Typeahead
                                        inputProps={{required:true, name: 'partName'}}
                                        labelKey='partName'
                                        options={sparePartsSelection}
                                        onChange={(opts) => afterChooseSparePart(opts, i)}
                                        placeholder="Find a spare part..."
                                        renderMenuItemChildren={(option) => 
                                            <div>
                                                <div>{option.partName}</div>
                                                {/** TODO: to add supplier info later on */} 
                                                <small className="text-secondary">Unit Price: {option?.unitPrice} per {option?.unit} | Order: {option?.orderId}</small>
                                            </div>
                                        }
                                        clearButton
                                        allowNew
                                        selected={v.selectedSparePart}
                                        />                                
                                    </Form.Group>
                                </Row>
                                <Row>
                                    <Col sm="4"></Col>
                                    <Col sm="2">
                                        <Form.Control onChange={(e) => updatePriceByQuantity(e.target.value, i)} required type="number" name="quantity" placeholder="Quantity" value={v?.quantity}/>
                                    </Col>
                                    <Col sm="2" className="mb-3">
                                        <Form.Control required type="text" name="unit" placeholder="Unit" value={v?.unit}/>
                                    </Col>
                                    <Col sm="2">
                                        <Form.Control onChange={(e) => updatePriceByUnitPrice(e.target.value, i)} required type="number" step="0.1" name="unitPrice" placeholder="Price $" value={v?.unitPrice} />
                                    </Col>
                                    <Col className="mb-3">
                                        <p className="fs-4">${(v.quantity && v.unitPrice && v.quantity * v.unitPrice) || 0}</p>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                        )}
                        </ListGroup>
                        
                    </Form>
                </Container>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="primary" onClick={saveChange} disabled={isPending}>
                Save Changes
            </Button>
            </Modal.Footer>
        </Modal>
    )

}

export default AddSparePartsDialog