import React, { useRef, useState } from "react"
import { Container, Form, Modal, Row, Col, Button, InputGroup } from "react-bootstrap"
import { Typeahead } from "react-bootstrap-typeahead"
import { NoteTaking, Truck } from "../Icons"
import { months3EngChars } from "../utils/dateUtils"
import { mapToCalendarEvent } from "./mappingUtils.js"

function NewSchedulingDialog({isShow, setShowDialog, vehicles, theDate = new Date(), onNewVehicleCreated, setEvents}) {

    const apiUrl = process.env.REACT_APP_API_URL

    const formRef = useRef()
    const [validated, setValidated] = useState(false)
    const [selectedVehicles, setSelectedVehicles] = useState()

    const onShowingDialog = () => {
    }

    const handleClose = () => {
        setValidated(false)
        setShowDialog(false)
        setSelectedVehicles()
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

    const addOrUpdateVehicles = ([veh]) => {
        if (veh) {
            if (vehicles.findIndex(v => v.vehicleNo === veh?.vehicleNo) === -1) {
                onNewVehicleCreated(veh.vehicleNo)
                .then(stored => setSelectedVehicles([stored]))
            }
            else {
                setSelectedVehicles([veh])
            }
        }
        else {
            setSelectedVehicles([])
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

        const toSave = {
            scheduledDate: theDate.toLocaleDateString('en-CA'),
            vehicleId: selectedVehicles[0]?.id,
            vehicleNo: selectedVehicles[0]?.vehicleNo,
            notes: nativeForm['notes'].value
        }

        fetch(`${apiUrl}/api/scheduling`, {
            method: 'POST', 
            body: JSON.stringify(toSave), 
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) {
                console.trace("Issue with POST scheduling: " + JSON.stringify(res.body))
                throw Error("not good")
            }
            return res.json()
        })
        .then(schJson => setEvents(prev => [...prev, mapToCalendarEvent(schJson)]))
        .finally(() => handleClose())
    }

    return (
        <Modal show={isShow} onHide={handleClose} onShow={() => onShowingDialog()} size="md">
            <Modal.Header closeButton>
            <Modal.Title>
                <div>Scheduling for <span className="fw-bold">{theDate.getDate()} {months3EngChars[theDate.getMonth()]} {theDate.getFullYear()}</span></div>
            </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Row>
                            <Col xs="12" className="mb-3">
                                <InputGroup>
                                <InputGroup.Text><Truck /></InputGroup.Text>
                                <Typeahead
                                    allowNew
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
                                    clearButton 
                                    />
                                </InputGroup>
                            </Col>
                            <Col xs="12">
                                <InputGroup>
                                <InputGroup.Text><NoteTaking /></InputGroup.Text>
                                <Form.Control required name="notes" as="textarea" rows={5} placeholder="What to take note?"></Form.Control>
                                </InputGroup>
                            </Col>
                        </Row>
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

export default NewSchedulingDialog