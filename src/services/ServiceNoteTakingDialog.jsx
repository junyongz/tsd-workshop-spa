import { useRef, useState } from "react";
import { Button, Col, Container, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { Notes, NoteTaking } from "../Icons";
import TransactionTypes from "../components/TransactionTypes";

function ServiceNoteTakingDialog({isShow, setShowDialog, ws, onSaveNote}) {
    const formRef = useRef()
    const [validated, setValidated] = useState(false)

    const handleClose = () => {
        setValidated(false)
        setShowDialog(false)
    }

    const saveChange = () => {
        const nativeForm = formRef.current
        onSaveNote({...ws, notes: nativeForm.elements.namedItem('notes').value})
        handleClose()
    }

    return (
        <Modal show={isShow} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
            <Modal.Title>
                <div><Notes /> {ws.vehicleNo} started since {ws.startDate} <TransactionTypes service={ws}/></div>
            </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Row className="mb-3">
                            <Col>
                                <InputGroup>
                                    <InputGroup.Text><NoteTaking /></InputGroup.Text>
                                    <Form.Control as="textarea" name="notes" aria-label="notes for this service" rows={5} defaultValue={ws.notes}></Form.Control>
                                </InputGroup>
                            </Col>
                        </Row>    
                    </Form>
                </Container>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="primary" onClick={saveChange}>
                <i className="bi bi-save2 me-2"></i>Save
            </Button>
            </Modal.Footer>
        </Modal>
    )

}

export default ServiceNoteTakingDialog