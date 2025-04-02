import { useRef, useState } from "react"
import { Container, Form, Modal, Row, Col, Button, InputGroup } from "react-bootstrap"
import { Typeahead } from "react-bootstrap-typeahead"

function SparePartsUsageDialog({isShow, setShowDialog, vehicles, 
    usageSpareParts, setUsageSpareParts, onSaveNewSparePartUsage,
    onNewVehicleCreated=() => {}}) {

    const formRef = useRef()
    const [validated, setValidated] = useState(false)
    const [selectedVehicles, setSelectedVehicles] = useState([])
    const [remaining, setRemaining] = useState(usageSpareParts.remaining)

    const [records, setRecords] = useState(1)

    const handleClose = () => {
        setValidated(false)
        setShowDialog(false)
        // setRecords(1)
        setUsageSpareParts({})
        setSelectedVehicles([])
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

        const usageDate = nativeForm['usageDate'].value
        const vehicleNo = selectedVehicles[0].vehicleNo
        const quantity = nativeForm['quantity'].value

        onSaveNewSparePartUsage({
            vehicleNo: vehicleNo,
            usageDate: usageDate,
            orderId: usageSpareParts.id,
            quantity: quantity
        })

        handleClose()
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

    const addNewItem = () => {
        setRecords(r => r + 1)
    }

    return (
        <Modal show={isShow} onHide={handleClose} onShow={() => setRemaining(usageSpareParts.remaining)} size="lg">
            <Modal.Header closeButton>
            <Modal.Title>
                <div><i className="bi bi-tools"></i> {usageSpareParts.partName}, tinggal lagi: {remaining} {usageSpareParts.unit}</div>
                <div className="text-body-secondary fs-6">Order {usageSpareParts.deliveryOrderNo} from {usageSpareParts.supplierName} @ {usageSpareParts.invoiceDate} </div>
            </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    { false && <Button onClick={addNewItem}>Add New</Button> }
                    <Form ref={formRef} validated={validated}>
                        {
                            Array.from({length: records}, (_, i) =>
                                <Row key={i} className="mb-1">
                                    <Col sm="3">
                                        <InputGroup>
                                        <InputGroup.Text><i className="bi bi-calendar-event"></i></InputGroup.Text>
                                        <Form.Control required type="date" name="usageDate" disabled={!usageSpareParts.quantity || usageSpareParts.quantity === 0}></Form.Control>
                                        </InputGroup>
                                    </Col>
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
                                            selected={selectedVehicles}
                                            placeholder="Choose a vehicle..."
                                            clearButton
                                            disabled={!usageSpareParts.quantity || usageSpareParts.quantity === 0}
                                            />
                                    </InputGroup>
                                    </Col>
                                    <Col sm="3">
                                        <InputGroup>
                                        <Form.Control onChange={(e) => updateRemaining(e.target.value)} required type="number" name="quantity" disabled={!usageSpareParts.remaining || usageSpareParts.remaining === 0} max={usageSpareParts.remaining || 0} min={1}></Form.Control>
                                        <InputGroup.Text>{usageSpareParts.unit}</InputGroup.Text>
                                        </InputGroup>
                                    </Col>
                                </Row>
                            
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