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
        const trxs = trxsGroupByVehicles[veh]

        return {vehicle: veh, amount: trxs.reduce((pv, cv) => pv + (cv.totalPrice || 0), 0).toFixed(2)}
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
                    <DropdownButton className="me-3" as={ButtonGroup} title={year} variant="success" >
                        { services.current.availableYears().map(
                            v => <Dropdown.Item onClick={() => setYear(v)} eventKey={v}>{v}</Dropdown.Item> )
                        }
                    </DropdownButton>

                    <ButtonGroup>
                        {
                            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((v, i) => 
                                <Button variant={month === i ? 'outline-primary' : 'primary'} onClick={() => setMonth(i)}>{v}</Button>
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
                        Trucks <Badge bg="secondary">{Object.keys(trxsGroupByVehicles).length}</Badge>&nbsp;
                        Amount: <Badge bg="secondary">$ {Object.values(trxsGroupByVehicles).flat().reduce((pv, cv) => pv + (cv.totalPrice || 0), 0).toFixed(2)}</Badge>&nbsp;
                        Items (Estimated): <Badge bg="secondary">{Object.values(trxsGroupByVehicles).flat().length}</Badge>&nbsp;
                        {amountByVehicles.length > 0 && <span>Top 3: { [0,1,2].map(v => <Badge bg="secondary" className="me-2">{ amountByVehicles[v]?.vehicle } <Badge>${amountByVehicles[v]?.amount}</Badge></Badge>) }</span> }
                    </Card.Body>
                </Card>
            </Row>
            <Row>
                <Col xs="2" ref={scrollSpyNavZoneRef}>
                    <ListGroup className="position-sticky top-0">
                    {
                        sortedKeys.map(veh => 
                            <ListGroup.Item action href={'#vehicle-' + veh.replace(' ', '')}>{veh} <Badge pill>${amountByVehicles.find(a => a.vehicle === veh).amount}</Badge></ListGroup.Item>
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
                                            const order = orders.find(o => o.id === trx.orderId)
                                            const supplier = suppliers.find(s => s.id === trx.supplierId)

                                            return <ListGroupItem key={trx.index}>
                                                <Stack direction="horizontal">
                                                    <Col>{trx.creationDate}</Col>
                                                    <Col xs="8">{trx.itemDescription} { order && <div><OrderTooltip order={order} supplier={supplier} /></div> }</Col>
                                                    <Col className='text-sm-end'><Badge pill>{trx.quantity > 0 && trx.unitPrice && `${trx.quantity} ${trx.unit} @ $${trx.unitPrice?.toFixed(2)}`}</Badge></Col>
                                                    <Col className='text-sm-end'>$ {trx.totalPrice?.toFixed(2) || 0}</Col>
                                                </Stack>
                                            </ListGroupItem>
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