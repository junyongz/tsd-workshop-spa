import { useEffect, useRef, useState } from "react"
import { Badge, Button, ButtonGroup, Card, Col, Container, Dropdown, DropdownButton, ListGroup, ListGroupItem, Row, Stack } from "react-bootstrap"
import OrderTooltip from "./OrderTooltip"
import { ScrollSpy } from "bootstrap"

function YearMonthView({services, suppliers=[], orders=[], backToService}) {
    const currentDate = new Date()
    const [year, setYear] = useState(currentDate.getFullYear())
    const [month, setMonth] = useState(currentDate.getMonth())

    const trxsGroupByVehicles = services.current.filterByYearMonthGroupByVehicle(year, month)
    const sortedKeys = Object.keys(trxsGroupByVehicles).sort((a, b) => a > b ? -1 : 1)

    const amountByVehicles = sortedKeys.map(veh => {
        const services = trxsGroupByVehicles[veh] || []

        return {vehicle: veh, amount: 
            (services.flatMap(s => s.migratedHandWrittenSpareParts).reduce((pv, cv) => pv + (cv.totalPrice || 0), 0) +
            services.flatMap(s => s.sparePartUsages).reduce((acc, curr) => {
                const order = orders.mapping[curr.orderId] 
                return acc + (curr.quantity * order.unitPrice)}, 0)).toFixed(2)
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
    
        return () => {
          scrollSpy.dispose();
        };
    }, [year, month]);    

    return (
        <Container>
            <Row className="mb-3">
                <Stack direction="horizontal">
                    <DropdownButton id="dropdown-year" className="me-3" as={ButtonGroup} title={year} variant="success" >
                        { services.current.availableYears().map(
                            v => <Dropdown.Item key={v} onClick={() => setYear(v)} eventKey={v}>{v}</Dropdown.Item> )
                        }
                    </DropdownButton>

                    <ButtonGroup>
                        {
                            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((v, i) => 
                                <Button key={v} variant={month === i ? 'outline-primary' : 'primary'} onClick={() => setMonth(i)}>{v}</Button>
                            )
                        }
                    </ButtonGroup>
 
                    <Col className="text-sm-end">
                        <Button variant="outline-secondary" onClick={backToService}><i className="bi bi-file-earmark-text-fill"></i> Back to Service</Button>
                    </Col>
                </Stack>
            </Row>
            <Row className="mb-3">
                <Card>
                    <Card.Body>
                        <span>Trucks</span> <Badge bg="secondary">{Object.keys(trxsGroupByVehicles).length}</Badge>&nbsp;
                        <span>Amount</span> <Badge bg="secondary">$ {amountByVehicles.reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toFixed(2)}</Badge>&nbsp;
                        <span>Items (Estimated)</span> <Badge bg="secondary">{Object.values(trxsGroupByVehicles).flat().flatMap(trxs => trxs.migratedHandWrittenSpareParts).length + Object.values(trxsGroupByVehicles).flat().flatMap(trxs => trxs.sparePartUsages).length}</Badge>&nbsp;
                        {amountByVehicles.length > 0 && <span>Top 3: { [0,1,2].map(v => <Badge key={v} bg="secondary" className="me-2">{ amountByVehicles[v]?.vehicle } <Badge>${amountByVehicles[v]?.amount}</Badge></Badge>) }</span> }
                    </Card.Body>
                </Card>
            </Row>
            <Row>
                <Col xs="2" ref={scrollSpyNavZoneRef}>
                    <ListGroup className="position-sticky top-0">
                    {
                        sortedKeys.map(veh => 
                            <ListGroup.Item key={veh.replace(' ', '')} action href={'#vehicle-' + veh.replace(' ', '')}>{veh} <Badge pill>${amountByVehicles.find(a => a.vehicle === veh).amount}</Badge></ListGroup.Item>
                        )
                    }
                    </ListGroup>
                </Col>
                <Col id="vehicle-items" ref={scrollSpyDataZoneRef}>
                    {
                        sortedKeys.map(veh => {
                            const values = trxsGroupByVehicles[veh]
                        
                            return (
                            <ListGroup key={veh} id={'vehicle-' + veh.replace(' ', '')}>
                                <Card className={'mb-2'}>
                                    <Card.Header>
                                        <Stack direction="horizontal">
                                            <Col className="fs-5 fw-bold">{veh}</Col><Col className='text-sm-end'><Badge>${amountByVehicles.find(a => a.vehicle === veh).amount}</Badge></Col>
                                        </Stack>
                                    </Card.Header>    
                                    <Card.Body>
                                        {values.map(trx => {                                            
                                            const migrated = trx.migratedHandWrittenSpareParts.map(v => <ListGroupItem key={v.index}>
                                                <Stack direction="horizontal">
                                                    <Col>{trx.creationDate}</Col>
                                                    <Col xs="8">{v.itemDescription}</Col>
                                                    <Col className='text-sm-end'><Badge pill>{v.quantity > 0 && v.unitPrice && `${v.quantity} ${v.unit} @ $${v.unitPrice?.toFixed(2)}`}</Badge></Col>
                                                    <Col className='text-sm-end'>$ {v.totalPrice?.toFixed(2) || 0}</Col>
                                                </Stack>
                                            </ListGroupItem>)

                                            const usages = trx.sparePartUsages.map(v => {
                                                const order = orders.mapping[v.orderId]
                                                const supplier = suppliers.find(s => s.id === order.supplierId)
                                                const totalPrice = (v.quantity * order.unitPrice).toFixed(2) || 0
                                                
                                                return (<ListGroupItem key={v.id}>
                                                        <Stack direction="horizontal">
                                                            <Col>{trx.creationDate}</Col>
                                                            <Col xs="8">{order.partName} { order && <div><OrderTooltip order={order} supplier={supplier} /></div> }</Col>
                                                            <Col className='text-sm-end'><Badge pill>{v.quantity > 0 && order.unitPrice && `${v.quantity} ${order.unit} @ $${order.unitPrice?.toFixed(2)}`}</Badge></Col>
                                                            <Col className='text-sm-end'>$ {totalPrice}</Col>
                                                        </Stack>
                                                    </ListGroupItem>)
                                            })

                                            return migrated.concat(usages)
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