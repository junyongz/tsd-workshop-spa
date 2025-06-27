import { useState } from "react";
import { Button, Col, Container, ListGroup, ListGroupItem, Row } from "react-bootstrap";
import { Camera, NoteTaking } from "../Icons";
import SupplierOrders from "../suppliers/SupplierOrders";

export default function SpareParts({orders=new SupplierOrders(), suppliers=[]}) {

    const [spareParts, setSpareParts] = useState([
        {id: 1000, partNo: '44350-1610', description: 'Power Steering Pump',
            oem: [{name: 'XSMY Co.', url: 'http://xsmy.co'}], 
            trucks: ['Hino 500', 'Hino 700'], 
            orderIds: [1273, 1994]}
    ])

    // fetch spare parts here
    // to fetch medias separately
    // to use orders, and orderIds as json fields 
    // dialog to have orders screen to map

    return (
        <Container fluid>
        <Row className="mb-3">
            <Col className="text-end">
                <Button>Add New</Button>
            </Col>
        </Row>
        <Row>
            <Col>
                <ListGroup>
                    <ListGroupItem key={'header'}>
                        <Row>
                            <Col xs="6" lg="1">OE No</Col>
                            <Col xs="6" lg="3">Part Description (with Pen & Medias)</Col>
                            <Col xs="12" lg="3">OE Manufacturers (with URLs)</Col>
                            <Col xs="6" lg="2">Compatible Trucks</Col>
                            <Col xs="6" lg="3">Suppliers (with price range)</Col>
                        </Row>
                    </ListGroupItem>
                    { spareParts.map(v => 
                    <ListGroupItem key={v.id}>
                            <Row>
                            <Col xs="6" lg="1">{v.partNo}</Col>
                            <Col xs="6" lg="3"><NoteTaking /> <Camera /> {v.description}</Col>
                            <Col xs="12" lg="3">
                                {v.oem.map(o => 
                                    <div><a href={o.url}>{o.name}</a></div>
                                )}
                            </Col>
                            <Col xs="6" lg="2">
                                {v.trucks.map(t => 
                                    <div>{t}</div>
                                )}
                            </Col>
                            <Col xs="6" lg="3">
                                {v.orderIds?.map(oid => 
                                    <div>{suppliers.find(sp => sp.id === orders.byId(oid)?.supplierId)?.supplierName}</div>
                                )}
                            </Col>
                            </Row>
                    </ListGroupItem>
                    )}
                </ListGroup>
            </Col>
        </Row>
        </Container>
    )
}