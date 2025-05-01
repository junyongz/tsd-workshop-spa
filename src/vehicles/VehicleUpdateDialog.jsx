import React, { useRef, useState } from "react"
import { Container, Form, Modal, Row, Col, Button, InputGroup, FloatingLabel } from "react-bootstrap"
import { Typeahead } from "react-bootstrap-typeahead"

function VehicleUpdateDialog({isShow, setShowDialog, vehicle, setVehicles, companies}) {

    const apiUrl = process.env.REACT_APP_API_URL

    const formRef = useRef()
    const [validated, setValidated] = useState(false)

    const [selectedCompanies, setSelectedCompanies] = useState([])

    const onShowingDialog = () => {
        if (vehicle?.companyId) {
            setSelectedCompanies([companies.find(co => co.id === vehicle.companyId)])
        }
    }

    const addMonthsToDate = (dateVal, monthNum) => {
        const aDate = new Date(dateVal)
        aDate.setMonth(aDate.getMonth() + monthNum)
        return aDate
    }

    const handleClose = () => {
        setValidated(false)
        setShowDialog(false)
        setSelectedCompanies([])
    }

    const checkCompanyValidity = (companyInput) => {
        if (companyInput) {
            if (companies.findIndex(co => co.companyName === companyInput.value) === -1) {
                companyInput.setCustomValidity('not a valid company, either choose one and create one first')
            }
            else {
                companyInput.setCustomValidity('')
            }
        }
    }

    const saveChange = () => {
        const nativeForm = formRef.current

        checkCompanyValidity(nativeForm['companyId'])
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }
        nativeForm['companyId'].setCustomValidity('')

        const toSave = {
            id: vehicle.id,
            vehicleNo: vehicle.vehicleNo,
            trailerNo: nativeForm['trailerNo'].value,
            companyId: selectedCompanies[0].companyId,
            insuranceExpiryDate: nativeForm['insuranceExpiryDate'].value,
            roadTaxExpiryDate: nativeForm['roadTaxExpiryDate'].value
        }

        fetch(`${apiUrl}/vehicles`, {
            method: 'POST', 
            body: JSON.stringify(toSave), 
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) {
                console.trace("Issue with POST vehicle: " + JSON.stringify(res.body))
                throw Error("not good")
            }
            return res.json()
        })
        .then(saved => {
            setVehicles(prevVehicles => {
                const idx = prevVehicles.findIndex(veh => veh.id === saved.id)
                const newVehicles = [...prevVehicles]
                newVehicles[idx] = saved
                return newVehicles
            })
            handleClose()
        })
        .finally(() => handleClose())
    }

    return (
        <Modal show={isShow} onHide={handleClose} onShow={() => onShowingDialog()} size="lg">
            <Modal.Header closeButton>
            <Modal.Title>
                <div>{vehicle?.vehicleNo}</div>
            </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Row className="mb-3">
                            <Col>
                                <InputGroup>
                                <InputGroup.Text><i className="bi bi-truck"></i></InputGroup.Text>
                                <FloatingLabel label="Vehicle No" controlId="floatingVehicleNo">
                                <Form.Control plaintext readOnly name="vehicleNo" defaultValue={vehicle?.vehicleNo}></Form.Control>
                                </FloatingLabel>
                                </InputGroup>
                            </Col>
                            <Col>
                                <InputGroup>
                                <InputGroup.Text><i className="bi bi-truck-flatbed"></i></InputGroup.Text>
                                <FloatingLabel label="Trailer No">
                                <Form.Control name="trailerNo" placeholder="Key in trailer no" defaultValue={vehicle?.trailerNo}></Form.Control>
                                </FloatingLabel>
                                </InputGroup>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                                <InputGroup>
                                <InputGroup.Text><i className="bi bi-buildings"></i></InputGroup.Text>
                                    <Typeahead
                                        disabled={selectedCompanies[0]?.internal}
                                        inputProps={{required:true, name: 'companyId'}}
                                        labelKey='companyName'
                                        options={companies}
                                        onChange={(opts) => setSelectedCompanies(opts)}
                                        placeholder="Choose a company..."
                                        selected={selectedCompanies}
                                        clearButton
                                        />
                                </InputGroup>
                        </Row>
                        <Row className="mb-3">
                            <Col>
                                <InputGroup>
                                <InputGroup.Text><i className="bi bi-journal-text"></i></InputGroup.Text>
                                <FloatingLabel label="Insurance Expiry Date">
                                <Form.Control required type="date" name="insuranceExpiryDate" defaultValue={vehicle?.insuranceExpiryDate}></Form.Control>
                                </FloatingLabel>
                                </InputGroup>
                            </Col>
                            <Col>
                                <InputGroup>
                                <InputGroup.Text><i className="bi bi-sign-turn-slight-right"></i></InputGroup.Text>
                                <FloatingLabel label="Road Tax Expiry Date">
                                <Form.Control required type="date" name="roadTaxExpiryDate" defaultValue={vehicle?.roadTaxExpiryDate}></Form.Control>
                                </FloatingLabel>
                                </InputGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs="3">
                                <Form.Group>
                                    <FloatingLabel label="Latest Mileage">
                                    <Form.Control plaintext readOnly defaultValue={vehicle?.latestMileageKm ? `${vehicle?.latestMileageKm} KM` : '-'} />
                                    </FloatingLabel>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <FloatingLabel label="Last Service">
                                    <Form.Control plaintext readOnly defaultValue={vehicle?.lastService?.mileageKm ? `${vehicle?.lastService?.mileageKm} KM @ ${vehicle?.lastService?.startDate}` : 'No Last Service Recorded' } /> 
                                    </FloatingLabel>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <FloatingLabel label="Next Service">
                                    <Form.Control plaintext readOnly defaultValue={(vehicle?.lastService?.mileageKm && vehicle?.latestMileageKm) ? `${vehicle?.latestMileageKm - vehicle?.lastService?.mileageKm} KM more to go` : 'No Service/Distance Recorded' } /> 
                                    </FloatingLabel>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs="4">
                                <Form.Group>
                                    <FloatingLabel label="Last Inspection">
                                    <Form.Control plaintext readOnly defaultValue={vehicle?.lastInspection?.mileageKm ? `${vehicle?.lastInspection?.mileageKm} KM @ ${vehicle?.lastInspection?.startDate}` : 'No Last Inspection Recorded' } />
                                    </FloatingLabel>
                                </Form.Group>
                            </Col>
                            <Col xs="4">
                                <Form.Group>
                                    <FloatingLabel label="Next Inspection">
                                    <Form.Control plaintext readOnly defaultValue={vehicle?.lastInspection?.mileageKm ? addMonthsToDate(vehicle?.lastInspection?.startDate, 6) : '-'} /> 
                                    </FloatingLabel>
                                </Form.Group>
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

export default VehicleUpdateDialog