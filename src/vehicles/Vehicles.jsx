import { useEffect, useState } from "react";
import { Card, Col, Container, Form, Row, Stack } from "react-bootstrap";
import VehicleUpdateDialog from "./VehicleUpdateDialog";
import formatThousandSeparator from "../utils/numberUtils";
import VehicleServices from "./VehicleServices";
import { HandPointer, Inspection, Insurance, Roadtax } from "../Icons";
import { addMonthsToDate } from "../utils/dateUtils";
import { useService } from "../services/ServiceContextProvider";

/**
 * 
 * @param {Object} props
 * @param {Object[]} props.vehicles
 * @param {React.SetStateAction<Object[]>} props.setVehicles
 * @param {Object[]} props.companies
 * @param {Object[]} props.selectedSearchOptions
 * @param {string} props.selectedSearchOptions[].name
 * @returns 
 */
export default function Vehicles({vehicles, setVehicles, companies, selectedSearchOptions}) {
    const services = useService()

    const [serviceByVehicle, setServiceByVehicle] = useState({})
    const [inspectionByVehicle, setInspectionByVehicle] = useState({})
    const [selectedVehicle, setSelectedVehicle] = useState()
    const [showDialog, setShowDialog] = useState(false)
    const [showInternalOnly, setShowInternalOnly] = useState(true)
    
    const [toSortByServiceDueSoon, setToSortByServiceDueSoon] = useState(false)
    const [toSortByInspectionDueSoon, setToSortByInspectionDueSoon] = useState(false)

    const [vehicleLoadCount, setVehicleLoadCount] = useState(12)

    const showVehicle = (vehicleId) => {
        const veh = vehicles.find(veh => veh.id === vehicleId)
        setSelectedVehicle({...veh, lastService: serviceByVehicle[veh.vehicleNo], lastInspection: inspectionByVehicle[veh.vehicleNo]})
        setShowDialog(true)
    }

    const defaultTargetedDistanceKm = 18000
    const defaultTargetedMonthOvershot = 5
    const today = new Date()
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000
    const applySorting = (vehiclesPendingSort = []) => {
        if (toSortByServiceDueSoon) {
            return vehiclesPendingSort
                    .map(veh => {
                        const ws = serviceByVehicle[veh.vehicleNo]
                        if (ws) {
                            const nextService = addMonthsToDate(ws.startDate, defaultTargetedMonthOvershot)
                            veh.nextServiceWithin2Weeks = (nextService - today <= twoWeeksMs)
                            veh.kmToGo = defaultTargetedDistanceKm - (veh.latestMileageKm - ws.mileageKm)
                        }
                        return veh
                    })
                    .sort((a, b) => {
                        if (a.kmToGo < 4000 || b.kmToGo < 4000) {
                            return a.kmToGo - b.kmToGo;
                        }

                        if (a.nextServiceWithin2Weeks && !b.nextServiceWithin2Weeks) return -1;
                        if (!a.nextServiceWithin2Weeks && b.nextServiceWithin2Weeks) return 1;
                    
                        return a.kmToGo - b.kmToGo;
                    })
        }

        if (toSortByInspectionDueSoon) {
            return vehiclesPendingSort
                    .sort((a, b) => new Date(a.inspectionDueDate ?? new Date("31-12-99999")) - new Date(b.inspectionDueDate ?? new Date("31-12-99999")))
        }

        return vehiclesPendingSort.sort((left, right) => {
            if (left.latestMileageKm !== right.latestMileageKm) {
                return right.latestMileageKm - left.latestMileageKm
            }
            return left.vehicleNo - right.vehicleNo
        })
    }

    const filteredVehicles = applySorting(vehicles).filter(veh => !showInternalOnly || (showInternalOnly && companies.find(co => co.id === veh.companyId)?.internal))
                .filter(veh => !selectedSearchOptions || selectedSearchOptions.length === 0 || selectedSearchOptions.some(sso => sso.name === veh.vehicleNo))

    useEffect(() => {
        const findBy = (type) => {
            return vehicles
                .map(veh => services.services()
                    .findIndex(srv => (srv.vehicleId === veh.id && srv.transactionTypes?.includes(type)))
                )
                .map(idx => services.services()[idx])
                .filter(srv => !!srv)
                .reduce((pv, cv) => {
                    pv[cv.vehicleNo] = cv
                    return pv
                    }, {})
        }

        setServiceByVehicle(findBy('SERVICE'))
        setInspectionByVehicle(findBy('INSPECTION'))

    }, [services.services()])

    return (
        <Container fluid>
        <Row>
            <VehicleUpdateDialog isShow={showDialog} setShowDialog={setShowDialog} 
                vehicle={selectedVehicle} setVehicles={setVehicles} companies={companies}></VehicleUpdateDialog>
        </Row>
        <Row className="mb-1">
            <Col>
            <Stack direction="horizontal" gap="2">
            <Form.Check
                onClick={() => setShowInternalOnly(!showInternalOnly)}
                defaultChecked={showInternalOnly}
                type="switch"
                id="custom-switch"
                label={`Only showing for ${companies.find(co => co.internal === true)?.companyName}`}
            />
            <Form.Check
                onClick={() => { setToSortByServiceDueSoon(!toSortByServiceDueSoon); setToSortByInspectionDueSoon(false) } }
                checked={toSortByServiceDueSoon}
                type="switch"
                id="service-switch"
                label="Service due soon"
            />
            <Form.Check
                onClick={() => { setToSortByInspectionDueSoon(!toSortByInspectionDueSoon); setToSortByServiceDueSoon(false)} }
                checked={toSortByInspectionDueSoon}
                type="switch"
                id="inspection-switch"
                label="Inspection due soon"
            />
            </Stack>
            </Col>
        </Row>
        <Row className="mb-3">
            {toSortByServiceDueSoon && <Col xs="12"><span className="text-secondary fw-lighter">Default using {formatThousandSeparator(defaultTargetedDistanceKm)} KM and {defaultTargetedMonthOvershot} months as indicators, for those travel between JB & SG, please adjust accordingly.</span></Col> }
            { filteredVehicles.slice(0, vehicleLoadCount)
                .map(v => 
                    <Col key={v.id} xs="12" sm="6" md="4" lg="3" className="mb-3">
                    <Card role="button" onClick={() => showVehicle(v.id)}>
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
                                {v.latestMileageKm ? `${formatThousandSeparator(v.latestMileageKm)} KM` : '-'} {toSortByServiceDueSoon && serviceByVehicle[v.vehicleNo]?.mileageKm && <span className="text-secondary fw-lighter">travelled {formatThousandSeparator(v.latestMileageKm - serviceByVehicle[v.vehicleNo]?.mileageKm)} KM</span>}
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
            {
                filteredVehicles.length > vehicleLoadCount && <><Col xs="12" className="text-center">
                    <span className="text-secondary" role="button" onClick={() => setVehicleLoadCount(vehicleLoadCount+12)}><HandPointer /> Click to load more.</span>
                </Col>
                <Col xs="12" className="text-center">
                    <span className="text-secondary" role="button" onClick={() => setVehicleLoadCount(Number.MAX_SAFE_INTEGER)}><HandPointer /> Load all.</span>
                </Col></>
            }
        </Row>
        </Container>
    )
}