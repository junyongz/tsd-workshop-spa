import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, ListGroup, ListGroupItem, Row } from "react-bootstrap";
import VehicleUpdateDialog from "./VehicleUpdateDialog";
import formatThousandSeparator from "../utils/numberUtils";
import VehicleServices from "./VehicleServices";
import { Company, Inspection, Insurance, Roadtax, Services, Truck } from "../Icons";

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
        <Col>
            <ListGroup>
                <ListGroupItem key={'header'}>
                    <Row>
                        <Col xs={!showInternalOnly ? "5" : "6" } md={!showInternalOnly ? "2" : "3" }><Truck /> Plate No</Col>
                        {!showInternalOnly && <Col xs="6" md="2"><Company /> Company</Col> }
                        <Col xs={!showInternalOnly ? "5" : "6" } md={!showInternalOnly ? "2" : "3" }>Last Recorded Mileage</Col>
                        <Col xs={false} md="3">Dates</Col>
                        <Col xs={false} md="3"><Services /> Last Services</Col>
                    </Row>
                </ListGroupItem>
                { vehicles.filter(veh => !showInternalOnly || (showInternalOnly && companies.find(co => co.id === veh.companyId)?.internal))
                    .map(v => 
                    <ListGroupItem key={v.id}>
                        <Row>
                            <Col xs={!showInternalOnly ? "5" : "6" } md={!showInternalOnly ? "2" : "3" }><Button variant="link" onClick={() => showVehicle(v.id)}>{v.vehicleNo}</Button><span>{v.trailerNo}</span></Col>
                            {!showInternalOnly && <Col xs="6" md="2">{companies.find(co => co.id === v.companyId)?.companyName}</Col>}
                            <Col xs={!showInternalOnly ? "5" : "6" } md={!showInternalOnly ? "2" : "3" }>{v.latestMileageKm ? `${formatThousandSeparator(v.latestMileageKm)} KM` : '-'}</Col>
                            <Col xs={false} md="3">
                            {v.insuranceExpiryDate && <div><Insurance /> <span className="text-secondary">Insurance</span> {v.insuranceExpiryDate}</div>}
                            {v.roadTaxExpiryDate && <div><Roadtax /> <span className="text-secondary">Roadtax</span> {v.roadTaxExpiryDate}</div>}
                            {v.inspectionDueDate && <div><Inspection /> <span className="text-secondary">Inspection</span> {v.inspectionDueDate}</div>}
                            </Col>
                            <Col xs={false} md="3"> 
                                <VehicleServices lastService={serviceByVehicle[v.vehicleNo]} 
                                    lastInspection={inspectionByVehicle[v.vehicleNo]} 
                                    vehicle={v} />
                             </Col>
                        </Row>
                    </ListGroupItem>
                  )
                }
            </ListGroup>
        </Col>
        </Row>
        </Container>
    )
}