import { useState } from "react"
import { Container, ListGroup, ListGroupItem, Row, Col, Stack, Pagination, Button, Badge, Nav, Offcanvas, Spinner, ButtonGroup } from "react-bootstrap"
import getPaginationItems from "../utils/getPaginationItems"
import { chunkArray } from "../utils/arrayUtils"
import AddSparePartsDialog from "./AddSparePartsDialog"
import SparePartsUsageDialog from "./SparePartsUsageDialog"
import remainingQuantity from "../utils/quantityUtils"

function SuppliersSpareParts({filteredOrders=[], setFilteredOrders, 
    orders=[], suppliers=[], spareParts=[], vehicles=[], sparePartUsages=[],
    refreshSpareParts=() => {}, refreshSparePartUsages=() =>{}, refreshServices=()=>{},
    onNewVehicleCreated=() => {}, setLoading=()=>{}}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const [activePage, setActivePage] = useState(1)
    const chunkedItems = chunkArray(filteredOrders, 80)
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
        setUsageSpareParts({...v, quantity: remainingQuantity(v, sparePartUsages), supplierName: findSupplier(v.supplierId).supplierName})
        setShowUsageDialog(true)
    }

    const filterOrderBySupplier = (supplier) => {
        if (!selectedSupplier) {
            setFilteredOrders(orders.filter(s => s.supplierId === supplier.id))
            setSelectedSupplier(supplier.id)
        }
        else {
            setFilteredOrders(orders)
            setSelectedSupplier()
        }
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
            refreshSpareParts()
            callback && callback()
        })
    }

    const onSaveNewSparePartUsage = (spu) => {
        setLoading(true)
        requestAnimationFrame(() => {
            fetch(`${apiUrl}/spare-part-utilizations`, {
                method: 'POST',
                body: JSON.stringify(spu),
                mode: 'cors',
                headers: {
                    'Content-type': 'application/json'
                }
            })
            .then(res => res.json())
            .then(() => Promise.all[refreshSparePartUsages(),
                refreshServices()])
            .then(() => setLoading(false))
        })
    }

    const removeOrder = (order) => {
        fetch(`${apiUrl}/supplier-spare-parts/${order.id}`, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) {
                throw `failed to delete order ${JSON.stringify(order)}`
            }
        })
        .then(_ => {
            orders.splice(orders.findIndex(o => o.id === order.id), 1)
            setFilteredOrders((selectedSupplier && orders.filter(s => s.supplierId === selectedSupplier.id)) || orders)
            refreshSparePartUsages()
            refreshSpareParts()
            refreshServices()
        })
    }

    return (
        <Container>
            <Row>
                <AddSparePartsDialog isShow={showDialog} 
                    setShowDialog={setShowDialog}
                    suppliers={suppliers}
                    spareParts={spareParts}
                    orders={orders}
                    onSaveNewOrders={onSaveNewOrders}></AddSparePartsDialog>
                { usageSpareParts && <SparePartsUsageDialog isShow={showUsageDialog}
                    setShowDialog={setShowUsageDialog} 
                    vehicles={vehicles}
                    usageSpareParts={usageSpareParts}
                    setUsageSpareParts={setUsageSpareParts}
                    onSaveNewSparePartUsage={onSaveNewSparePartUsage}
                    onNewVehicleCreated={onNewVehicleCreated}
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
                <ButtonGroup>
                    <Button variant="link" onClick={() => setShowSuppliers(true)}>{ selectedSupplier ? `Showing for ${suppliers.find(v => v.id === selectedSupplier).supplierName}` : 'Showing All'}</Button>                </ButtonGroup>
                    <Offcanvas show={showSuppliers} placement="top" onHide={() => setShowSuppliers(false)}>
                        <Offcanvas.Header closeButton>
                        <Offcanvas.Title><i className="bi bi-shop"></i> Suppliers</Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <Nav variant="underline" defaultActiveKey={selectedSupplier} activeKey={selectedSupplier}>
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
                                    <Col><i className="bi bi-calendar-event"></i> Invoice Date</Col>
                                    <Col><i className="bi bi-shop"></i> Supplier</Col>
                                    <Col sm="5"><i className="bi bi-tools"></i> Particular</Col>
                                    <Col sm="3"><i className="bi bi-card-text"></i> Notes</Col>
                                    <Col sm="1"></Col>
                                </Stack>
                            </ListGroupItem>
                    { (!filteredOrders || filteredOrders.length === 0) && <ListGroupItem><Spinner animation="border" role="status"></Spinner></ListGroupItem> }        
                    { filteredOrders && filteredOrders.length > 0 &&
                        chunkedItems[activePage - 1]?.map(v => 
                            <ListGroupItem key={v.id}>
                                <Stack direction="horizontal">
                                    <Col>{v.invoiceDate}</Col>
                                    <Col>{findSupplier(v.supplierId).supplierName} <div><span>{v.deliveryOrderNo}</span></div></Col>
                                    <Col sm="5">
                                        <Row>
                                            <Col><Badge bg="info" pill>{v.itemCode}</Badge></Col>
                                        </Row>
                                        <Row>
                                            <Col sm="8">{v.partName}</Col>
                                            <Col><Badge>{v.quantity} {v.unit} @ each ${v.unitPrice}</Badge>{remainingQuantity(v, sparePartUsages) < v.quantity && <Badge bg={remainingQuantity(v, sparePartUsages) === 0 ? 'danger' : 'warning' }>{remainingQuantity(v, sparePartUsages)} left</Badge>}</Col>
                                        </Row>                                    
                                    </Col>
                                    <Col sm="3"><div>
                                    {v.notes && <span>{v.notes}</span>}
                                    {sparePartUsages.findIndex(spu => spu.orderId === v.id) >= 0 
                                        && sparePartUsages.filter(spu => spu.orderId === v.id)
                                            .map(spu => <span style={{display: 'block'}}>Used by {spu.vehicleNo} @ {spu.usageDate}</span>)
                                            }
                                    </div></Col>
                                    <Col sm="1" className="text-sm-end">
                                        {!v.sheetName && <span onClick={() => removeOrder(v)} role="button"><i className="bi bi-x-lg text-danger"></i>&nbsp;</span>}
                                        <i role="button" className="bi bi-pencil" onClick={() => recordUsage(v)}></i>
                                    </Col>
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