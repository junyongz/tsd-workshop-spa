import { useRef, useState } from "react";
import { Modal, Button, Container, Col, Row, FormLabel, Badge, ListGroup, InputGroup, Nav } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import Form from "react-bootstrap/Form";
import remainingQuantity, { decimalPointUomAvailable } from "./utils/quantityUtils";
import { Calendar, Dollar, Inspection, MaintenanceServices, Repair, Suppliers, Tools, Trash, Truck } from "./Icons";

function ServiceDialog({isShow, setShow, trx, onNewServiceCreated, vehicles=[], 
    spareParts, orders=[], suppliers=[], sparePartUsages=[],
    onNewVehicleCreated=() => {}}) {

    const apiUrl = process.env.REACT_APP_API_URL

    const [items, setItems] = useState([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts: []}])
    const [validated, setValidated] = useState(false)
    const formRef = useRef()
    const repairSwitchRef = useRef()
    const maintSwitchRef = useRef()
    const inspectionSwitchRef = useRef()
    
    const [selectedVehicles, setSelectedVehicles] = useState(trx?.current?.vehicleNo ? [vehicles.find(veh => veh.vehicleNo === trx.current.vehicleNo)] : [])
    const [selectedExistingService, setSelectedExistingService] = useState()
    const [selectedStartDate, setSelectedStartDate] = useState(trx?.current?.startDate)

    const handleClose = () => {
        setItems([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts:[]}])
        setValidated(false)
        setShow(false)
        setSelectedExistingService()
        setSelectedVehicles([])
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
            
            if (isFinite(veh.id)) {
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
                        trx.current.mileageKm = ws[0].mileageKm
                        setSelectedExistingService(ws[0])
                    }
                })
            }
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
            notes: selectedExistingService?.notes,
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
            setSelectedExistingService({id: trx?.current?.id, 
                startDate: trx?.current?.startDate, 
                mileageKm: trx?.current?.mileageKm, 
                notes: trx?.current?.notes})
        }
    }

    return (
        <Modal show={isShow} onHide={handleClose} onShow={uponShowing} backdrop="static" onEscapeKeyDown={(e) => e.preventDefault()} size="xl">
            <Modal.Header closeButton>
            <Modal.Title><i className="bi bi-file-earmark-text-fill"></i> Service started at {selectedExistingService ? selectedExistingService.startDate : selectedStartDate}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container fluid>
                    <Form ref={formRef} validated={validated}>
                        <Row className="mb-1">
                            <Col xs="12" lg="2" className="mb-1">
                                <InputGroup>
                                <InputGroup.Text><Calendar /></InputGroup.Text>
                                    <Form.Control onChange={(e) => afterChooseDate(e.target.value)} name="startDate" 
                                        min={selectedExistingService ? selectedExistingService.startDate : undefined} 
                                        max={new Date().toISOString().split('T')[0]} 
                                        required type="date"></Form.Control>
                                </InputGroup>
                            </Col>
                            <Col xs="12" lg="8" className="mb-1">
                                <InputGroup>
                                <InputGroup.Text><Truck /></InputGroup.Text>
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
                            <Col xs="12" lg="2" className="mb-1">
                                <InputGroup>
                                    <Form.Control name="mileageKm" defaultValue={selectedExistingService?.mileageKm || selectedVehicles[0]?.latestMileageKm}></Form.Control>
                                    <InputGroup.Text>KM</InputGroup.Text>
                                </InputGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={false} lg="2"></Col>
                            <Col xs="12" lg="10">
                            <Form.Check ref={repairSwitchRef} inline name="transactionTypes" type="switch" defaultChecked={trx.current?.transactionTypes?.includes('REPAIR')} value="REPAIR" label={ <span onClick={() => repairSwitchRef.current.click()}><Repair /> Repair</span> }></Form.Check>
                            <Form.Check ref={maintSwitchRef} inline name="transactionTypes" type="switch" defaultChecked={trx.current?.transactionTypes?.includes('SERVICE')}value="SERVICE" label={ <span onClick={() => maintSwitchRef.current.click()}><MaintenanceServices /> Maintenance Service</span> }></Form.Check>
                            <Form.Check ref={inspectionSwitchRef} inline name="transactionTypes" type="switch" defaultChecked={trx.current?.transactionTypes?.includes('INSPECTION')}value="INSPECTION"  label={ <span onClick={() => inspectionSwitchRef.current.click()}><Inspection /> Inspection</span> }></Form.Check>
                            </Col>
                        </Row>
                        <Row>
                            <Col className="text-end">
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
                                    <FormLabel className="fs-5"><Badge pill>$ {(v?.quantity * v?.unitPrice).toFixed(2) || 0}</Badge></FormLabel>
                                </Col>
                                <Col xs="6" lg="1" className="text-end">
                                <div><span className="text-danger fs-5" onClick={() => removeItem(i)} role="button"><Trash /></span></div>
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