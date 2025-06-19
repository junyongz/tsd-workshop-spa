import { useRef, useState } from "react";
import { Modal, Button, Container, Col, Row, InputGroup, Nav } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import Form from "react-bootstrap/Form";
import { Calendar, Inspection, MaintenanceServices, Repair, Truck } from "../Icons";
import SparePartsSubDialog from "./SparePartsSubDialog";
import TaskSubDialog from "./TaskSubDialog";

function ServiceDialog({isShow, setShow, trx, onNewServiceCreated, vehicles=[], 
    spareParts, orders=[], suppliers=[], sparePartUsages=[], taskTemplates=[],
    onNewVehicleCreated=() => {}}) {

    const apiUrl = process.env.REACT_APP_API_URL

    const [items, setItems] = useState([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts: []}])
    const [tasks, setTasks] = useState()

    const [validated, setValidated] = useState(false)
    const formRef = useRef()
    const repairSwitchRef = useRef()
    const maintSwitchRef = useRef()
    const inspectionSwitchRef = useRef()

    const [tabView, setTabView] = useState('spareParts')
    
    const [selectedVehicles, setSelectedVehicles] = useState(trx?.current?.vehicleNo ? [vehicles.find(veh => veh.vehicleNo === trx.current.vehicleNo)] : [])
    const [selectedExistingService, setSelectedExistingService] = useState()
    const [selectedStartDate, setSelectedStartDate] = useState(trx?.current?.startDate)

    const handleClose = () => {
        setItems([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts:[]}])
        setTasks()
        setValidated(false)
        setShow(false)
        setSelectedExistingService()
        setSelectedVehicles([])
        setTabView('spareParts')
    }

    const addNewItem = () => {
        setValidated(false)
        // check view tab
        if (tabView === 'spareParts') {
            setItems(prev => {
                return [...prev, {partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts:[]}]
            })
        }
        else if (tabView === 'workmanship') {
            setTasks(prev => (!prev && [{}]) || [...prev, {}])
        }
    }

    const afterChooseDate = (dateVal) => {
        if (!trx?.current?.vehicleNo) {
            setSelectedStartDate(dateVal)
        }
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
                fetch(`${apiUrl}/api/workshop-services?vehicleId=${veh.id}`, {
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
        if (items.some(itm => !itm.selectedSpareParts || itm.selectedSpareParts.length === 0)) {
            nativeForm['sparePartsCompleted'].setCustomValidity('Please key spare parts')
            setTabView('all')
        }
        else {
            nativeForm['sparePartsCompleted'].setCustomValidity('')
        }
        if (tasks?.some(itm => !itm.taskId)) {
            nativeForm['tasksCompleted'].setCustomValidity('Please key tasks')
            setTabView('all')
        }
        else {
            nativeForm['tasksCompleted'].setCustomValidity('')
        }

        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }
        nativeForm['sparePartsCompleted'].setCustomValidity('')
        nativeForm['tasksCompleted'].setCustomValidity('')
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
            sparePartsMargin: selectedExistingService?.sparePartsMargin,
            sparePartUsages: items.map(v => {
                return {
                    vehicleNo: selectedVehicles[0].vehicleNo,
                    usageDate: nativeForm['startDate'].value,
                    quantity: v.quantity,
                    soldPrice: parseFloat(v.unitPrice * (1+(selectedExistingService?.sparePartsMargin||0)/100)),
                    margin: selectedExistingService?.sparePartsMargin||0,
                    orderId: v.selectedSpareParts[0].orderId,
                }
            }),
            tasks: (tasks || []).map(v => {
                return {
                    recordedDate: nativeForm['startDate'].value,
                    taskId: v.taskId,
                    quotedPrice: v.quotedPrice,
                    remarks: v.remarks
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
                notes: trx?.current?.notes,
                sparePartsMargin: trx?.current?.sparePartsMargin})
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
                            <Col xs="12" lg="3" className="mb-1">
                                <InputGroup>
                                <InputGroup.Text><Calendar /></InputGroup.Text>
                                    <Form.Control onChange={(e) => afterChooseDate(e.target.value)} name="startDate" 
                                        min={selectedExistingService ? selectedExistingService.startDate : undefined} 
                                        max={new Date().toISOString().split('T')[0]} 
                                        required type="date"></Form.Control>
                                </InputGroup>
                            </Col>
                            <Col xs="12" lg="6" className="mb-1">
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
                            <Col xs="12" lg="3" className="mb-1">
                                <InputGroup>
                                    <Form.Control name="mileageKm" defaultValue={selectedExistingService?.mileageKm || selectedVehicles[0]?.latestMileageKm}></Form.Control>
                                    <InputGroup.Text>KM</InputGroup.Text>
                                </InputGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col className="text-center">
                            <Form.Check ref={repairSwitchRef} inline name="transactionTypes" type="switch" defaultChecked={trx.current?.transactionTypes?.includes('REPAIR')} value="REPAIR" label={ <span onClick={() => repairSwitchRef.current.click()}><Repair /> Repair</span> }></Form.Check>
                            <Form.Check ref={maintSwitchRef} inline name="transactionTypes" type="switch" defaultChecked={trx.current?.transactionTypes?.includes('SERVICE')}value="SERVICE" label={ <span onClick={() => maintSwitchRef.current.click()}><MaintenanceServices /> Maintenance Service</span> }></Form.Check>
                            <Form.Check ref={inspectionSwitchRef} inline name="transactionTypes" type="switch" defaultChecked={trx.current?.transactionTypes?.includes('INSPECTION')}value="INSPECTION"  label={ <span onClick={() => inspectionSwitchRef.current.click()}><Inspection /> Inspection</span> }></Form.Check>
                            </Col>
                        </Row>
                        <Row>
                            <Col className="text-end">
                                <Button disabled={tabView === 'all'} size="sm" onClick={addNewItem}><i className="bi bi-plus-circle-fill me-2"></i>{items.length === 0 ? 'Add New' : 'Add More' }</Button>
                            </Col>
                        </Row>
                        
                        <Nav variant="underline" activeKey={tabView} className="mb-1" onSelect={(key) => setTabView(key)}>
                            <Nav.Item>
                                <Nav.Link eventKey='spareParts'>Spare Parts</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey='workmanship'>Workmanship</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey='all'>All</Nav.Link>
                            </Nav.Item>
                        </Nav>
                        {(tabView === 'spareParts' || tabView === 'all') && <div className="mb-1"><SparePartsSubDialog 
                            sparePartsMargin={selectedExistingService?.sparePartsMargin}
                            items={items} setItems={setItems}
                            orders={orders} sparePartUsages={sparePartUsages}
                            spareParts={spareParts} suppliers={suppliers} /></div>}
                        {(tabView === 'workmanship' || tabView === 'all') && <TaskSubDialog tasks={tasks} setTasks={setTasks} taskTemplates={taskTemplates} />}
                        <Form.Control type="output" name="sparePartsCompleted" className="d-none" />
                        <Form.Control type="output" name="tasksCompleted" className="d-none" />
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