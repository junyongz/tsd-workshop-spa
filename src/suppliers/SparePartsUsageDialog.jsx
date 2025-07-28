import React, { useRef, useState } from "react"
import { Container, Form, Modal, Row, Col, Button, InputGroup } from "react-bootstrap"
import { Typeahead } from "react-bootstrap-typeahead"
import { decimalPointUomAvailable } from "../utils/quantityUtils"
import { Calendar, Tools, Truck } from "../Icons"
import { addDaysToDateStr } from "../utils/dateUtils"
import createNewVehicle from "../vehicles/createNewVehicle"

function SparePartsUsageDialog({isShow, setShowDialog, vehicles, 
    usageSpareParts, setUsageSpareParts, onSaveNewSparePartUsage,
    onNewVehicleCreated=() => {}}) {

    const apiUrl = process.env.REACT_APP_API_URL

    const formRef = useRef()
    const [validated, setValidated] = useState(false)
    const [selectedVehicles, setSelectedVehicles] = useState([])
    const [remaining, setRemaining] = useState(usageSpareParts.remaining)
    const [existingServices, setExistingServices] = useState([])
    const [selectedExistingService, setSelectedExistingService] = useState()

    const [records, setRecords] = useState(1)

    const handleClose = () => {
        setValidated(false)
        setShowDialog(false)
        // setRecords(1)
        setUsageSpareParts({})
        setSelectedVehicles([])
        setExistingServices([])
        setSelectedExistingService()
    }

    const updateRemaining = (qty) => {
        setRemaining(usageSpareParts.remaining - qty)
    }

    const saveChange = () => {
        const nativeForm = formRef.current
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }

        const usageDate = nativeForm.elements.namedItem('usageDate').value
        const vehicleNo = selectedVehicles[0].vehicleNo
        const quantity = nativeForm.elements.namedItem('quantity').value

        onSaveNewSparePartUsage({
            vehicleId: selectedVehicles[0].id,
            vehicleNo: vehicleNo,
            usageDate: usageDate,
            orderId: usageSpareParts.id,
            serviceId: nativeForm.elements.namedItem('serviceId') && nativeForm.elements.namedItem('serviceId').value,
            quantity: quantity,
            soldPrice: usageSpareParts.unitPrice
        })

        handleClose()
    }

    const addOrUpdateVehicles = ([veh]) => {
        if (veh) {
            createNewVehicle(veh, vehicles, setSelectedVehicles, onNewVehicleCreated)

            fetch(`${apiUrl}/api/workshop-services?vehicleId=${veh.id}`, {
                mode: 'cors',
                headers: {
                    'Content-type': 'application/json'
                }
            })
            .then(resp => resp.json())
            .then(ws => {
                if (ws && ws.length > 0) {
                    setExistingServices(ws)
                    if (ws.length === 1) {
                        setSelectedExistingService(ws[0])
                    }
                }
            })
        }
        else {
            setSelectedVehicles([])
            setExistingServices([])
        }
    }

    const afterChooseExistingService = (v) => {
        setSelectedExistingService(v)
    }

    return (
        <Modal show={isShow} onHide={handleClose} onShow={() => setRemaining(usageSpareParts.remaining)} size="lg">
            <Modal.Header closeButton>
            <Modal.Title>
                <div><Tools /> {usageSpareParts.partName}, tinggal lagi: {remaining} {usageSpareParts.unit}</div>
                <div className="text-body-secondary fs-6">Order {usageSpareParts.deliveryOrderNo} from {usageSpareParts.supplierName} @ {usageSpareParts.invoiceDate} </div>
            </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        {
                            Array.from({length: records}, (_, i) =>
                                <React.Fragment key={i}>
                                <Row className="mb-1">
                                    <Col xs="3">
                                        <InputGroup>
                                        <InputGroup.Text><Calendar /></InputGroup.Text>
                                        <Form.Control required type="date" 
                                            min={selectedExistingService ? selectedExistingService.startDate : usageSpareParts.invoiceDate}
                                            max={addDaysToDateStr(new Date(), 0)}
                                            name="usageDate" disabled={!usageSpareParts.quantity || usageSpareParts.quantity === 0}></Form.Control>
                                        </InputGroup>
                                    </Col>
                                    <Col>
                                    <InputGroup>
                                    <InputGroup.Text><Truck /></InputGroup.Text>
                                        <Typeahead
                                            allowNew
                                            newSelectionPrefix="Add a new vehicle: "
                                            inputProps={{required:true, pattern:"([A-Z]{1,3})\\s(\\d{1,4})(\\s([A-Z]{1,2}))?"}}
                                            id="vehicle-select"
                                            labelKey='vehicleNo'
                                            options={vehicles}
                                            onChange={(vehs) => addOrUpdateVehicles(vehs)}
                                            selected={selectedVehicles}
                                            placeholder="Choose a vehicle..."
                                            clearButton
                                            disabled={!usageSpareParts.quantity || usageSpareParts.quantity === 0}
                                            />
                                    </InputGroup>
                                    </Col>
                                    <Col xs="3">
                                        <InputGroup>
                                        <Form.Control onChange={(e) => updateRemaining(e.target.value)} required type="number" name="quantity" disabled={!usageSpareParts.remaining || usageSpareParts.remaining === 0} max={usageSpareParts.remaining || 0} step={decimalPointUomAvailable(usageSpareParts.unit) ? 0.1 : 1} min={decimalPointUomAvailable(usageSpareParts.unit) ? 0.1 : 1}></Form.Control>
                                        <InputGroup.Text>{usageSpareParts.unit}</InputGroup.Text>
                                        </InputGroup>
                                    </Col>
                                </Row>
                                { existingServices.length > 0 && 
                                <Row>
                                    <Col xs="3"></Col>
                                    <Col>
                                        {
                                            existingServices.map((v, i) => <Form.Check key={i} type="radio" 
                                                onChange={() => afterChooseExistingService(v)} 
                                                name="serviceId" value={v.id} 
                                                checked={existingServices.length === 1}
                                                label={`Service started at ${v.startDate}`} />)
                                        }
                                    </Col>
                                </Row>
                                }
                                </React.Fragment>
                            
                            )
                        }
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

export default SparePartsUsageDialog