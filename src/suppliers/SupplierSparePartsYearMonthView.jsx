import { useEffect, useRef, useState } from "react"
import { Badge, Button, ButtonGroup, Card, Col, Container, Dropdown, DropdownButton, ListGroup, ListGroupItem, Row, Stack } from "react-bootstrap"
import { ScrollSpy } from "bootstrap"
import { Calendar } from "../Icons"
import { months3EngChars } from "../utils/dateUtils"
import { useSupplierOrders } from "./SupplierOrderContextProvider"

/**
 * 
 * @param {import("./SupplierOrders").SupplierOrder[]} orders 
 * @param {import("./SupplierOrders").Supplier[]} suppliers 
 * @param {number} year 
 * @param {number} month 
 * @returns 
 */
const filterOrdersBySupplier = (orders, suppliers, year, month) => {
    const matchedYearMonthOrders = orders.filter(order => {
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

/**
 * 
 * @param {import("./SupplierOrders").SupplierOrder[]} supplierOrders 
 * @returns 
 */
const itemsByOrder = (supplierOrders) => {
    const itemsByDO = {}
    supplierOrders.forEach(order => {
        const orderByDO = itemsByDO[order.deliveryOrderNo] || []
        orderByDO.push(order)
        itemsByDO[order.deliveryOrderNo] = orderByDO
    })
    return itemsByDO
}

/**
 * 
 * @param {*} props
 * @param {Object[]} props.suppliers
 * @param {Function} props.backToOrders
 * @returns 
 */
function SupplierSparePartsYearMonthView({suppliers, backToOrders}) {
    const supplierOrders = useSupplierOrders()

    const currentDate = new Date()
    const [year, setYear] = useState(currentDate.getFullYear())
    const [month, setMonth] = useState(currentDate.getMonth())

    const trxsGroupBySuppliers = filterOrdersBySupplier(supplierOrders.list(), suppliers, year, month)
    const sortedKeys = Object.keys(trxsGroupBySuppliers).sort((a, b) => a > b ? -1 : 1)
    const availableYears = Array.from(new Set(supplierOrders.list().map(order => 
        new Date(order.invoiceDate).getFullYear()))).sort((a, b) => b - a)

    const amountBySuppliers = sortedKeys.map(supplier => {
        const orders = trxsGroupBySuppliers[supplier]

        return {supplier: supplier, amount: orders.reduce((pv, cv) => pv + ((cv.quantity * cv.unitPrice) || 0), 0).toFixed(2)}
    }).sort((a, b) => b.amount - a.amount)

    const DropDownYears = () => {
        return (
            <DropdownButton id="dropdown-year" as={ButtonGroup} title={year} variant="success" >
            { availableYears.map(
                v => <Dropdown.Item key={v} onClick={() => setYear(v)} eventKey={v}>{v}</Dropdown.Item> )
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
    
        return () => {
          scrollSpy.dispose();
        };
      }, [year, month]);    

    return (
        <Container>
            <Row className="mb-3 justify-content-between">
                <Col xs="6" lg="10">
                    <ButtonGroup className="d-flex d-lg-none">
                    <DropDownYears />
                    <DropdownButton id="dropdown-month" as={ButtonGroup} title={months3EngChars[month]} variant="primary" >
                        {
                            months3EngChars.map((v, i) => 
                                    <Dropdown.Item key={v} variant={month === i ? 'outline-primary' : 'primary'} onClick={() => setMonth(i)}>{v}</Dropdown.Item>
                                )
                        }
                    </DropdownButton>
                    </ButtonGroup>

                    <ButtonGroup className="d-none d-lg-flex">
                    <DropDownYears />
                        {
                            months3EngChars.map((v, i) => 
                                <Button key={v} variant={month === i ? 'outline-primary' : 'primary'} onClick={() => setMonth(i)}>{v}</Button>
                            )
                        }
                    </ButtonGroup>
                </Col>
                <Col xs="6" lg="2" className="text-end">
                    <Button variant="outline-secondary" onClick={backToOrders}><i className="bi bi-file-earmark-text-fill"></i> Back to Orders</Button>
                </Col>
            </Row>
            <Row className="mb-3">
                <Card>
                    <Card.Body>
                        <Row>
                        <Col xs="6" lg="2"><span>Suppliers</span> <Badge bg="secondary">{Object.keys(trxsGroupBySuppliers).length}</Badge></Col>
                        <Col xs="6" lg="2"><span>Amount</span> <Badge bg="secondary">$ {Object.values(trxsGroupBySuppliers).flat().reduce((pv, cv) => pv + ((cv.quantity * cv.unitPrice) || 0), 0).toFixed(2)}</Badge></Col>
                        <Col xs="12" lg="2"><span>Items (Estimated)</span> <Badge bg="secondary">{Object.values(trxsGroupBySuppliers).flat().reduce((pv, cv) => pv + (cv.quantity || 0), 0)}</Badge></Col>
                        {amountBySuppliers.length > 0 && <Col xs="12" lg="6"><span>Top 3: { [0,1,2].map(v => <Badge key={v} bg="secondary" className="me-2">{ amountBySuppliers[v]?.supplier } <Badge>${amountBySuppliers[v]?.amount}</Badge></Badge>) }</span></Col> }
                        </Row>
                    </Card.Body>
                </Card>
            </Row>
            <Row>
                <Col className="d-none d-lg-flex" lg="2" ref={scrollSpyNavZoneRef}>
                    <ListGroup className="position-sticky top-0">
                    {
                        sortedKeys.map(supplier => 
                            <ListGroup.Item key={supplier.replaceAll(/[^a-zA-Z0-9]/g, '')} action href={'#supplier-' + supplier.replaceAll(/[^a-zA-Z0-9]/g, '')}>{supplier} <Badge pill>${amountBySuppliers.find(a => a.supplier === supplier).amount}</Badge></ListGroup.Item>
                        )
                    }
                    </ListGroup>
                </Col>
                <Col lg="10" id="vehicle-items" ref={scrollSpyDataZoneRef}>
                    {
                        sortedKeys.map(supplier => {
                            const values = trxsGroupBySuppliers[supplier]
                            const groupByDO = itemsByOrder(values)
                        
                            return (
                            <ListGroup key={supplier} id={'supplier-' + supplier.replaceAll(/[^a-zA-Z0-9]/g, '')}>
                                <Card className={'mb-2'}>
                                    <Card.Header>
                                        <Stack direction="horizontal">
                                            <Col className="fs-5 fw-bold">{supplier}</Col><Col className='text-end'><Badge>${amountBySuppliers.find(a => a.supplier === supplier).amount}</Badge></Col>
                                        </Stack>
                                    </Card.Header>    
                                    <Card.Body>
                                        {Object.keys(groupByDO).map(v => {
                                            return <Card className="mb-3" key={v} role="document">
                                                <Card.Header>
                                                    <Row>
                                                        <Col><Calendar /> {groupByDO[v][0].invoiceDate}</Col>
                                                        <Col className='text-end'><i className="bi bi-journal"></i> {v} </Col>
                                                    </Row>
                                                </Card.Header>
                                                <Card.Body>
                                                    {groupByDO[v].map(order => <ListGroupItem key={order.id}>
                                                            <Row>
                                                                <Col xs="12" lg="2" className="fw-lighter">{order.itemCode} </Col>
                                                                <Col xs="12" lg="6" className="fw-semibold">{order.partName} </Col>
                                                                <Col xs="6" lg="2" className='text-lg-end'>{order.quantity > 0 && order.unitPrice && `${order.quantity} ${order.unit} @ $${order.unitPrice?.toFixed(2)}`}</Col>
                                                                <Col xs="6" lg="2" className='text-end fw-semibold'>$ {(order.quantity * order.unitPrice).toFixed(2) || 0}</Col>
                                                            </Row>
                                                        </ListGroupItem>)}
                                                        <ListGroupItem>
                                                            <Col className='text-end'>$ {groupByDO[v].reduce((pv, cv) => pv + ((cv.quantity * cv.unitPrice) || 0), 0).toFixed(2)}</Col>
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