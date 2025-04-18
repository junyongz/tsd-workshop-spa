import { useEffect, useRef, useState } from "react"
import { Badge, Button, ButtonGroup, Card, Col, Container, Dropdown, DropdownButton, ListGroup, ListGroupItem, Row, Stack } from "react-bootstrap"
import { ScrollSpy } from "bootstrap"

// {[supplier]}
const filterOrdersBySupplier = (orders={listing:[],mapping:[]}, suppliers=[], year, month) => {
    const matchedYearMonthOrders = orders.listing.filter(order => {
        const invoiceDate = new Date(order.invoiceDate)
        if (invoiceDate.getFullYear() === year && invoiceDate.getMonth() === month) {
            return true
        }
        return false
    })

    const formattedOrders = {}
    matchedYearMonthOrders.forEach(order => {
        const supplier = suppliers.find(s => s.id === order.supplierId)

        const supplierOrders = formattedOrders[supplier.supplierName] || []
        supplierOrders.push(order)
        formattedOrders[supplier.supplierName] = supplierOrders
    })
    return formattedOrders
}

const itemsByOrder = (supplierOrders=[]) => {
    const itemsByDO = {}
    supplierOrders.forEach(order => {
        const orderByDO = itemsByDO[order.deliveryOrderNo] || []
        orderByDO.push(order)
        itemsByDO[order.deliveryOrderNo] = orderByDO
    })
    return itemsByDO
}

function SupplierSparePartsYearMonthView({orders=[], suppliers=[], backToOrders}) {
    const currentDate = new Date()
    const [year, setYear] = useState(currentDate.getFullYear())
    const [month, setMonth] = useState(currentDate.getMonth())

    const trxsGroupBySuppliers = filterOrdersBySupplier(orders, suppliers, year, month)
    const sortedKeys = Object.keys(trxsGroupBySuppliers).sort((a, b) => a > b ? -1 : 1)
    const availableYears = Array.from(new Set(orders.map(order => new Date(order.invoiceDate).getFullYear()))).sort((a, b) => b - a)

    const amountBySuppliers = sortedKeys.map(supplier => {
        const orders = trxsGroupBySuppliers[supplier]

        return {supplier: supplier, amount: orders.reduce((pv, cv) => pv + ((cv.quantity * cv.unitPrice) || 0), 0).toFixed(2)}
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
                        { availableYears.map(
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
                        <Button variant="outline-secondary" onClick={backToOrders}><i className="bi bi-file-earmark-text-fill"></i> Back to Orders</Button>
                    </Col>
                </Stack>
            </Row>
            <Row className="mb-3">
                <Card>
                    
                    <Card.Body>
                        <span>Suppliers</span> <Badge bg="secondary">{Object.keys(trxsGroupBySuppliers).length}</Badge>&nbsp;
                        <span>Amount</span> <Badge bg="secondary">$ {Object.values(trxsGroupBySuppliers).flat().reduce((pv, cv) => pv + ((cv.quantity * cv.unitPrice) || 0), 0).toFixed(2)}</Badge>&nbsp;
                        <span>Items (Estimated)</span> <Badge bg="secondary">{Object.values(trxsGroupBySuppliers).flat().reduce((pv, cv) => pv + (cv.quantity || 0), 0)}</Badge>&nbsp;
                        {amountBySuppliers.length > 0 && <span>Top 3: { [0,1,2].map(v => <Badge key={v} bg="secondary" className="me-2">{ amountBySuppliers[v]?.supplier } <Badge>${amountBySuppliers[v]?.amount}</Badge></Badge>) }</span> }
                    </Card.Body>
                </Card>
            </Row>
            <Row>
                <Col xs="2" ref={scrollSpyNavZoneRef}>
                    <ListGroup className="position-sticky top-0">
                    {
                        sortedKeys.map(supplier => 
                            <ListGroup.Item key={supplier.replaceAll(' ', '').replaceAll('(','').replaceAll(')','')} action href={'#supplier-' + supplier.replaceAll(' ', '').replaceAll('(','').replaceAll(')','')}>{supplier} <Badge pill>${amountBySuppliers.find(a => a.supplier === supplier).amount}</Badge></ListGroup.Item>
                        )
                    }
                    </ListGroup>
                </Col>
                <Col id="vehicle-items" ref={scrollSpyDataZoneRef}>
                    {
                        sortedKeys.map(supplier => {
                            const values = trxsGroupBySuppliers[supplier]
                            const groupByDO = itemsByOrder(values)
                        
                            return (
                            <ListGroup key={supplier} id={'supplier-' + supplier.replaceAll(' ', '').replaceAll('(','').replaceAll(')','')}>
                                <Card className={'mb-2'}>
                                    <Card.Header>
                                        <Stack direction="horizontal">
                                            <Col className="fs-5 fw-bold">{supplier}</Col><Col className='text-sm-end'><Badge>${amountBySuppliers.find(a => a.supplier === supplier).amount}</Badge></Col>
                                        </Stack>
                                    </Card.Header>    
                                    <Card.Body>
                                        {Object.keys(groupByDO).map(v => {
                                            return <Card className="mb-3">
                                                <Card.Header>
                                                    <Row>
                                                        <Col><i className="bi bi-calendar-event"></i> {groupByDO[v][0].invoiceDate}</Col>
                                                        <Col className='text-sm-end'><i className="bi bi-journal"></i> {v} </Col>
                                                    </Row>
                                                </Card.Header>
                                                <Card.Body>
                                                    {groupByDO[v].map(order => <ListGroupItem key={order.id}>
                                                            <Stack direction="horizontal">
                                                                <Col xs="2">{order.itemCode} </Col>
                                                                <Col xs="7">{order.partName} </Col>
                                                                <Col className='text-sm-end'><Badge pill>{order.quantity > 0 && order.unitPrice && `${order.quantity} ${order.unit} @ $${order.unitPrice?.toFixed(2)}`}</Badge></Col>
                                                                <Col className='text-sm-end'>$ {(order.quantity * order.unitPrice).toFixed(2) || 0}</Col>
                                                            </Stack>
                                                        </ListGroupItem>)}
                                                        <ListGroupItem>
                                                            <Col className='text-sm-end'>$ {groupByDO[v].reduce((pv, cv) => pv + ((cv.quantity * cv.unitPrice) || 0), 0).toFixed(2)}</Col>
                                                        </ListGroupItem>
                                                </Card.Body>
                                            </Card>
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

export default SupplierSparePartsYearMonthView