import { useRef, useState } from "react";
import { Button, Col, Container, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { NoteTaking } from "../Icons";
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
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }

        onSaveNote({...ws, notes: nativeForm['notes'].value})
        handleClose()
    }

    return (
        <Modal show={isShow} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
            <Modal.Title>
                <div><i className="bi bi-card-text"></i> {ws.vehicleNo} started since {ws.startDate} <TransactionTypes service={ws}/></div>
            </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Row className="mb-3">
                            <Col>
                                <InputGroup>
                                    <InputGroup.Text><NoteTaking /></InputGroup.Text>
                                    <Form.Control as="textarea" name="notes" rows={5} defaultValue={ws.notes}></Form.Control>
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