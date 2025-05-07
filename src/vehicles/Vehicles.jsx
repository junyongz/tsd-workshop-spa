import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, ListGroup, ListGroupItem, Row, Stack } from "react-bootstrap";
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
    }, [apiUrl])

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
                        <Col xs={!showInternalOnly ? "2" : "3" }><Truck /> Plate No</Col>
                        {!showInternalOnly && <Col xs="3"><Company /> Company</Col> }
                        <Col>Last Recorded Mileage</Col>
                        <Col>Dates</Col>
                        <Col><Services /> Last Services</Col>
                    </Stack>
                </ListGroupItem>
                { vehicles.filter(veh => !showInternalOnly || (showInternalOnly && companies.find(co => co.id === veh.companyId)?.internal))
                    .map(v => 
                    <ListGroupItem key={v.id}>
                        <Stack direction="horizontal">
                            <Col xs={!showInternalOnly ? "2" : "3" }><Button variant="link" onClick={() => showVehicle(v.id)}>{v.vehicleNo}</Button><span>{v.trailerNo}</span></Col>
                            {!showInternalOnly && <Col xs="3">{companies.find(co => co.id === v.companyId)?.companyName}</Col>}
                            <Col>{v.latestMileageKm ? `${formatThousandSeparator(v.latestMileageKm)} KM` : '-'}</Col>
                            <Col>
                            {v.insuranceExpiryDate && <div><Insurance /> <span className="text-secondary">Insurance</span> {v.insuranceExpiryDate}</div>}
                            {v.roadTaxExpiryDate && <div><Roadtax /> <span className="text-secondary">Roadtax</span> {v.roadTaxExpiryDate}</div>}
                            {v.inspectionDueDate && <div><Inspection /> <span className="text-secondary">Inspection</span> {v.inspectionDueDate}</div>}
                            </Col>
                            <Col> 
                                <VehicleServices lastService={serviceByVehicle[v.vehicleNo]} 
                                    lastInspection={inspectionByVehicle[v.vehicleNo]} 
                                    vehicle={v} />
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