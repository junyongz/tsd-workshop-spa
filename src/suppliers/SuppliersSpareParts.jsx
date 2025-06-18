import React, { useCallback, useEffect, useState } from "react"
import { Container, ListGroup, ListGroupItem, Row, Col, Pagination, Button, Badge, Nav, Offcanvas, OverlayTrigger, Popover, ButtonGroup } from "react-bootstrap"
import getPaginationItems from "../utils/getPaginationItems"
import { chunkArray } from "../utils/arrayUtils"
import AddSparePartsDialog from "./AddSparePartsDialog"
import SparePartsUsageDialog from "./SparePartsUsageDialog"
import remainingQuantity from "../utils/quantityUtils"
import NoteTakingDialog from "./NoteTakingDialog"
import { clearState } from "../autoRefreshWorker"
import SparePartNotes from "./SparePartNotes"
import SupplierSparePartsYearMonthView from "./SupplierSparePartsYearMonthView"
import { Calendar, Suppliers, Tools, Trash, Truck } from "../Icons"

function SuppliersSpareParts({filteredOrders=[], setFilteredOrders, 
    selectedSearchOptions=[], filterServices=() => {},
    orders=[], suppliers=[], spareParts=[], vehicles=[], sparePartUsages=[],
    refreshSpareParts=() => {}, refreshSparePartUsages=() =>{}, refreshServices=()=>{},
    onNewVehicleCreated=() => {}, setLoading=()=>{}, showToastMessage}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const [activePage, setActivePage] = useState(1)
    const chunkedItems = chunkArray(filteredOrders, 80)
    const totalPages = chunkedItems.length;

    const [showDialog, setShowDialog] = useState(false)
    const [existingOrder, setExistingOrder] = useState()
    
    const [showNoteDialog, setShowNoteDialog] = useState(false)
    const [noteSparePart, setNoteSparePart] = useState()

    const [showUsageDialog, setShowUsageDialog] = useState(false)
    const [usageSpareParts, setUsageSpareParts] = useState()

    const [showSuppliers, setShowSuppliers] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState()
    const [orderedSuppliers, setOrderedSuppliers] = useState()

    const [overview, setOverview] = useState(false)

    const findSupplier = (supplierId) => {
        return suppliers.find(v => v.id === supplierId)
    }

    const recordUsage = (v) => {
        setUsageSpareParts({...v, remaining: remainingQuantity(v, sparePartUsages), supplierName: findSupplier(v.supplierId).supplierName})
        setShowUsageDialog(true)
    }

    const recordNote = (v) => {
        setNoteSparePart({...v, remaining: remainingQuantity(v, sparePartUsages), supplierName: findSupplier(v.supplierId).supplierName})
        setShowNoteDialog(true)
    }

    const viewOrder = (no) => {
        setExistingOrder(orders.listing.filter(o => o.deliveryOrderNo === no))
        setShowDialog(true)
    }

    const filterOrderBySupplier = (supplier) => {
        if (!selectedSupplier) {
            setFilteredOrders(filteredOrders.filter(s => s.supplierId === supplier.id))
            setSelectedSupplier(supplier)
        }
        else {
            if (selectedSearchOptions.length > 0) {
                filterServices(selectedSearchOptions)
            }
            else {
                setFilteredOrders(orders.listing)
            }
            setSelectedSupplier()
        }
    }

    const onSaveNewOrders = (newOrders=[], callback=() => {}) => {
        setLoading(true)
        requestAnimationFrame(() => {
            fetch(`${apiUrl}/api/supplier-spare-parts`, {
                method: 'POST',
                body: JSON.stringify(newOrders),
                mode: 'cors',
                headers: {
                    'Content-type': 'application/json'
                }
            })
            .then(res => res.json())
            .then(response => {
                response.forEach(o => {
                    const idx = orders.listing.findIndex(oo => oo.id === o.id)
                    if (idx >= 0) {
                        orders.listing[idx] = o
                    }
                    else {
                        orders.listing.push(o)
                    }
                    orders.mapping[o.id] = o
                })
                // orders.push(...response)
                orders.listing.sort((a, b) => a.invoiceDate < b.invoiceDate)
                setFilteredOrders((selectedSupplier && orders.listing.filter(s => s.supplierId === selectedSupplier.id)) || orders.listing)
            })
            .then(() => refreshSpareParts())
            .then(() => callback && callback())
            .then(() => clearState())
            .catch(e => showToastMessage('failed to save orders: ' + e))
            .finally(() => setLoading(false))
        })
    }

    const onSaveNewSparePartUsage = (spu) => {
        setLoading(true)
        requestAnimationFrame(() => {
            fetch(`${apiUrl}/api/spare-part-utilizations`, {
                method: 'POST',
                body: JSON.stringify(spu),
                mode: 'cors',
                headers: {
                    'Content-type': 'application/json'
                }
            })
            .then(res => res.json())
            .then(() => Promise.all([refreshSparePartUsages(), refreshServices()]))
            .then(() => clearState())
            .finally(() => setLoading(false))
        })
    }

    const removeOrder = (order) => {
        setLoading(true)
        requestAnimationFrame(() => {
            fetch(`${apiUrl}/api/supplier-spare-parts/${order.id}`, {
                method: 'DELETE',
                mode: 'cors',
                headers: {
                    'Content-type': 'application/json'
                }
            })
            .then(res => {
                if (!res.ok) {
                    showToastMessage(`failed to delete order ${JSON.stringify(order)}`)
                }
            })
            .then(_ => {
                orders.listing.splice(orders.listing.findIndex(o => o.id === order.id), 1)
                delete orders.mapping[order.id]
                setFilteredOrders((selectedSupplier && orders.listing.filter(s => s.supplierId === selectedSupplier.id)) || orders.listing)
                return Promise.all([refreshSparePartUsages(),
                refreshSpareParts(),
                refreshServices()])
            })
            .then(() => clearState())
            .finally(() => setLoading(false))
        })
    }

    const onUpdateOrder = (order, note) => {
        setLoading(true)
        requestAnimationFrame(() => {
            fetch(`${apiUrl}/api/supplier-spare-parts${note ? '?op=NOTES' : ''}`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify([order])
            })
            .then(res => {
                if (!res.ok) {
                    showToastMessage(`failed to update order ${JSON.stringify(order)}`)
                }
                return res.json()
            })
            .then(json => {
                if (json.status === 500 || json.code === 'SP-QUANTITY-002') {
                    showToastMessage(`failed to update order, response: ${JSON.stringify(json)}`)
                }
                else {
                    orders.mapping[order.id] = order
                    orders.listing[orders.listing.findIndex(o => o.id === order.id)] = order
                    setFilteredOrders((selectedSupplier && orders.listing.filter(s => s.supplierId === selectedSupplier.id)) || orders.listing)
                }
            })
            .then(() => clearState())
            .finally(() => setLoading(false))
        })
    }

    const orderSupplierByRecentOrder = () => {
        setOrderedSuppliers([...suppliers])
    }

    const orderSupplierByName = () => {
        setOrderedSuppliers([...suppliers].sort((a, b) => a.supplierName.toLowerCase().localeCompare(b.supplierName.toLowerCase())))
    }

    const replaceOrders = useCallback(() => setFilteredOrders(orders.listing), [orders, setFilteredOrders] )
    useEffect(() => {
        if (selectedSearchOptions.length > 0) {
            setSelectedSupplier()
            setActivePage(1)
        }
        else {
            // as good as changing from some search option to no option at all, so just set all
            replaceOrders()
        }
    }, [selectedSearchOptions, replaceOrders])

    return (
        <Container fluid>
            <Row>
                <AddSparePartsDialog isShow={showDialog} 
                    setShowDialog={setShowDialog}
                    suppliers={suppliers}
                    spareParts={spareParts}
                    orders={orders}
                    existingOrder={existingOrder}
                    onSaveNewOrders={onSaveNewOrders}
                    sparePartUsages={sparePartUsages}
                ></AddSparePartsDialog>
                { noteSparePart && <NoteTakingDialog isShow={showNoteDialog} 
                    setShowDialog={setShowNoteDialog} 
                    noteSparePart={noteSparePart}
                    onUpdateOrder={onUpdateOrder}
                ></NoteTakingDialog> }
                { usageSpareParts && <SparePartsUsageDialog isShow={showUsageDialog}
                    setShowDialog={setShowUsageDialog} 
                    vehicles={vehicles}
                    usageSpareParts={usageSpareParts}
                    setUsageSpareParts={setUsageSpareParts}
                    onSaveNewSparePartUsage={onSaveNewSparePartUsage}
                    onNewVehicleCreated={onNewVehicleCreated}
                ></SparePartsUsageDialog> }
            </Row>
            {!overview && <Row>
                <Col>
                <Pagination className='d-flex d-lg-none fw-lighter'>
                { getPaginationItems(activePage, setActivePage, totalPages, 3) }
                </Pagination>
                <Pagination className='d-none d-lg-flex fw-lighter'>
                { getPaginationItems(activePage, setActivePage, totalPages, 10) }
                </Pagination>
                </Col>
                <Col className="text-end">
                    <ButtonGroup className='responsive-width-50'>
                        <Button variant="secondary" onClick={() => setOverview(true)}><i className="bi bi-card-heading me-2"></i>Overview</Button>
                        <Button variant='success' onClick={() => setShowDialog(!showDialog)}><i className="bi bi-plus-circle-fill me-2"></i>Add New</Button>
                    </ButtonGroup>
                </Col>
            </Row> }
            {selectedSearchOptions.length === 0 && !overview && <Row>
                <Col>
                    <Button variant="link" onClick={() => setShowSuppliers(true)}>{ selectedSupplier ? `Showing for ${suppliers.find(v => v.id === selectedSupplier.id).supplierName}` : 'Showing All'}</Button>
                    <Offcanvas onShow={() => orderSupplierByRecentOrder()} show={showSuppliers} placement="top" onHide={() => setShowSuppliers(false)}>
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title><Suppliers /> Suppliers</Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <Nav variant="pills" defaultActiveKey='recent'>
                            <Nav.Item><Nav.Link onClick={() => orderSupplierByRecentOrder()} eventKey='recent'>By Recent Order</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link onClick={() => orderSupplierByName()} eventKey='name'>By Name</Nav.Link></Nav.Item>
                            </Nav>
                            <Nav variant="underline" defaultActiveKey={selectedSupplier?.id} activeKey={selectedSupplier?.id}>
                                {
                                    orderedSuppliers?.map(v => 
                                        <Nav.Item key={v.id}>
                                            <Nav.Link onClick={() => filterOrderBySupplier(v)} eventKey={v.id}>{v.supplierName}</Nav.Link>
                                        </Nav.Item>
                                    )
                                }
                            </Nav>
                        </Offcanvas.Body>
                    </Offcanvas>
                </Col>
            </Row> }
            { overview && <SupplierSparePartsYearMonthView orders={orders} suppliers={suppliers} backToOrders={() => setOverview(false)}></SupplierSparePartsYearMonthView> }
            { !overview &&
            <React.Fragment>
            <Row className="mb-3">
                <Col>
                    <ListGroup>
                        <ListGroupItem key={'header'}>
                                <Row>
                                    <Col xs="6" md="2"><Calendar /> Invoice Date</Col>
                                    <Col xs="6" md="2"><Suppliers /> Supplier</Col>
                                    <Col xs="12" md="4"><Tools /> Particular</Col>
                                    <Col xs="6" md="3"><i className="bi bi-card-text"></i> Notes</Col>
                                    <Col xs="6" md="1"></Col>
                                </Row>
                        </ListGroupItem>
                    { (!filteredOrders || filteredOrders.length === 0) && <ListGroupItem>...</ListGroupItem> }        
                    { filteredOrders && filteredOrders.length > 0 &&
                        chunkedItems[activePage - 1]?.map(v => 
                            <ListGroupItem key={v.id}>
                                <Row>
                                    <Col xs="6" md="2" className="fw-lighter">{v.invoiceDate}</Col>
                                    <Col xs="6" md="2">{findSupplier(v.supplierId).supplierName} <div className="p-0 m-0">{ !v.sheetName && <Button className="p-0 text-decoration-none" variant="link"
                                        onClick={(e) => viewOrder(v.deliveryOrderNo, e)}>{v.deliveryOrderNo}</Button>}{v.sheetName && <span>{v.deliveryOrderNo}</span>}</div></Col>
                                    <Col xs="12" md="4">
                                        <Row>
                                            <Col><Badge bg="info" pill>{v.itemCode}</Badge></Col>
                                        </Row>
                                        <Row>
                                            <Col sm="8">{v.partName}</Col>
                                            <Col><Badge>{v.quantity} {v.unit} @ each ${v.unitPrice}</Badge>{remainingQuantity(v, sparePartUsages) < v.quantity && <Badge bg={remainingQuantity(v, sparePartUsages) === 0 ? 'danger' : 'warning' }>{remainingQuantity(v, sparePartUsages)} left</Badge>}</Col>
                                        </Row>                                    
                                    </Col>
                                    <Col xs="6" md="3"><SparePartNotes order={v} onNoteClick={() => recordNote(v)} sparePartUsages={sparePartUsages}></SparePartNotes></Col>
                                    <Col xs="6" md="1" className="text-end">
                                        {!v.sheetName && 
                                        <OverlayTrigger trigger="click" placement="left" overlay={
                                            <Popover>
                                            <Popover.Header as="h3">Are you sure?</Popover.Header>
                                            <Popover.Body>
                                                <Button className="p-0 text-decoration-none" variant="link" onClick={() => removeOrder(v)}>Yes</Button>
                                            </Popover.Body>
                                            </Popover>
                                        }>
                                            <span role="button" className="text-danger fs-5"><Trash />&nbsp;</span>
                                        </OverlayTrigger>
                                        }
                                        <span className="fs-5"><Truck role="button" onClick={() => recordUsage(v)} /></span>
                                    </Col>
                                </Row>
                            </ListGroupItem>
                        )
                    }
                    </ListGroup>
                </Col>
            </Row>
            <Row>
                <Col>
                <Pagination>
                <Pagination className='d-flex d-lg-none fw-lighter'>
                { getPaginationItems(activePage, setActivePage, totalPages, 3) }
                </Pagination>
                <Pagination className='d-none d-lg-flex fw-lighter'>
                { getPaginationItems(activePage, setActivePage, totalPages, 10) }
                </Pagination>
                </Pagination>
                </Col>
            </Row>
            </React.Fragment> }
        </Container>
    )
}

export default SuppliersSpareParts