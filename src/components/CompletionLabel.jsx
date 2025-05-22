import React, { useRef, useState } from "react";
import { Button, ButtonGroup, Collapse, Form, InputGroup, OverlayTrigger, Popover } from "react-bootstrap";
import InputGroupText from "react-bootstrap/esm/InputGroupText";
import { Calendar, NoteTaking, Trash } from "../Icons";

const CompletionLabel = ({creationDate, completionDate, notes, onCompletion, onDelete, noteForService}) => {

    const [promptDelete, setPromptDelete] = useState(false)
    const [openNote, setOpenNote] = useState(false)
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
                            <Popover.Header><Calendar /> Choose a date for completion</Popover.Header>
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
                    <Trash />
                </Button>
                <Button variant='outline-success' onClick={noteForService}><NoteTaking /></Button>
            </ButtonGroup>
        )
    }

    return (
        <div className="text-body-secondary">
        <span className="fs-6 me-3">Completed on {creationDate !== completionDate ? completionDate : 'same day'}</span> 
            {notes && <span role="button" onClick={() => setOpenNote(!openNote)}><NoteTaking /></span>}
            {notes && <Collapse in={openNote}><div>{notes.split(/\r\n|\n|\r/).map((line, index) => (
                <React.Fragment key={index}>{line}<br /></React.Fragment>
            ))}</div></Collapse>}
        </div>
    )
}


export default CompletionLabel;