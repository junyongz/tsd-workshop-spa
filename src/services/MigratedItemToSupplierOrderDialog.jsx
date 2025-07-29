import { Button, Card, Col, Form, Modal, Row } from "react-bootstrap";
import SparePartsSubDialog from "./SparePartsSubDialog";
import { useRef, useState } from "react";
import { Calendar } from "../Icons";

export default function MigratedItemToSupplierOrderDialog({item: {migratedItem, ws}, suppliers, sparePartUsages, onHideDialog, onMigrate}) {
    
    const [items, setItems] = useState([{...migratedItem, selectedSpareParts: []}])
    const formRef = useRef()
    const [validated, setValidated] = useState(false)

    const doMigrate = () => {
        if (formRef.current.checkValidity() === false) {
            setValidated(true)
            return
        }

        const sparePartUsageToSave = {
            vehicleId: ws.vehicleId,
            vehicleNo: ws.vehicleNo,
            usageDate: migratedItem.creationDate,
            orderId: items[0].selectedSpareParts[0].id,
            serviceId: ws.id,
            quantity: items[0].quantity,
            soldPrice: items[0].unitPrice,
            migDataIndex: migratedItem.index
        }

        onMigrate(sparePartUsageToSave)
        doOnHideDialog()
    }

    const doOnHideDialog = () => {
        setItems()
        setValidated(false)
        onHideDialog()
    }

    return (
        <Modal show size="xl" onHide={doOnHideDialog}>
            <Modal.Header closeButton><i className="bi bi-box-arrow-right" /> <span className="mx-1">Migrate to a proper order:</span><span className="fw-semibold">{ws.vehicleNo} @ {ws.startDate}</span></Modal.Header>
            <Modal.Body>
                <Card className="mb-3" bg="dark" text="white">
                    <Card.Header>{migratedItem.itemDescription}</Card.Header>
                    <Card.Body>
                    <Row>
                        <Col xs="12" md="6"><span className="text-secondary">Usage date: </span> <Calendar /> {migratedItem.creationDate}</Col>
                        <Col xs="6"><span className="text-secondary">Unit Price: </span> $ {migratedItem.unitPrice?.toFixed(2)}</Col>
                        <Col xs="6"><span className="text-secondary">Quantity: </span> {migratedItem.quantity}</Col>
                        <Col xs="6"><span className="text-secondary">Unit: </span> {migratedItem.unit}</Col>
                        <Col xs="12"><span className="text-secondary">Total Price: </span> $ {migratedItem.totalPrice}</Col>             
                    </Row>
                    </Card.Body>
                </Card>
                <span>Migrate to: </span>
                <Form ref={formRef} validated={validated}>
                <SparePartsSubDialog migration suppliers={suppliers} items={items} setItems={setItems} sparePartUsages={sparePartUsages}></SparePartsSubDialog>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button aria-label={`migrate item ${migratedItem.itemDescription}`} onClick={() => doMigrate()}><i className="bi bi-box-arrow-right" /> Go</Button>
            </Modal.Footer>
        </Modal>
    )
}