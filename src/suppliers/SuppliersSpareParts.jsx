import React, { useEffect, useState } from "react"
import { Container, ListGroup, ListGroupItem, Row, Col, Button, Badge, Nav, Offcanvas, ButtonGroup } from "react-bootstrap"
import { chunkArray } from "../utils/arrayUtils"
import AddSparePartsDialog from "./AddSparePartsDialog"
import SparePartsUsageDialog from "./SparePartsUsageDialog"
import remainingQuantity from "../utils/quantityUtils"
import NoteTakingDialog from "./NoteTakingDialog"
import { clearState } from "../autoRefreshWorker"
import SparePartNotes from "./SparePartNotes"
import SupplierSparePartsYearMonthView from "./SupplierSparePartsYearMonthView"
import { Calendar, EmptyBox, Notes, Suppliers, Tools, Truck } from "../Icons"
import ResponsivePagination from "../components/ResponsivePagination"
import PromptDeletionIcon from "../components/PromptDeletionIcon"
import { applyFilterOnOrders } from "../search/fuzzySearch"
import { useSupplierOrders } from "./SupplierOrderContextProvider"

/**
 * @callback UpdateOrderFunction
 * @param {import("./SupplierOrders").SupplierOrder} order an order to update
 * @param {boolean} note whether to just update notes only
 */

/**
 * 
 * @param {Object} props 
 * @param {React.SetStateAction<number>} props.setTotalFilteredOrders
 * @param {Object[]} props.selectedSearchOptions
 * @param {string} props.selectedSearchOptions[].name
 * @param {string} props.selectedSearchDate
 * @param {import("./SupplierOrders").Supplier[]} props.suppliers
 * @param {Object[]} props.vehicles
 * @param {import("../ServiceTransactions").SparePartUsage[]} props.sparePartUsages
 * @param {Function} props.refreshSparePartUsages
 * @param {Function} props.refreshServices
 * @param {Function} props.onNewVehicleCreated
 * @param {React.SetStateAction<boolean>} props.setLoading 
 * @param {Function>} props.showToastMessage 
 * @returns 
 */
function SuppliersSpareParts({setTotalFilteredOrders, 
    selectedSearchOptions, selectedSearchDate, suppliers, vehicles, sparePartUsages,
    refreshSparePartUsages, refreshServices,
    onNewVehicleCreated, setLoading, showToastMessage}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const supplierOrders = useSupplierOrders()

    const [activePage, setActivePage] = useState(1)

    const [showDialog, setShowDialog] = useState(false)
    const [existingOrder, setExistingOrder] = useState()
    
    const [showNoteDialog, setShowNoteDialog] = useState(false)
    const [noteSparePart, setNoteSparePart] = useState()

    const [showUsageDialog, setShowUsageDialog] = useState(false)
    const [usageSpareParts, setUsageSpareParts] = useState()

    const [showSuppliers, setShowSuppliers] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState()
    const [orderedSuppliers, setOrderedSuppliers] = useState()

    const filteredOrders = applyFilterOnOrders(selectedSearchOptions, selectedSearchDate, supplierOrders.list(), sparePartUsages, selectedSupplier)
    const chunkedItems = chunkArray(filteredOrders, 80)
    const totalPages = chunkedItems.length;

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
        setExistingOrder(supplierOrders.list().filter(o => o.deliveryOrderNo === no))
        setShowDialog(true)
    }

    const filterOrderBySupplier = (supplier) => {
        if (!selectedSupplier) {
            setSelectedSupplier(supplier)
        }
        else {
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
            .then(ordersJson => {
                supplierOrders.updateOrders(ordersJson)
            })
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
                supplierOrders.removeOrder(order)
                return Promise.all([refreshSparePartUsages(),
                refreshServices()])
            })
            .then(() => clearState())
            .finally(() => setLoading(false))
        })
    }

    const depleteOrder = (order) => {
        setLoading(true)
        requestAnimationFrame(() => {
            fetch(`${apiUrl}/api/supplier-spare-parts?op=DEPLETE`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify([order])
            })
            .then(res => {
                if (!res.ok) {
                    showToastMessage(`failed to deplete order ${JSON.stringify(order)}`)
                }
                return res.json()
            })
            .then(json => {
                if (json.status === 500 || json.code === 'SPP-001') {
                    showToastMessage(`failed to update order, response: ${JSON.stringify(json)}`)
                }
                else {
                    supplierOrders.updateOrders(json)
                }
            })
            .then(() => clearState())
            .finally(() => setLoading(false))
        })
    }

    /**
     * @type {UpdateOrderFunction}
     * @private
     */
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
                if (json.status === 500 || json.code === 'SP-QUANTITY-002' || json.code === 'SPP-001') {
                    showToastMessage(`failed to update order, response: ${JSON.stringify(json)}`)
                }
                else {
                    supplierOrders.updateOrders(json)
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

    useEffect(() => {
        if (selectedSearchOptions?.length > 0 || selectedSearchDate) {
            setActivePage(1)
            setTotalFilteredOrders(filteredOrders.length)
        }
    }, [selectedSearchOptions, selectedSearchDate, selectedSupplier])

    return (
        <Container fluid>
            <Row>
                <AddSparePartsDialog isShow={showDialog} 
                    setShowDialog={setShowDialog}
                    suppliers={suppliers}
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
                <ResponsivePagination activePage={activePage} setActivePage={setActivePage} 
                    totalPages={totalPages} />
                </Col>
                <Col className="text-end">
                    <ButtonGroup className='responsive-width-50'>
                        <Button variant="secondary" onClick={() => setOverview(true)}><i className="bi bi-card-heading"></i> Overview</Button>
                        <Button variant='success' onClick={() => setShowDialog(!showDialog)}><i className="bi bi-plus-circle-fill"></i> Add New</Button>
                    </ButtonGroup>
                </Col>
            </Row> }
            {!overview && <Row>
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
            { overview && <SupplierSparePartsYearMonthView suppliers={suppliers} backToOrders={() => setOverview(false)}></SupplierSparePartsYearMonthView> }
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
                                    <Col xs="6" md="3"><Notes /> Notes</Col>
                                    <Col xs="6" md="1"></Col>
                                </Row>
                        </ListGroupItem>
                    { (!filteredOrders || filteredOrders.length === 0) && <ListGroupItem>...</ListGroupItem> }        
                    { filteredOrders && filteredOrders.length > 0 &&
                        chunkedItems[activePage - 1]?.map(v => {
                            const quantityLeft = remainingQuantity(v, sparePartUsages)

                            return <ListGroupItem key={v.id} role="listitem">
                                <Row>
                                    <Col xs="6" md="2" className="fw-lighter">{v.invoiceDate}</Col>
                                    <Col xs="6" md="2">{findSupplier(v.supplierId).supplierName} <div className="p-0 m-0">{ !v.sheetName && 
                                        <Button className="p-0 text-decoration-none" variant="link" aria-label={`view order ${v.deliveryOrderNo}`}
                                            onClick={(e) => viewOrder(v.deliveryOrderNo, e)}>{v.deliveryOrderNo}</Button>} {v.sheetName && <span>{v.deliveryOrderNo}</span>}</div></Col>
                                    <Col xs="12" md="4">
                                        <Row>
                                            <Col><Badge bg="info" pill>{v.itemCode}</Badge></Col>
                                        </Row>
                                        <Row>
                                            <Col sm="8">{v.partName}</Col>
                                            <Col><Badge>{v.quantity} {v.unit} @ each ${v.unitPrice}</Badge>
                                              {quantityLeft < v.quantity && <Badge bg={quantityLeft === 0 ? 'danger' : 'warning' }>{quantityLeft} left</Badge>}
                                              {v.status === 'DEPLETED' && <Badge bg="danger">Nothing left</Badge>}
                                            </Col>
                                        </Row>                                    
                                    </Col>
                                    <Col xs="6" md="3"><SparePartNotes order={v} onNoteClick={() => recordNote(v)} sparePartUsages={sparePartUsages}></SparePartNotes></Col>
                                    <Col xs="6" md="1" className="text-end fs-5">
                                        {!v.sheetName && !v.disabled && quantityLeft === v.quantity && <PromptDeletionIcon confirmDelete={() => removeOrder(v)} /> }
                                        {quantityLeft === v.quantity && v.status === 'ACTIVE' && <span aria-label={`deplete order ${v.partName}`} role="button" className="me-2" onClick={() => depleteOrder(v)}><EmptyBox /></span>} 
                                        {quantityLeft > 0 && v.status === 'ACTIVE' && <span role="button" aria-label={`record usage for order ${v.partName}`} className="me-2" onClick={() => recordUsage(v)}><Truck /></span>}
                                    </Col>
                                </Row>
                            </ListGroupItem>
                        })
                    }
                    </ListGroup>
                </Col>
            </Row>
            <Row>
                <Col>
                <ResponsivePagination activePage={activePage} setActivePage={setActivePage} 
                    totalPages={totalPages} />
                </Col>
            </Row>
            </React.Fragment> }
        </Container>
    )
}

export default SuppliersSpareParts