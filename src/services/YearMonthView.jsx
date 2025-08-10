import React, { useEffect, useRef, useState } from "react"
import { Badge, Button, Card, Col, Container, ListGroup, ListGroupItem, Row, Stack } from "react-bootstrap"
import OrderTooltip from "./OrderTooltip"
import { ScrollSpy } from "bootstrap"
import { Foreman, NoteTaking, Services } from "../Icons"
import { useNavigate } from "react-router-dom"
import { useService } from "./ServiceContextProvider"
import { useSupplierOrders } from "../suppliers/SupplierOrderContextProvider"
import YearMonthsSelector from "../components/YearMonthsSelector"

const apiUrl = process.env.REACT_APP_API_URL

/**
 * 
 * @param {Object} props 
 * @param {import("../suppliers/SupplierOrders").Supplier[]} props.suppliers 
 * @param {import("../ServiceTransactions").TaskTemplate[]} props.taskTemplates 
 * @returns 
 */
function YearMonthView({suppliers, taskTemplates}) {
    const transactions = useService()
    const orders = useSupplierOrders()

    const navigate = useNavigate()

    const currentDate = new Date()
    const [year, setYear] = useState(currentDate.getFullYear())
    const [month, setMonth] = useState(currentDate.getMonth())

    /**
     * @type {[Object<string, import("../ServiceTransactions").WorkshopService[]>, 
     *  React.SetStateAction<Object<string, import("../ServiceTransactions").WorkshopService[]>>]}
     */
    const [trxsGroupByVehicles, setTrxsGroupByVehicles] = useState({})

    const fetchByYearAndMonth = async (year, month) => {
        return fetch(`${apiUrl}/api/workshop-services?year=${year}&month=${month}`)
        .then(resp => resp.json())
        .then(yearMonthWss => {
            transactions.updateTransactions(yearMonthWss)
            setTrxsGroupByVehicles(transactions.filterByYearMonthGroupByVehicle(year, month-1))
        })
    }

    const changeYear = (year) => {
        fetchByYearAndMonth(year, month).finally(() => setYear(year))
    }

    const changeMonth = (month) => {
        fetchByYearAndMonth(year, month+1).finally(() => setMonth(month))
    }
    
    const sortedKeys = Object.keys(trxsGroupByVehicles).sort((a, b) => a > b ? -1 : 1)

    const amountByVehicles = sortedKeys.map(veh => {
        const services = trxsGroupByVehicles[veh]

        return {vehicle: veh, amount: 
            (services.flatMap(s => s.migratedHandWrittenSpareParts || []).reduce((pv, cv) => pv + (cv.totalPrice || 0), 0) +
            services.flatMap(s => s.sparePartUsages || []).reduce((acc, curr) => {
                const order = orders.byId(curr.orderId)
                return acc + (curr.quantity * order.unitPrice)}, 0) + 
            services.flatMap(s => s.tasks || []).reduce((acc, curr) => {
                return acc + curr.quotedPrice}, 0)
            ).toFixed(2)
         }
    }).sort((a, b) => b.amount - a.amount)

    const scrollSpyDataZoneRef = useRef()
    const scrollSpyNavZoneRef = useRef()
    useEffect(() => {
        const scrollSpy = new ScrollSpy(scrollSpyDataZoneRef.current, {
          target: scrollSpyNavZoneRef.current,
          smoothScroll: true,
          rootMargin: '0px 0px -40%'
        });

        fetchByYearAndMonth(year, month+1)
    
        return () => scrollSpy.dispose()
    }, []);

    return (
        <Container>
            <Row className="mb-3 justify-content-between">
                <Col xs="6" lg="10">
                    <YearMonthsSelector availableYears={transactions.availableYears()} changeYear={changeYear} changeMonth={changeMonth} year={year} month={month} />
                </Col>
                <Col xs="6" lg="2" className="text-end">
                    <Button variant="outline-secondary" onClick={() => navigate("/")}><Services /> Back to Service</Button>
                </Col>
            </Row>
            <Row className="mb-3">
                <Card>
                    <Card.Body>
                        <Row>
                        <Col xs="6" lg="2"><span>Trucks</span> <Badge bg="secondary">{Object.keys(trxsGroupByVehicles).length}</Badge>&nbsp;</Col>
                        <Col xs="6" lg="2"><span>Amount</span> <Badge bg="secondary">$ {amountByVehicles.reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toFixed(2)}</Badge>&nbsp;</Col>
                        <Col xs="12" lg="2"><span>Items (Estimated)</span> <Badge bg="secondary">{Object.values(trxsGroupByVehicles).flat().flatMap(trxs => trxs.migratedHandWrittenSpareParts).length + Object.values(trxsGroupByVehicles).flat().flatMap(trxs => trxs.sparePartUsages).length}</Badge></Col>
                        {amountByVehicles.length > 0 && <Col xs="12" lg="6"><span>Top 3: { [0,1,2].map(v => <Badge key={v} bg="secondary" className="me-2">{ amountByVehicles[v]?.vehicle } <Badge>${amountByVehicles[v]?.amount}</Badge></Badge>) }</span></Col> }
                        </Row>
                    </Card.Body>
                </Card>
            </Row>
            <Row>
                <Col className="d-none d-lg-flex" lg="2" ref={scrollSpyNavZoneRef}>
                    <ListGroup className="position-sticky top-0">
                    {
                        sortedKeys.map(veh => 
                            <ListGroup.Item key={veh.replace(' ', '')} action href={'#vehicle-' + veh.replace(' ', '')}>{veh} <Badge pill>${amountByVehicles.find(a => a.vehicle === veh).amount}</Badge></ListGroup.Item>
                        )
                    }
                    </ListGroup>
                </Col>
                <Col lg="10" id="vehicle-items" ref={scrollSpyDataZoneRef}>
                    {
                        sortedKeys.map(veh => {
                            const values = trxsGroupByVehicles[veh]
                        
                            return (
                            <ListGroup key={veh} id={'vehicle-' + veh.replace(' ', '')}>
                                <Card className={'mb-2'} role="document">
                                    <Card.Header>
                                        <Stack direction="horizontal">
                                            <Col className="fs-5 fw-bold">{veh}</Col><Col className='text-end fw-semibold fs-5'>${amountByVehicles.find(a => a.vehicle === veh).amount}</Col>
                                        </Stack>
                                    </Card.Header>    
                                    <Card.Body>
                                        {values.map(trx => {                                            
                                            const migrated = trx.migratedHandWrittenSpareParts?.map(v => <ListGroupItem key={v.index}>
                                                <Row>
                                                    <Col xs="12" lg="2" className="fw-lighter">{trx.creationDate}</Col>
                                                    <Col xs="12" lg="6" className="fw-semibold">{v.itemDescription}</Col>
                                                    <Col xs="6" lg="2" className='text-lg-end'>{v.quantity > 0 && v.unitPrice && `${v.quantity} ${v.unit} @ $${v.unitPrice?.toFixed(2)}`}</Col>
                                                    <Col xs="6" lg="2" className='text-end fw-semibold'>$ {v.totalPrice?.toFixed(2) || 0}</Col>
                                                </Row>
                                            </ListGroupItem>)

                                            const usages = trx.sparePartUsages?.map(v => {
                                                const order = orders.byId(v.orderId)
                                                const supplier = suppliers.find(s => s.id === order.supplierId)
                                                const totalPrice = (v.quantity * order.unitPrice).toFixed(2) || 0
                                                
                                                return (<ListGroupItem key={v.id}>
                                                        <Row>
                                                            <Col xs="12" lg="2" className="fw-lighter">{trx.creationDate}</Col>
                                                            <Col xs="12" lg="4"><span className="fw-semibold">{order.partName}</span> { order && <div><OrderTooltip order={order} supplier={supplier} /></div> }</Col>
                                                            <Col xs="6" lg="4" className='text-lg-end'>
                                                                {v.quantity > 0 && order.unitPrice && `${v.quantity} ${order.unit} @ $${v.soldPrice?.toFixed(2)}`}
                                                                {v.margin > 0 && <div><span className="text-secondary fw-lighter">original: ${order.unitPrice?.toFixed(2)} <i className="bi bi-arrow-up"></i>{v.margin}%</span></div> }
                                                            </Col>
                                                            <Col xs="6" lg="2" className='text-end fw-semibold'>$ {totalPrice}</Col>
                                                        </Row>
                                                    </ListGroupItem>)
                                            })

                                            const tasks =trx.tasks?.map(vvv => {
                                                const task = taskTemplates.find(t => t.id === vvv.taskId)

                                                return <ListGroupItem key={vvv.id}>
                                                    <Row>
                                                    <Col xs="4" lg="2">{vvv.recordedDate}</Col>
                                                    <Col xs="12" lg="5"><Foreman /> {task.workmanshipTask} ({task.component.subsystem} - {task.component.componentName})</Col>
                                                    <Col xs="8" lg="3"><NoteTaking /> {vvv.remarks}</Col>
                                                    <Col xs="4" lg="2" className='text-end fw-semibold'>$ {vvv.quotedPrice?.toFixed(2)}</Col>                        
                                                    </Row>
                                                </ListGroupItem>
                                                })
                    

                                            return ((migrated || []).concat(usages)).concat(tasks)
                                        })}
                                    </Card.Body>
                                </Card>
                            </ListGroup>)
                        })
                    }
                </Col>
            </Row>
        </Container>
    )

}

export default YearMonthView