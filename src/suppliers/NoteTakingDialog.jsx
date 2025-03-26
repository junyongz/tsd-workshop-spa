import { useRef, useState } from "react";
import { Button, Col, Container, Form, InputGroup, Modal, Row } from "react-bootstrap";

function NoteTakingDialog({isShow, setShowDialog, onUpdateOrder=()=>{}, noteSparePart}) {
    const formRef = useRef()
    const [validated, setValidated] = useState(false)

    const dialogOpened = () => {

    }

    const handleClose = () => {
        setValidated(false)
        setShowDialog(false)
    }

    const saveChange = () => {
        const nativeForm = formRef.current
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }

        onUpdateOrder({...noteSparePart, notes: nativeForm['notes'].value})
        handleClose()
    }

    return (
        <Modal show={isShow} onHide={handleClose} onShow={dialogOpened} size="lg">
            <Modal.Header closeButton>
            <Modal.Title>
                <div><i className="bi bi-card-text"></i> {noteSparePart.partName} ({noteSparePart.quantity} left)</div>
                <div className="text-body-secondary fs-6">Order {noteSparePart.deliveryOrderNo} from {noteSparePart.supplierName} @ {noteSparePart.invoiceDate} </div>
            </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Row className="mb-3">
                            <Col>
                                <InputGroup>
                                    <InputGroup.Text><i className="bi bi-pencil"></i></InputGroup.Text>
                                    <Form.Control as="textarea" required name="notes" rows={5} defaultValue={noteSparePart.notes}></Form.Control>
                                </InputGroup>
                            </Col>
                        </Row>    
                    </Form>
                </Container>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="primary" onClick={saveChange}>
                Save Changes
            </Button>
            </Modal.Footer>
        </Modal>
    )

}

export default NoteTakingDialog