import { useState } from "react"
import { Container, ListGroup, ListGroupItem, Row, Col, Stack, Pagination, Button, Badge, Nav, Offcanvas, OverlayTrigger, Tooltip, Spinner } from "react-bootstrap"
import getPaginationItems from "../utils/getPaginationItems"
import { chunkArray } from "../utils/arrayUtils"
import AddSparePartsDialog from "./AddSparePartsDialog"
import SparePartsUsageDialog from "./SparePartsUsageDialog"

function SuppliersSpareParts({filteredOrders=[], setFilteredOrders, orders=[], suppliers=[], spareParts=[], vehicles=[], doFetchSpareParts=() => {}}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const [activePage, setActivePage] = useState(1)
    const chunkedItems = chunkArray(filteredOrders, 50)
    const totalPages = chunkedItems.length;

    const [showDialog, setShowDialog] = useState(false)
    const [showUsageDialog, setShowUsageDialog] = useState(false)
    const [usageSpareParts, setUsageSpareParts] = useState()

    const [showSuppliers, setShowSuppliers] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState()

    const findSupplier = (supplierId) => {
        return suppliers.find(v => v.id === supplierId)
    }

    const recordUsage = (v) => {
        setUsageSpareParts({...v, supplierName: findSupplier(v.supplierId).supplierName})
        setShowUsageDialog(true)
    }

    const filterOrderBySupplier = (supplier) => {
        setFilteredOrders(orders.filter(s => s.supplierId === supplier.id))
        setSelectedSupplier(supplier.id)
    }

    const onSaveNewOrders = (newOrders=[], callback=() => {}) => {
        fetch(`${apiUrl}/supplier-spare-parts`, {
            method: 'POST',
            body: JSON.stringify(newOrders),
            mode: 'cors',
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(response => {
            orders.push(...response)
            orders.sort((a, b) => a.invoiceDate < b.invoiceDate)
            setFilteredOrders((selectedSupplier && orders.filter(s => s.supplierId === selectedSupplier.id)) || orders)
            doFetchSpareParts()
            callback && callback()
        })
    }

    return (
        <Container>
            <Row>
                <AddSparePartsDialog isShow={showDialog} 
                    setShowDialog={setShowDialog}
                    suppliers={suppliers}
                    spareParts={spareParts}
                    onSaveNewOrders={onSaveNewOrders}></AddSparePartsDialog>
                { usageSpareParts && <SparePartsUsageDialog isShow={showUsageDialog}
                    setShowDialog={setShowUsageDialog} 
                    vehicles={vehicles}
                    usageSpareParts={usageSpareParts}
                    setUsageSpareParts={setUsageSpareParts}
                    ></SparePartsUsageDialog> }
            </Row>
            <Row>
                <Col>
                    <Pagination>
                    { getPaginationItems(activePage, setActivePage, totalPages, 10) }
                    </Pagination>
                </Col>
                <Col className={'text-sm-end col-2'}>
                    <Button variant='success' onClick={() => setShowDialog(!showDialog)}><i className="bi bi-plus-circle-fill me-2"></i>Add New</Button>
                </Col>
            </Row>
            <Row>
                <Col>
                <Button variant="link" onClick={() => setShowSuppliers(true)}>{ selectedSupplier ? `Showing for ${suppliers.find(v => v.id === selectedSupplier).supplierName}, click to find out more` : 'Showing All'}</Button>
                <Offcanvas show={showSuppliers} placement="top" onHide={() => setShowSuppliers(false)}>
                    <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Suppliers</Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>
                        <Nav variant="underline" defaultActiveKey={selectedSupplier}>
                            {
                                suppliers.map((v, i) => 
                                    <Nav.Item key={i}>
                                        <Nav.Link onClick={() => filterOrderBySupplier(v)} eventKey={v.id}>{v.supplierName}</Nav.Link>
                                    </Nav.Item>
                                )
                            }
                        </Nav>
                    </Offcanvas.Body>
                </Offcanvas>
                </Col>
            </Row>
            <Row className="mb-3">
                <Col>
                    <ListGroup>
                        <ListGroupItem key={'header'}>
                                <Stack direction="horizontal">
                                    <Col>Invoice Date</Col>
                                    <Col>Supplier</Col>
                                    <Col sm="5">Particular</Col>
                                    <Col sm="3">Notes</Col>
                                    <Col sm="1"></Col>
                                </Stack>
                            </ListGroupItem>
                    { (!filteredOrders || filteredOrders.length === 0) && <ListGroupItem><Spinner animation="border" role="status"></Spinner></ListGroupItem> }        
                    { filteredOrders && filteredOrders.length > 0 &&
                        chunkedItems[activePage - 1]?.map((v, i) => 
                            <ListGroupItem key={i}>
                                <Stack direction="horizontal">
                                    <Col><i class="bi bi-calendar-event"></i> {v.invoiceDate}</Col>
                                    <Col>{findSupplier(v.supplierId).supplierName} <div><span>{v.deliveryOrderNo}</span></div></Col>
                                    <Col sm="5">
                                        <Row>
                                            <Col><Badge bg="info" pill>{v.itemCode}</Badge></Col>
                                        </Row>
                                        <Row>
                                            <Col sm="8">{v.partName}</Col>
                                            <Col><Badge>{v.quantity} {v.unit} @ each ${v.unitPrice}</Badge></Col>
                                        </Row>                                    
                                    </Col>
                                    <Col sm="3">{v.notes}</Col>
                                    <Col sm="1" className="text-sm-end"><i role="button" class="bi bi-pencil" onClick={() => recordUsage(v)}></i></Col>
                                </Stack>
                            </ListGroupItem>
                        )
                    }
                    </ListGroup>
                </Col>
            </Row>
            <Row>
                <Col>
                <Pagination>
                    { getPaginationItems(activePage, setActivePage, totalPages, 10) }
                </Pagination>
                </Col>
            </Row>
        </Container>
    )
}

export default SuppliersSpareParts