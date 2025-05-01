import { useRef, useState } from "react";
import { Modal, Button, Container, Col, Row, FormLabel, Badge, ListGroup, InputGroup, Nav } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import Form from "react-bootstrap/Form";
import remainingQuantity from "./utils/quantityUtils";

function ServiceDialog({isShow, setShow, trx, onNewServiceCreated, vehicles=[], 
    spareParts, orders=[], suppliers=[], sparePartUsages=[],
    onNewVehicleCreated=() => {}}) {

    const apiUrl = process.env.REACT_APP_API_URL

    const [items, setItems] = useState([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts: []}])
    const [validated, setValidated] = useState(false)
    const formRef = useRef()
    
    const [selectedVehicles, setSelectedVehicles] = useState(trx?.current?.vehicleNo ? [vehicles.find(veh => veh.vehicleNo === trx.current.vehicleNo)] : [])
    const [selectedExistingService, setSelectedExistingService] = useState()
    const [selectedStartDate, setSelectedStartDate] = useState(trx?.current?.startDate)

    const handleClose = () => {
        setItems([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts:[]}])
        setValidated(false)
        setShow(false)
        setSelectedExistingService()
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

    const afterChooseDate = (dateVal) => {
        if (!trx?.current?.vehicleNo) {
            setSelectedStartDate(dateVal)
        }
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
                .then(stored => setSelectedVehicles([stored]))
            }
            else {
                setSelectedVehicles([veh])
            }
            
            // not allow to add more than 1 service for same vehicle
            fetch(`${apiUrl}/workshop-services?vehicleId=${veh.id}`, {
                mode: 'cors',
                headers: {
                    'Content-type': 'application/json'
                }
            })
            .then(resp => resp.json())
            .then(ws => {
                if (ws && ws.length > 0) {
                    trx.current.id = ws[0].id
                    setSelectedExistingService(ws[0])
                }
            })
        }
        else {
            setSelectedVehicles([])
            trx.current.id = undefined
            setSelectedExistingService()
            setSelectedStartDate()
        }
    }

    const checkVehicleValidity = (vehicleInput) => {
        if (vehicleInput) {
            if (vehicles.findIndex(veh => veh.vehicleNo === vehicleInput.value) === -1) {
                vehicleInput.setCustomValidity('not a valid vehicle, either choose one and create one first')
            }
            else {
                vehicleInput.setCustomValidity('')
            }
        }
    }

    const saveChange = () => {
        const nativeForm = formRef.current

        checkVehicleValidity(nativeForm['vehicle'])
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }
        nativeForm['vehicle'].setCustomValidity('')

        // { id: ?, creationDate: ?, sparePartUsages: [{}, {} ]}
        const service = {
            id: selectedExistingService?.id,
            vehicleId: selectedVehicles[0].id,
            vehicleNo: selectedVehicles[0].vehicleNo,
            startDate: selectedExistingService ? selectedExistingService.startDate : nativeForm['startDate'].value,
            transactionTypes: Array.from(nativeForm['transactionTypes']).filter(tt => tt.checked).map(tt => tt.value),
            mileageKm: nativeForm['mileageKm'].value,
            sparePartUsages: items.map((v, i) => {
                return {
                    vehicleNo: selectedVehicles[0].vehicleNo,
                    usageDate: nativeForm['startDate'].value,
                    quantity: v.quantity,
                    soldPrice: parseFloat(v.unitPrice),
                    orderId: v.selectedSpareParts[0].orderId,
                }
            })
        }

        onNewServiceCreated(service)
        handleClose()
    }

    const uponShowing = () => {
        if (trx?.current?.vehicleNo && vehicles.length > 0 && vehicles.findIndex(veh => veh.vehicleNo === trx.current.vehicleNo) > -1) {
            setSelectedVehicles([vehicles.find(veh => veh.vehicleNo === trx.current.vehicleNo)])
        }
        else {
            setSelectedVehicles([])
        }

        setSelectedStartDate(trx?.current?.startDate)
        if (trx?.current?.id) {
            setSelectedExistingService({id: trx?.current?.id, startDate: trx?.current?.startDate})
        }
    }

    return (
        <Modal show={isShow} onHide={handleClose} onShow={uponShowing} backdrop="static" onEscapeKeyDown={(e) => e.preventDefault()} size="xl">
            <Modal.Header closeButton>
            <Modal.Title><i className="bi bi-file-earmark-text-fill"></i> Service started at {selectedExistingService ? selectedExistingService.startDate : selectedStartDate}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Row className="mb-1">
                            <Col xs="2">
                                <InputGroup>
                                <InputGroup.Text><i className="bi bi-calendar-event"></i></InputGroup.Text>
                                    <Form.Control onChange={(e) => afterChooseDate(e.target.value)} name="startDate" 
                                        min={selectedExistingService ? selectedExistingService.startDate : undefined} 
                                        max={new Date().toISOString().split('T')[0]} 
                                        required type="date"></Form.Control>
                                </InputGroup>
                            </Col>
                            <Col>
                                <InputGroup>
                                <InputGroup.Text><i className="bi bi-truck"></i></InputGroup.Text>
                                <Typeahead
                                    allowNew
                                    disabled={!!trx?.current?.id}
                                    newSelectionPrefix="Create & add a new vehicle: "
                                    inputProps={{name:'vehicle', required:true, pattern:"([A-Z]{1,3})\\s(\\d{1,4})(\\s([A-Z]{1,2}))?"}}
                                    id="vehicle-select"
                                    labelKey='vehicleNo'
                                    options={vehicles}
                                    onChange={(vehs) => addOrUpdateVehicles(vehs)}
                                    onBlur={(event) => {
                                        const veh = vehicles.find(veh => veh.vehicleNo === event.target.value);
                                        if (veh) {
                                            setSelectedVehicles([veh])
                                        }
                                    }}
                                    placeholder="Choose a vehicle..."
                                    selected={selectedVehicles} />
                                </InputGroup>
                            </Col>
                            <Col xs="2">
                                <InputGroup>
                                    <Form.Control name="mileageKm" defaultValue={trx.current?.mileageKm}></Form.Control>
                                    <InputGroup.Text>KM</InputGroup.Text>
                                </InputGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs="2"></Col>
                            <Col>
                            <Form.Check inline name="transactionTypes" defaultChecked={trx.current?.transactionTypes?.includes('REPAIR')} value="REPAIR" label={ <span><i className="bi bi-hammer"></i> Repair</span> }></Form.Check>
                            <Form.Check inline name="transactionTypes" defaultChecked={trx.current?.transactionTypes?.includes('SERVICE')}value="SERVICE" label={ <span><i className="bi bi-clock"></i> Maintenance Service</span> }></Form.Check>
                            <Form.Check inline name="transactionTypes" defaultChecked={trx.current?.transactionTypes?.includes('INSPECTION')}value="INSPECTION"  label={ <span><i className="bi bi-calendar-check"></i> Inspection</span> }></Form.Check>
                            </Col>
                        </Row>
                        <Row>
                            <Col className="text-sm-end">
                                <Button size="sm" onClick={addNewItem}><i className="bi bi-plus-circle-fill me-2"></i>{items.length === 0 ? 'Add New' : 'Add More' }</Button>
                            </Col>
                        </Row>
                        
                        <Nav variant="pills" defaultActiveKey="spareParts" className="mb-1">
                            <Nav.Item>
                                <Nav.Link eventKey={'spareParts'}>Spare Parts</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link disabled eventKey={'workmanship'}>Workmanship</Nav.Link>
                            </Nav.Item>
                        </Nav>
                        <ListGroup>
                        {items?.map((v, i) =>
                        <ListGroup.Item key={i}>
                            <Row>                                
                                <Form.Group as={Col} className="mb-3 col-6" controlId="spareParts">
                                    <InputGroup>
                                    <InputGroup.Text><i className="bi bi-tools"></i></InputGroup.Text>
                                    <Typeahead
                                        inputProps={{required:true, name: 'partName'}}
                                        labelKey='partName'
                                        options={spareParts}
                                        onChange={(opts) => afterChooseSparePart(opts, i)}
                                        placeholder="Find a spare part..."
                                        renderMenuItemChildren={(option) => {
                                            const order = orders.mapping[option.orderId]
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
                                    <InputGroup>
                                        <Form.Control onChange={(e) => updatePriceByQuantity(e.target.value, i)} required type="number" name="quantity" min="1" max={(v.selectedSpareParts[0] && remainingQuantity(orders.mapping[v.selectedSpareParts[0].orderId], sparePartUsages)) || 0} placeholder="Quantity" value={v?.quantity}/>
                                        <InputGroup.Text>{v?.unit}</InputGroup.Text>
                                    </InputGroup>
                                </Form.Group>
                                <Form.Group as={Col} className="mb-3 col-2" controlId="unitPrice">
                                    <InputGroup>
                                        <InputGroup.Text><i className="bi bi-currency-dollar"></i></InputGroup.Text>
                                        <Form.Control onChange={(e) => updatePriceByUnitPrice(e.target.value, i)} required type="number" step="0.10" name="unitPrice" placeholder="Price $" value={v?.unitPrice} />
                                    </InputGroup>
                                </Form.Group>
                                <Col className="text-sm-end align-items-center">
                                    <FormLabel><Badge pill>$ {(v?.quantity * v?.unitPrice).toFixed(2) || 0}</Badge></FormLabel>
                                </Col>
                                <Col xs="1" style={{"margin-right":"-3em"}}>
                                <span onClick={() => removeItem(i)} role="button"><i className="bi bi-trash3 text-danger"></i></span>
                                </Col>
                            </Row>
                        </ListGroup.Item>
                        )}
                        </ListGroup>                        
                    </Form>
                </Container>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="primary" onClick={saveChange}>
                <i className="bi bi-save2 me-2"></i>Save
            </Button>
            </Modal.Footer>
        </Modal>
    )

}

export default ServiceDialog