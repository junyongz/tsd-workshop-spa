import { useEffect, useRef, useState } from "react"
import { Badge, Button, ButtonGroup, Card, Col, Container, Dropdown, DropdownButton, ListGroup, ListGroupItem, Row, Stack } from "react-bootstrap"
import OrderTooltip from "./OrderTooltip"
import { ScrollSpy } from "bootstrap"
import { Services } from "../Icons"
import { months3EngChars } from "../utils/dateUtils"

function YearMonthView({services, setFilteredServices, suppliers=[], orders=[], backToService}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const currentDate = new Date()
    const [year, setYear] = useState(currentDate.getFullYear())
    const [month, setMonth] = useState(currentDate.getMonth())

    const [trxsGroupByVehicles, setTrxsGroupByVehicles] = useState({})

    const fetchByYearAndMonth = async (year, month) => {
        return fetch(`${apiUrl}/workshop-services?year=${year}&month=${month}`)
        .then(resp => resp.json())
        .then(yearMonthWss => {
            yearMonthWss.forEach(ws => services.current.updateTransaction(ws))
            setFilteredServices([...services.current.transactions])
            setTrxsGroupByVehicles(services.current.filterByYearMonthGroupByVehicle(year, month-1))
        })
    }

    const changeYear = (year) => {
        fetchByYearAndMonth(year, month).finally(() => setYear(year))
    }

    const changeMonth = (month) => {
        fetchByYearAndMonth(year, month+1).finally(() => setMonth(month))
    }
    
    //services.current.filterByYearMonthGroupByVehicle(year, month)
    const sortedKeys = Object.keys(trxsGroupByVehicles).sort((a, b) => a > b ? -1 : 1)

    const amountByVehicles = sortedKeys.map(veh => {
        const services = trxsGroupByVehicles[veh] || []

        return {vehicle: veh, amount: 
            (services.flatMap(s => s.migratedHandWrittenSpareParts || []).reduce((pv, cv) => pv + (cv.totalPrice || 0), 0) +
            services.flatMap(s => s.sparePartUsages).reduce((acc, curr) => {
                const order = orders?.mapping[curr.orderId] 
                return acc + (curr.quantity * order.unitPrice)}, 0)).toFixed(2)
         }
    }).sort((a, b) => b.amount - a.amount)

    const DropDownYears = () => {
        return (
            <DropdownButton id="dropdown-year" as={ButtonGroup} title={year} variant="success" >
            { services.current.availableYears().map(
                v => <Dropdown.Item key={v} onClick={() => changeYear(v)} eventKey={v}>{v}</Dropdown.Item> )
            }
            </DropdownButton> 
        )
    }

    const scrollSpyDataZoneRef = useRef()
    const scrollSpyNavZoneRef = useRef()
    useEffect(() => {
        const scrollSpy = new ScrollSpy(scrollSpyDataZoneRef.current, {
          target: scrollSpyNavZoneRef.current,
          smoothScroll: true,
          rootMargin: '0px 0px -40%'
        });

        fetchByYearAndMonth(year, month+1)
    
        return () => {
          scrollSpy.dispose();
        };
        
    }, []);    

    return (
        <Container>
            <Row className="mb-3 justify-content-between">
                <Col xs="6" lg="10">
                    <ButtonGroup className="d-flex d-lg-none">
                    <DropDownYears />
                    <DropdownButton id="dropdown-month" as={ButtonGroup} title={months3EngChars[month]} variant="primary" >
                        {
                            months3EngChars.map((v, i) => 
                                    <Dropdown.Item key={v} variant={month === i ? 'outline-primary' : 'primary'} onClick={() => changeMonth(i)}>{v}</Dropdown.Item>
                                )
                        }
                    </DropdownButton>
                    </ButtonGroup>

                    <ButtonGroup className="d-none d-lg-flex">
                    <DropDownYears />
                        {
                            months3EngChars.map((v, i) => 
                                <Button aria-current={v} key={v} variant={month === i ? 'outline-primary' : 'primary'} onClick={() => changeMonth(i)}>{v}</Button>
                            )
                        }
                    </ButtonGroup>
                </Col>
                <Col xs="6" lg="2" className="text-end">
                    <Button variant="outline-secondary" onClick={backToService}><Services /> Back to Service</Button>
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
                                <Card className={'mb-2'}>
                                    <Card.Header>
                                        <Stack direction="horizontal">
                                            <Col className="fs-5 fw-bold">{veh}</Col><Col className='text-end'><Badge>${amountByVehicles.find(a => a.vehicle === veh).amount}</Badge></Col>
                                        </Stack>
                                    </Card.Header>    
                                    <Card.Body>
                                        {values.map(trx => {                                            
                                            const migrated = trx.migratedHandWrittenSpareParts?.map(v => <ListGroupItem key={v.index}>
                                                <Row>
                                                    <Col xs="4" lg="2">{trx.creationDate}</Col>
                                                    <Col xs="8" lg="6">{v.itemDescription}</Col>
                                                    <Col xs={false} lg="2" className='text-end'><Badge pill>{v.quantity > 0 && v.unitPrice && `${v.quantity} ${v.unit} @ $${v.unitPrice?.toFixed(2)}`}</Badge></Col>
                                                    <Col xs={false} lg="2" className='text-end'>$ {v.totalPrice?.toFixed(2) || 0}</Col>
                                                </Row>
                                            </ListGroupItem>)

                                            const usages = trx.sparePartUsages.map(v => {
                                                const order = orders?.mapping[v.orderId]
                                                const supplier = suppliers.find(s => s.id === order.supplierId)
                                                const totalPrice = (v.quantity * order.unitPrice).toFixed(2) || 0
                                                
                                                return (<ListGroupItem key={v.id}>
                                                        <Row>
                                                            <Col xs="4" lg="2">{trx.creationDate}</Col>
                                                            <Col xs="8" lg="6">{order.partName} { order && <div className="d-none d-lg-block"><OrderTooltip order={order} supplier={supplier} /></div> }</Col>
                                                            <Col xs="6" lg="2" className='text-lg-end'><Badge pill>{v.quantity > 0 && order.unitPrice && `${v.quantity} ${order.unit} @ $${order.unitPrice?.toFixed(2)}`}</Badge></Col>
                                                            <Col xs="6" lg="2" className='text-end'>$ {totalPrice}</Col>
                                                        </Row>
                                                    </ListGroupItem>)
                                            })

                                            return (migrated || []).concat(usages)
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