import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, InputGroup, ListGroup, ListGroupItem, Row, Stack } from "react-bootstrap";
import VehicleUpdateDialog from "./VehicleUpdateDialog";

export default function Vehicles({vehicles=[], setVehicles, companies=[]}) {

    const apiUrl = process.env.REACT_APP_API_URL

    const [serviceByVehicle, setServiceByVehicle] = useState({})
    const [inspectionByVehicle, setInspectionByVehicle] = useState({})
    const [selectedVehicle, setSelectedVehicle] = useState()
    const [showDialog, setShowDialog] = useState(false)
    const [showInternalOnly, setShowInternalOnly] = useState(true)

    const showVehicle = (vehicleId) => {
        const veh = vehicles.find(veh => veh.id === vehicleId)
        setSelectedVehicle({...veh, lastService: serviceByVehicle[veh.vehicleNo], lastInspection: inspectionByVehicle[veh.vehicleNo]})
        setShowDialog(true)
    }

    useEffect(() => {
        fetch(`${apiUrl}/workshop-services?type=SERVICE`, {
            method: 'GET', 
            headers: {
              'Content-type': 'application/json'
            }
          })
          .then(res => res.json())
          .then(services => {
            setServiceByVehicle(services.reduce((pv, cv) => {
                pv[cv.vehicleNo] = cv
                return pv
            }, {}))
          })

          fetch(`${apiUrl}/workshop-services?type=INSPECTION`, {
            method: 'GET', 
            headers: {
              'Content-type': 'application/json'
            }
          })
          .then(res => res.json())
          .then(inspections => {
            setInspectionByVehicle(inspections.reduce((pv, cv) => {
                pv[cv.vehicleNo] = cv
                return pv
            }, {}))
          })
    }, [])

    return (
        <Container>
        <Row>
            <VehicleUpdateDialog isShow={showDialog} setShowDialog={setShowDialog} 
                vehicle={selectedVehicle} setVehicles={setVehicles} companies={companies}></VehicleUpdateDialog>
        </Row>
        <Row className="mb-1">
            <Col>
            <Form.Check
                onClick={() => setShowInternalOnly(!showInternalOnly)}
                defaultChecked={showInternalOnly}
                type="switch"
                id="custom-switch"
                label={`Only showing for ${companies.find(co => co.internal === true)?.companyName}`}
            />
            </Col>
        </Row>
        <Row className="mb-3">
        <Col>
            <ListGroup>
                <ListGroupItem key={'header'}>
                    <Stack direction="horizontal">
                        <Col><i className="bi bi-truck"></i> Plate No</Col>
                        <Col><i className="bi bi-truck-flatbed"></i> Trailer No</Col>
                        <Col xs="3"><i className="bi bi-buildings"></i> Company</Col>
                        <Col><i className="bi bi-journal-text"></i> Insurance Expiry</Col>
                        <Col><i className="bi bi-sign-turn-slight-right"></i> Road Tax Expiry</Col>
                        <Col><i className="bi bi-wrench-adjustable"></i> Services</Col>
                    </Stack>
                </ListGroupItem>
                { vehicles.filter(veh => !showInternalOnly || (showInternalOnly && companies.find(co => co.id === veh.companyId)?.internal))
                    .map(v => 
                    <ListGroupItem key={v.id}>
                        <Stack direction="horizontal">
                            <Col><Button variant="link" onClick={() => showVehicle(v.id)}>{v.vehicleNo}</Button></Col>
                            <Col>{v.trailerNo}</Col>
                            <Col xs="3">{companies.find(co => co.id === v.companyId)?.companyName}</Col>
                            <Col>{v.insuranceExpiryDate}</Col>
                            <Col>{v.roadTaxExpiryDate}</Col>
                            <Col> 
                            {serviceByVehicle[v.vehicleNo] && serviceByVehicle[v.vehicleNo].mileageKm ? <React.Fragment><div>Maintenace Service:</div><div>{serviceByVehicle[v.vehicleNo].mileageKm} KM @ {serviceByVehicle[v.vehicleNo].startDate}</div></React.Fragment> : ''}
                            {inspectionByVehicle[v.vehicleNo] && inspectionByVehicle[v.vehicleNo].mileageKm ? <React.Fragment><div>Inspection:</div><div>{inspectionByVehicle[v.vehicleNo].mileageKm} KM @ {inspectionByVehicle[v.vehicleNo].startDate}</div></React.Fragment> : ''}
                             </Col>
                        </Stack>
                    </ListGroupItem>
                  )
                }
            </ListGroup>
        </Col>
        </Row>
        </Container>

    )
}