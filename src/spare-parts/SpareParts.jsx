import { useEffect, useState } from "react";
import { Button, Col, Container, ListGroup, ListGroupItem, Row } from "react-bootstrap";
import SupplierOrders from "../suppliers/SupplierOrders";
import SparePartDialog from "./SparePartDialog";
import PromptDeletionIcon from "../components/PromptDeletionIcon";

export default function SpareParts({orders=new SupplierOrders(), suppliers=[]}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const [showSparePartDialog, setShowSparePartDialog] = useState(false)

    const [spareParts, setSpareParts] = useState([
        {id: 1000, partNo: '44350-1610', partName: 'Power Steering Pump',
            description: "Generates hydraulic pressure to assist in turning the vehicle's wheels, making steering easier and smoother, especially at low speeds",
            oems: [{name: 'XSMY Co.', url: 'http://xsmy.co'}], 
            trucks: [{make: 'Hino', model: '500'}, {make: 'Hino', model: '700'}], 
            supplierIds: [19936, 9799],
            orderIds: [19929, 9767]}
    ])

    const [existingSparePart, setExistingSparePart] = useState()

    const afterSave = (sparePart) => {
        setSpareParts(prev => {
            const existings = prev.map(p => p.id === sparePart.id ? sparePart : {...p})
            const newOnes = prev.filter(p => p.id === sparePart.id).length === 0 ? [sparePart] : []

            return existings.concat(newOnes).sort((a, b) => b.creationDate - a.creationDate)
        })
        orders.updateOrdersSparePartId(sparePart.id, sparePart.orderIds)
    }

    const showDialogFor = (sparePart) => {
        setExistingSparePart(sparePart)
        setShowSparePartDialog(true)
    }

    // fetch spare parts here
    // to fetch medias separately
    // to use orders, and orderIds as json fields 
    // dialog to have orders screen to map

    const removeSparePart = (v) => {
        fetch(`${apiUrl}/api/spare-parts/${v.id}`, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(resp => resp.json())
        .then(deleteId => {
            setSpareParts(prev => {
                const newItems = [...prev]
                newItems.splice(newItems.findIndex(sp => sp.id === deleteId), 1)
                return newItems.sort((a, b) => b.creationDate - a.creationDate)
            })
            // TODO update to null for orders.sparePartId
        }) 
    }

    useEffect(() => {
        fetch(`${apiUrl}/api/spare-parts`, {
            mode: 'cors',
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(resp => resp.json())
        .then(spJson => setSpareParts(spJson))
    }, [])

    return (
        <Container fluid>
        <Row>
            <Col><SparePartDialog isShow={showSparePartDialog} 
                setShowDialog={setShowSparePartDialog} 
                orders={orders} suppliers={suppliers}
                afterSave={afterSave}
                sparePart={existingSparePart}
                setSparePart={setExistingSparePart} /></Col>
        </Row>
        <Row className="mb-3">
            <Col className="text-end">
                <Button aria-label="button to show dialog for add/edit spare part" variant='success' 
                    onClick={() => {setExistingSparePart({oems:[],compatibleTrucks:[],supplierIds:[],orderIds:[]}); setShowSparePartDialog(true)}}>
                        <i className="bi bi-plus-circle-fill"></i> Add New</Button>
                
            </Col>
        </Row>
        <Row>
            <Col>
                <ListGroup>
                    <ListGroupItem key={'header'}>
                        <Row>
                            <Col xs="12" lg="2">OE No</Col>
                            <Col xs="12" lg="3">Part Name</Col>
                            <Col xs="12" lg="2">OE Manufacturers</Col>
                            <Col xs="6" lg="2">Compatible Trucks</Col>
                            <Col xs="6" lg="3">Suppliers</Col>
                        </Row>
                    </ListGroupItem>
                    { spareParts.map(v => {
                    const matchedOrders = orders.list().filter(o => o.sparePartId === v.id)
                    const supplierIds = Array.from(new Set(matchedOrders.map(mo => mo.supplierId)))

                    matchedOrders.sort((a, b) => a.unitPrice - b.unitPrice)
                    const hasVariousPrices = Array.from(new Set(matchedOrders.map(mo => mo.unitPrice))).length > 1

                    return <ListGroupItem key={v.id}>
                            <Row>
                            <Col xs="12" lg="2">{v.partNo}</Col>
                            <Col xs="12" lg="3"><a href="#" onClick={() => showDialogFor(v)} className="link-opacity-75-hover">{v.partName}</a>
                            <span className="d-block text-secondary">{v.description}</span>
                            </Col>
                            <Col xs="12" lg="2">
                                {v.oems.map(o => 
                                    <div><a href={o.url}>{o.name}</a></div>
                                )}
                            </Col>
                            <Col xs="6" lg="2">
                                {v.compatibleTrucks?.map(t => 
                                    <div>{t.make} {t.model}</div>
                                )}
                            </Col>
                            <Col xs="6" lg="2">
                                {supplierIds.map(spId => 
                                    <div>{suppliers.find(sp => sp.id === spId)?.supplierName}</div>
                                )}
                                {!hasVariousPrices && <span>${matchedOrders[0]?.unitPrice}</span>}
                                {hasVariousPrices && <span>${matchedOrders[0]?.unitPrice} - ${matchedOrders[matchedOrders.length - 1]?.unitPrice}</span>}
                            </Col>
                            <Col xs="12" lg="1" className="text-end">
                            <PromptDeletionIcon confirmDelete={() => removeSparePart(v)}/>
                            </Col>
                            </Row>
                    </ListGroupItem>
                    })}
                </ListGroup>
            </Col>
        </Row>
        </Container>
    )
}