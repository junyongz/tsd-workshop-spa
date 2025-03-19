import { useRef, useState } from "react"
import { Container, Form, Modal, Row, Col, Button } from "react-bootstrap"
import { Typeahead } from "react-bootstrap-typeahead"

function SparePartsUsageDialog({isShow, setShowDialog, vehicles, setVehicles, usageSpareParts, setUsageSpareParts}) {

    const formRef = useRef()
    const [validated, setValidated] = useState(false)
    const [selectedVehicles, setSelectedVehicles] = useState([])
    const [remaining, setRemaining] = useState(usageSpareParts.quantity)

    const [records, setRecords] = useState(1)

    const handleClose = () => {
        setValidated(false)
        setShowDialog(false)
        // setRecords(1)
        setUsageSpareParts({})
        setSelectedVehicles([])
    }

    const updateRemaining = (qty) => {
        setRemaining(usageSpareParts.quantity - qty)
    }

    const saveChange = () => {
        const nativeForm = formRef.current
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }

        // fire API
    }

    const addOrUpdateVehicles = ([veh]) => {
        if (veh) {
            if (vehicles.findIndex(v => v.vehicleNo === veh?.vehicleNo) === -1) {
                setVehicles(prevs => [...prevs, {vehicleNo: veh.vehicleNo}])
                // TODO: api to add new vehicle, but for now internally only
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
        <Modal show={isShow} onHide={handleClose} onShow={() => setRemaining(usageSpareParts.quantity)} size="lg">
            <Modal.Header closeButton>
            <Modal.Title>
                <div>{usageSpareParts.partName}, tinggal lagi: {remaining}</div>
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
                                        <Form.Control required type="date" name="usageDate" disabled={!usageSpareParts.quantity || usageSpareParts.quantity === 0}></Form.Control>
                                    </Col>
                                    <Col>
                                        <Typeahead
                                            allowNew
                                            newSelectionPrefix="Add a new vehicle: "
                                            inputProps={{required:true}}
                                            id="vehicle-select"
                                            labelKey='vehicleNo'
                                            options={vehicles}
                                            onChange={(vehs) => addOrUpdateVehicles(vehs)}
                                            selected={selectedVehicles}
                                            placeholder="Choose a vehicle..."
                                            clearButton
                                            disabled={!usageSpareParts.quantity || usageSpareParts.quantity === 0}
                                            />
                                    </Col>
                                    <Col sm="2">
                                        <Form.Control onChange={(e) => updateRemaining(e.target.value)} required type="number" name="quantity" disabled={!usageSpareParts.quantity || usageSpareParts.quantity === 0} max={usageSpareParts.quantity || 0} min={1}></Form.Control>
                                    </Col>
                                </Row>
                            
                            )
                        }
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

export default SparePartsUsageDialog