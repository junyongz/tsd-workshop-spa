import { useRef, useState } from "react";
import { Button, ButtonGroup, Dropdown, DropdownButton, Form, InputGroup, OverlayTrigger, Popover } from "react-bootstrap";
import InputGroupText from "react-bootstrap/esm/InputGroupText";

const CompletionLabel = ({creationDate, completionDate, onCompletion, onDelete}) => {

    const [promptDelete, setPromptDelete] = useState(false)
    const completionDateRef = useRef()

    const confirmDelete = () => {
        onDelete()
        setPromptDelete(false)
    }

    const confirmComplete = () => {
        if (!completionDateRef.current.reportValidity()) {
            return
        }
        onCompletion(completionDateRef.current.value)
    }

    const todayDate = new Date().toISOString().split('T')[0]

    if (!completionDate) {
        return (
            <ButtonGroup>
                <OverlayTrigger trigger="click" placement="right"
                        overlay={
                        <Popover>
                            <Popover.Header><i className="bi bi-calendar-event"></i> Choose a date for completion</Popover.Header>
                            <Popover.Body>
                                <InputGroup>
                                <Form.Control ref={completionDateRef} required type="date" defaultValue={todayDate} min={creationDate} max={todayDate}></Form.Control>
                                <InputGroupText><Button variant="success" className="px-1 py-0" onClick={confirmComplete}>Go</Button></InputGroupText>
                                </InputGroup>
                                <Form.Text>Default is today's date {todayDate}</Form.Text>
                            </Popover.Body>
                        </Popover>}>
                        <Button variant="outline-success" size="sm"><i className="bi bi-hand-thumbs-up"></i> Complete Service</Button>
                </OverlayTrigger>
                { promptDelete && <Button variant="outline-warning" onClick={() => setPromptDelete(false)}>X</Button> }
                <Button variant={promptDelete ? 'outline-danger' : 'outline-warning'}
                    onClick={() => promptDelete ? confirmDelete() : setPromptDelete(true)}>
                    <i role="button" className="bi bi-trash3"></i>
                </Button>
            </ButtonGroup>
        )
    }

    return (
        <label className="text-body-secondary fs-6">Completed on {creationDate !== completionDate ? completionDate : 'same day'}</label>
    )
}


export default CompletionLabel;