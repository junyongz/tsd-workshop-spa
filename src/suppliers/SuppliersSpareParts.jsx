import React, { useEffect, useState } from "react"
import { Container, ListGroup, ListGroupItem, Row, Col, Stack, Pagination, Button, Badge, Nav, Offcanvas, ButtonGroup, OverlayTrigger, Popover } from "react-bootstrap"
import getPaginationItems from "../utils/getPaginationItems"
import { chunkArray } from "../utils/arrayUtils"
import AddSparePartsDialog from "./AddSparePartsDialog"
import SparePartsUsageDialog from "./SparePartsUsageDialog"
import remainingQuantity from "../utils/quantityUtils"
import NoteTakingDialog from "./NoteTakingDialog"
import { clearState } from "../autoRefreshWorker"
import SparePartNotes from "./SparePartNotes"

function SuppliersSpareParts({filteredOrders=[], setFilteredOrders, 
    selectedSearchOptions=[], filterServices=() => {},
    orders=[], suppliers=[], spareParts=[], vehicles=[], sparePartUsages=[],
    refreshSpareParts=() => {}, refreshSparePartUsages=() =>{}, refreshServices=()=>{},
    onNewVehicleCreated=() => {}, setLoading=()=>{}}) {
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

    const viewOrder = (no, e) => {
        e.preventDefault()
        setExistingOrder(orders.filter(o => o.deliveryOrderNo === no))
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
                setFilteredOrders(orders)
            }
            setSelectedSupplier()
        }
    }

    const onSaveNewOrders = (newOrders=[], callback=() => {}) => {
        setLoading(true)
        requestAnimationFrame(() => {
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
            })
            .then(() => refreshSpareParts())
            .then(() => callback && callback())
            .then(() => clearState())
            .finally(() => setLoading(false))
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
            .then(() => Promise.all([refreshSparePartUsages(), refreshServices()]))
            .then(() => clearState())
            .finally(() => setLoading(false))
        })
    }

    const removeOrder = (order) => {
        setLoading(true)
        requestAnimationFrame(() => {
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
                return Promise.all([refreshSparePartUsages(),
                refreshSpareParts(),
                refreshServices()])
            })
            .then(() => clearState())
            .finally(() => setLoading(false))
        })
    }

    const onUpdateOrder = (order) => {
        setLoading(true)
        requestAnimationFrame(() => {
            fetch(`${apiUrl}/supplier-spare-parts`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify([order])
            })
            .then(res => {
                if (!res.ok) {
                    throw `failed to delete order ${JSON.stringify(order)}`
                }
            })
            .then(_ => {
                orders[orders.findIndex(o => o.id === order.id)] = order
                setFilteredOrders((selectedSupplier && orders.filter(s => s.supplierId === selectedSupplier.id)) || orders)
            })
            .then(() => clearState())
            .finally(() => setLoading(false))
        })
    }

    useEffect(() => {
        if (selectedSearchOptions.length > 0) {
            setSelectedSupplier()
        }

        return () => setSelectedSupplier()
    }, [selectedSearchOptions])

    return (
        <Container>
            <Row>
                <AddSparePartsDialog isShow={showDialog} 
                    setShowDialog={setShowDialog}
                    suppliers={suppliers}
                    spareParts={spareParts}
                    orders={orders}
                    existingOrder={existingOrder}
                    onSaveNewOrders={onSaveNewOrders}
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
            {selectedSearchOptions.length === 0 && <Row>
                <Col>
                <ButtonGroup>
                    <Button variant="link" onClick={() => setShowSuppliers(true)}>{ selectedSupplier ? `Showing for ${suppliers.find(v => v.id === selectedSupplier.id).supplierName}` : 'Showing All'}</Button>                </ButtonGroup>
                    <Offcanvas show={showSuppliers} placement="top" onHide={() => setShowSuppliers(false)}>
                        <Offcanvas.Header closeButton>
                        <Offcanvas.Title><i className="bi bi-shop"></i> Suppliers</Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <Nav variant="underline" defaultActiveKey={selectedSupplier?.id} activeKey={selectedSupplier?.id}>
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
            </Row> }
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
                    { (!filteredOrders || filteredOrders.length === 0) && <ListGroupItem>...</ListGroupItem> }        
                    { filteredOrders && filteredOrders.length > 0 &&
                        chunkedItems[activePage - 1]?.map(v => 
                            <ListGroupItem key={v.id}>
                                <Stack direction="horizontal">
                                    <Col>{v.invoiceDate}</Col>
                                    <Col>{findSupplier(v.supplierId).supplierName} <div>{ false && <a className="link-offset-2 link-offset-3-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover" href="#"
                                        onClick={(e) => viewOrder(v.deliveryOrderNo, e)}>{v.deliveryOrderNo}</a>}{v.deliveryOrderNo}</div></Col>
                                    <Col sm="5">
                                        <Row>
                                            <Col><Badge bg="info" pill>{v.itemCode}</Badge></Col>
                                        </Row>
                                        <Row>
                                            <Col sm="8">{v.partName}</Col>
                                            <Col><Badge>{v.quantity} {v.unit} @ each ${v.unitPrice}</Badge>{remainingQuantity(v, sparePartUsages) < v.quantity && <Badge bg={remainingQuantity(v, sparePartUsages) === 0 ? 'danger' : 'warning' }>{remainingQuantity(v, sparePartUsages)} left</Badge>}</Col>
                                        </Row>                                    
                                    </Col>
                                    <Col sm="3"><SparePartNotes order={v} onNoteClick={() => recordNote(v)} sparePartUsages={sparePartUsages}></SparePartNotes></Col>
                                    <Col sm="1" className="text-sm-end">
                                        {!v.sheetName && 
                                        <OverlayTrigger trigger="click" placement="left" overlay={
                                            <Popover>
                                            <Popover.Header as="h3">Are you sure?</Popover.Header>
                                            <Popover.Body>
                                                <a role="button" href="#" className="link-danger link-underline-opacity-25 link-underline-opacity-100-hover" onClick={() => removeOrder(v)}>Yes</a>
                                            </Popover.Body>
                                            </Popover>
                                        }>
                                            <span role="button"><i className="bi bi-x-lg text-danger"></i>&nbsp;</span>
                                        </OverlayTrigger>
                                        }
                                        <i role="button" className="bi bi-truck" onClick={() => recordUsage(v)}></i>
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