import { useRef, useState } from "react";
import { Modal, Button, Container, Col, Row, FormLabel, Badge, ListGroup, InputGroup } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import Form from "react-bootstrap/Form";
import remainingQuantity from "./utils/quantityUtils";

function ServiceDialog({isShow, setShow, trx, onNewServiceCreated, vehicles, setVehicles, 
    spareParts, orders=[], suppliers=[], sparePartUsages=[],
    onNewVehicleCreated=() => {}}) {
    const [items, setItems] = useState([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts: []}])
    const [validated, setValidated] = useState(false)
    const formRef = useRef()
    
    const [selectedVehicles, setSelectedVehicles] = useState(trx?.current?.vehicleNo ? [vehicles.find(veh => veh.vehicleNo === trx.current.vehicleNo)] : [])

    const handleClose = () => {
        setItems([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts:[]}])
        setValidated(false)
        setShow(false)
    }

    const addNewItem = () => {
        setValidated(false)
        setItems(prev => {
            return [...prev, {partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts:[]}]
        })
    }

    const removeItem = (i) => {
        setItems(prev => {
            const newItems = [...prev]
            newItems.splice(i, 1)
            return newItems
        })
    }

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

    const addOrUpdateVehicles = ([veh]) => {
        if (veh) {
            if (vehicles.findIndex(v => v.vehicleNo === veh?.vehicleNo) === -1) {
                onNewVehicleCreated(veh.vehicleNo)
            }
            setSelectedVehicles([veh])
        }
        else {
            setSelectedVehicles([])
        }
    }

    const saveChange = () => {
        const nativeForm = formRef.current
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }

        onNewServiceCreated(items.map((v, i) => {
            return {
                creationDate: trx?.current?.creationDate,
                vehicleNo: nativeForm[0].value,
                quantity: v.quantity,
                unit: v.unit,
                unitPrice: parseFloat(v.unitPrice),
                itemDescription: v.partName,
                totalPrice: v.quantity * v.unitPrice,
                orderId: v.selectedSpareParts[0].orderId,
                supplierId: v.selectedSpareParts[0].supplierId,
            }
        }))
        handleClose()
    }

    const changeSelectedVehicle = () => {
        if (trx?.current?.vehicleNo && vehicles.length > 0 && vehicles.findIndex(veh => veh.vehicleNo === trx.current.vehicleNo) > -1) {
            setSelectedVehicles([vehicles.find(veh => veh.vehicleNo === trx.current.vehicleNo)])
        }
        else {
            setSelectedVehicles([])
        }
    }

    return (
        <Modal show={isShow} onHide={handleClose} onShow={changeSelectedVehicle} size="lg">
            <Modal.Header closeButton>
            <Modal.Title><i className="bi bi-file-earmark-text-fill"></i> Service at {trx?.current?.creationDate}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Row className="mb-1">
                            <Col>
                                <InputGroup>
                                <InputGroup.Text><i className="bi bi-truck"></i></InputGroup.Text>
                                <Typeahead
                                    allowNew
                                    newSelectionPrefix="Add a new vehicle: "
                                    inputProps={{required:true, pattern:"([A-Z]{1,3})\\s(\\d{1,4})(\\s([A-Z]{1,2}))?"}}
                                    id="vehicle-select"
                                    labelKey='vehicleNo'
                                    options={vehicles}
                                    onChange={(vehs) => addOrUpdateVehicles(vehs)}
                                    placeholder="Choose a vehicle..."
                                    selected={selectedVehicles}
                                    />
                                </InputGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col className="text-sm-end">
                                <Button size="sm" onClick={addNewItem}>Add More</Button>
                            </Col>
                        </Row>
                        
                        <div>
                            <label>Spart parts</label>
                        </div>
                        <ListGroup>
                        {items?.map((v, i) =>
                        <ListGroup.Item key={i}>
                            <Row>
                                <Col xs="1">
                                <span onClick={() => removeItem(i)} role="button"><i className="bi bi-x-lg text-danger"></i></span>
                                </Col>
                                
                                <Form.Group as={Col} className="mb-3 col-7" controlId="spareParts">
                                    <InputGroup>
                                    <InputGroup.Text><i className="bi bi-tools"></i></InputGroup.Text>
                                    <Typeahead
                                        inputProps={{required:true, name: 'partName'}}
                                        labelKey='partName'
                                        options={spareParts}
                                        onChange={(opts) => afterChooseSparePart(opts, i)}
                                        placeholder="Find a spare part..."
                                        renderMenuItemChildren={(option) => {
                                            const order = orders.find(o => o.id === option.orderId)
                                            const supplier = suppliers.find(s => s.id === option.supplierId)
                                            const quantityLeft = remainingQuantity(order, sparePartUsages)
                                              
                                            if (quantityLeft === 0) {
                                                return;
                                            }

                                            return <div>
                                                <div>{option.partName}</div>
                                                {/** TODO: to add supplier info later on */} 
                                                <small className="text-secondary">${option.unitPrice} / {quantityLeft} left / <i className="bi bi-shop"></i> {supplier.supplierName} / {order.invoiceDate}</small>
                                            </div>
                                            }
                                        }
                                        clearButton
                                        selected={v.selectedSpareParts}
                                        />
                                    </InputGroup>
                                </Form.Group>
                                <Form.Group as={Col} className="mb-3 col-2" controlId="quantity">
                                    <Form.Control onChange={(e) => updatePriceByQuantity(e.target.value, i)} required type="number" name="quantity" min="1" max={(v.selectedSpareParts[0] && orders.find(o => o.id === v.selectedSpareParts[0].orderId).quantity) || 0} placeholder="Quantity" value={v?.quantity}/>
                                </Form.Group>
                                <Form.Group as={Col} className="mb-3 col-2" controlId="unitPrice">
                                    <Form.Control onChange={(e) => updatePriceByUnitPrice(e.target.value, i)} required type="number" step="0.10" name="unitPrice" placeholder="Price $" value={v?.unitPrice} />
                                </Form.Group>
                            </Row>
                            <Row>
                                <Col className="mb-3">
                                </Col>
                                <Col className="mb-3 col-2" controlId="unit">
                                    <Form.Control required type="text" name="unit" placeholder="Unit" value={v?.unit}/>
                                </Col>
                                <Col className="mb-3 col-2">
                                    <FormLabel><Badge pill>$ {(v?.quantity * v?.unitPrice) || 0}</Badge></FormLabel>
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
            <Button variant="primary" onClick={saveChange}>
                Save Changes
            </Button>
            </Modal.Footer>
        </Modal>
    )

}

export default ServiceDialog