import React, { useRef, useState } from "react"
import { Container, Form, Modal, Row, Col, Button, InputGroup, FloatingLabel, Card, FormLabel, Image } from "react-bootstrap"
import { Typeahead } from "react-bootstrap-typeahead"
import formatThousandSeparator from "../utils/numberUtils"
import { maintenanceServiceKm } from "./maintenanceService"
import { addMonthsToDateStr } from "../utils/dateUtils"
import { Calendar, Company, Inspection, Insurance, Roadtax, Services, Trailer, Truck } from "../Icons"

function VehicleUpdateDialog({isShow, setShowDialog, vehicle, setVehicles, companies}) {

    const apiUrl = process.env.REACT_APP_API_URL

    const formRef = useRef()
    const [validated, setValidated] = useState(false)

    const [selectedCompanies, setSelectedCompanies] = useState([])
    const [differentDueForTrailer, setDifferentDueForTrailer] = useState(false)

    const [showMap, setShowMap] = useState(false)

    const onShowingDialog = () => {
        if (vehicle?.companyId) {
            setSelectedCompanies([companies.find(co => co.id === vehicle.companyId)])
        }
        if (vehicle?.inspectionDueDate !== vehicle?.trailerInspectionDueDate) {
            setDifferentDueForTrailer(true)
        }
    }

    const handleClose = () => {
        setValidated(false)
        setShowDialog(false)
        setDifferentDueForTrailer(false)
        setSelectedCompanies([])
        setShowMap(false)
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

        checkCompanyValidity(nativeForm.elements.namedItem('companyId'))
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }
        nativeForm.elements.namedItem('companyId').setCustomValidity('')

        const toSave = {
            id: vehicle.id,
            vehicleNo: vehicle.vehicleNo,
            trailerNo: nativeForm.elements.namedItem('trailerNo').value,
            companyId: selectedCompanies[0].id,
            insuranceExpiryDate: nativeForm.elements.namedItem('insuranceExpiryDate').value,
            roadTaxExpiryDate: nativeForm.elements.namedItem('roadTaxExpiryDate').value,
            inspectionDueDate: nativeForm.elements.namedItem('inspectionDueDate').value,
            trailerInspectionDueDate: nativeForm.elements.namedItem('trailerInspectionDueDate') ? nativeForm.elements.namedItem('trailerInspectionDueDate').value : nativeForm.elements.namedItem('inspectionDueDate').value,
            nextInspectionDate: nativeForm.elements.namedItem('nextInspectionDate').value,
            nextTrailerInspectionDate: nativeForm.elements.namedItem('nextTrailerInspectionDate') ? nativeForm.elements.namedItem('nextTrailerInspectionDate').value : nativeForm.elements.namedItem('nextInspectionDate').value
        }

        fetch(`${apiUrl}/api/vehicles`, {
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
                        <Row className="mb-3" lg="6">
                            <Col xs="12" lg="6" className="mb-2">
                                <InputGroup>
                                <InputGroup.Text><Truck /></InputGroup.Text>
                                <FloatingLabel label="Vehicle No" controlId="floatingVehicleNo">
                                <Form.Control plaintext readOnly name="vehicleNo" defaultValue={vehicle?.vehicleNo}></Form.Control>
                                </FloatingLabel>
                                </InputGroup>
                            </Col>
                            <Col xs="12" lg="6">
                                <InputGroup>
                                <InputGroup.Text><Trailer /></InputGroup.Text>
                                <FloatingLabel label="Trailer No">
                                <Form.Control name="trailerNo" placeholder="Key in trailer no" defaultValue={vehicle?.trailerNo}></Form.Control>
                                </FloatingLabel>
                                </InputGroup>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                                <InputGroup>
                                <InputGroup.Text><Company /></InputGroup.Text>
                                    <Typeahead
                                        id="typeahead-company"
                                        disabled={selectedCompanies[0]?.internal && vehicle.companyId === selectedCompanies[0].id}
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
                            <Card>
                                <Card.Body>
                                    <Row>
                                    <Col xs="12" lg="6">
                                        <InputGroup className="mb-3">
                                        <InputGroup.Text><Insurance /></InputGroup.Text>
                                        <FloatingLabel label="Insurance Expiry Date">
                                        <Form.Control type="date" required={selectedCompanies[0]?.internal} name="insuranceExpiryDate" defaultValue={vehicle?.insuranceExpiryDate}></Form.Control>
                                        </FloatingLabel>
                                        </InputGroup>
                                    </Col>
                                    <Col xs="12" lg="6">
                                        <InputGroup>
                                        <InputGroup.Text><Roadtax /></InputGroup.Text>
                                        <FloatingLabel label="Road Tax Expiry Date">
                                        <Form.Control type="date" required={selectedCompanies[0]?.internal} name="roadTaxExpiryDate" defaultValue={vehicle?.roadTaxExpiryDate}></Form.Control>
                                        </FloatingLabel>
                                        </InputGroup>
                                    </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                        <Col>
                            <Card>
                                <Card.Body>
                                <Card.Subtitle className="mb-2"><Inspection /> Inspections</Card.Subtitle>
                                <Row>
                                    <Col xs="12" lg="6">
                                        <InputGroup className="mb-2">
                                        <InputGroup.Text><Inspection /></InputGroup.Text>
                                        <FloatingLabel label="Inspection Due Date">
                                        <Form.Control type="date" required={selectedCompanies[0]?.internal} name="inspectionDueDate" defaultValue={vehicle?.inspectionDueDate}></Form.Control>
                                        </FloatingLabel>
                                        </InputGroup>
                                        {!differentDueForTrailer && <FormLabel className="text-secondary form-text"><span role="button" onClick={() => setDifferentDueForTrailer(true)}>Different for Trailer</span></FormLabel> }
                                        { differentDueForTrailer &&
                                        <>
                                        <InputGroup>
                                        <InputGroup.Text><Trailer /></InputGroup.Text>
                                        <FloatingLabel label="Trailer Inspection Due">
                                        <Form.Control type="date" required={selectedCompanies[0]?.internal} name="trailerInspectionDueDate" defaultValue={vehicle?.trailerInspectionDueDate}></Form.Control>
                                        </FloatingLabel>
                                        </InputGroup> 
                                        <FormLabel className="text-secondary form-text"><span role="button" onClick={() => setDifferentDueForTrailer(false)}>Cancel, they are same</span></FormLabel>
                                        </>
                                        }
                                    </Col>
                                    <Col>
                                        <InputGroup className="mb-2">
                                        <InputGroup.Text><Calendar /></InputGroup.Text>
                                        <FloatingLabel label="Next Inspection Booked">
                                        <Form.Control type="date" name="nextInspectionDate" defaultValue={vehicle?.nextInspectionDate}></Form.Control>
                                        </FloatingLabel>
                                        </InputGroup>
                                        { differentDueForTrailer &&
                                            <InputGroup>
                                            <InputGroup.Text><Calendar /></InputGroup.Text>
                                            <FloatingLabel label="Booked for Trailer">
                                            <Form.Control type="date"  name="nextTrailerInspectionDate" defaultValue={vehicle?.nextTrailerInspectionDate}></Form.Control>
                                            </FloatingLabel>
                                            </InputGroup> 
                                        }
                                    </Col>
                                </Row>
                                <Row>
                                    <Col xs="12" lg="6">
                                        <Form.Group>
                                            <FloatingLabel label="Last Inspection Work">
                                            <Form.Control plaintext readOnly defaultValue={vehicle?.lastInspection ? `${vehicle?.lastInspection?.startDate}` : '-' } />
                                            </FloatingLabel>
                                        </Form.Group>
                                    </Col>
                                    <Col xs="12" lg="6">
                                        <Form.Group>
                                            <FloatingLabel label="Next Inspection Work (Estimated)">
                                            <Form.Control plaintext readOnly defaultValue={vehicle?.lastInspection ? addMonthsToDateStr(vehicle?.lastInspection?.startDate, 6) : '-'} /> 
                                            </FloatingLabel>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Card>
                                    <Card.Body>
                                        <Card.Subtitle className="mb-2"><Services /> Services</Card.Subtitle>
                                        <Row>
                                            <Col xs="12" lg="4">
                                                <Form.Group>
                                                    <FloatingLabel label="Latest Mileage">
                                                    <Form.Control plaintext readOnly defaultValue={vehicle?.latestMileageKm ? `${vehicle?.latestMileageKm} KM` : '-'} />
                                                    </FloatingLabel>
                                                </Form.Group>
                                            </Col>
                                            <Col xs="12" lg="4">
                                                <Form.Group>
                                                    <FloatingLabel label="Last Service">
                                                    <Form.Control plaintext readOnly defaultValue={vehicle?.lastService?.mileageKm ? `${vehicle?.lastService?.mileageKm} KM @ ${vehicle?.lastService?.startDate}` : '-' } /> 
                                                    </FloatingLabel>
                                                </Form.Group>
                                            </Col>
                                            <Col xs="12" lg="4">
                                                <Form.Group>
                                                    <FloatingLabel label={`Next Service (every ${formatThousandSeparator(maintenanceServiceKm)}KM)`}>
                                                    <Form.Control plaintext readOnly defaultValue={(vehicle?.lastService?.mileageKm && vehicle?.latestMileageKm) ? (((vehicle?.latestMileageKm - vehicle?.lastService?.mileageKm) > maintenanceServiceKm) ? 'Do it now!' : `${maintenanceServiceKm - (vehicle?.latestMileageKm - vehicle?.lastService?.mileageKm)} KM more to go`) : 'No Service/Distance Recorded' } /> 
                                                    </FloatingLabel>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                        </Row>
                        { selectedCompanies[0]?.internal && <Row>
                            <Col><Button variant="link" onClick={() => setShowMap(prev => !prev)}>{showMap ? 'Hide the map' : 'Where are they now?' }</Button></Col>
                        </Row> }
                        { showMap && <Row>
                            <Col>
                                <Card>
                                    <Card.Body className="p-3 mx-auto">
                                    <Image width={640} height={640} 
                                        src={`${apiUrl}/api/vehicles/${vehicle.id}/gps`}></Image>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row> }
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