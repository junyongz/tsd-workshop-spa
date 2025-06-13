import React, { useEffect, useState } from "react";
import { Button, Card, Col, Container, Form, ListGroup, ListGroupItem, Row } from "react-bootstrap";
import VehicleUpdateDialog from "./VehicleUpdateDialog";
import formatThousandSeparator from "../utils/numberUtils";
import VehicleServices from "./VehicleServices";
import { Company, Inspection, Insurance, Roadtax, Services, Truck } from "../Icons";

export default function Vehicles({vehicles=[], setVehicles, companies=[], selectedSearchOptions=[]}) {

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
        fetch(`${apiUrl}/api/workshop-services?type=SERVICE`, {
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

          fetch(`${apiUrl}/api/workshop-services?type=INSPECTION`, {
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
    }, [apiUrl])

    return (
        <Container fluid>
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
            { vehicles.filter(veh => !showInternalOnly || (showInternalOnly && companies.find(co => co.id === veh.companyId)?.internal))
                .filter(veh => !selectedSearchOptions || selectedSearchOptions.length === 0 || selectedSearchOptions.some(sso => sso.name === veh.vehicleNo))
                .map(v => 
                    <Col xs="12" sm="6" md="4" lg="3" className="mb-3">
                    <Card role="button" key={v.id} onClick={() => showVehicle(v.id)}>
                        <Card.Header>
                            <Row>
                                <Col xs="12" lg="6"><h3>{v.vehicleNo}</h3></Col>
                                <Col xs="12" lg="6" className="align-content-center text-lg-end"><h5>{v.trailerNo}</h5></Col>
                            </Row>
                            {!showInternalOnly && <h5>{ companies.find(co => co.id === v.companyId)?.companyName }</h5>}
                        </Card.Header>
                        <Card.Body>
                            <Row className="mb-1 fs-5">
                                <Col>
                                {v.latestMileageKm ? `${formatThousandSeparator(v.latestMileageKm)} KM` : '-'}
                                </Col>
                            </Row>
                            <Row className="mb-1">
                                <Col>
                                {v.insuranceExpiryDate && <div><Insurance /> <span className="text-secondary">Insurance</span> {v.insuranceExpiryDate}</div>}
                                {v.roadTaxExpiryDate && <div><Roadtax /> <span className="text-secondary">Roadtax</span> {v.roadTaxExpiryDate}</div>}
                                {v.inspectionDueDate && <div><Inspection /> <span className="text-secondary">Inspection</span> {v.inspectionDueDate}</div>}
                                </Col>
                            </Row>
                            <Row className="mb-1">
                                <Col>
                                <VehicleServices lastService={serviceByVehicle[v.vehicleNo]} 
                                    lastInspection={inspectionByVehicle[v.vehicleNo]} 
                                    vehicle={v} />
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                    </Col>
                )
            }
            
        </Row>
        </Container>
    )
}