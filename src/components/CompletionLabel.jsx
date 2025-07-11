import React, { useRef, useState } from "react";
import { Badge, Button, ButtonGroup, Collapse, Form, InputGroup, OverlayTrigger, Popover } from "react-bootstrap";
import InputGroupText from "react-bootstrap/InputGroupText";
import { Calendar, Camera, NoteTaking } from "../Icons";
import PhotoGallery from "./PhotoGallery";
import PromptDeletionButton from "./PromptDeletionButton";

const CompletionLabel = ({ws, onCompletion, onDelete, noteForService, mediaForService}) => {
    const apiUrl = process.env.REACT_APP_API_URL

    const [openNote, setOpenNote] = useState(false)
    const [openMedia, setOpenMedia] = useState(false)
    const [uploadedMedias, setUploadedMedias] = useState([])
    const completionDateRef = useRef()

    const confirmComplete = () => {
        if (!completionDateRef.current.reportValidity()) {
            return
        }
        onCompletion(completionDateRef.current.value)
    }

    const todayDate = new Date().toISOString().split('T')[0]

    const fetchMediasOrCollapse = () => {
        if (openMedia) {
            setOpenMedia(false)
        }
        else {
            fetch(`${apiUrl}/api/workshop-services/${ws.id}/medias`)
                .then(resp => resp.json())
                .then(medias => {
                    // try to fetch all
                    Promise.allSettled(medias.map(md =>
                        fetch(`${apiUrl}/api/workshop-services/${ws.id}/medias/${md.id}/data`)
                            .then(resp => resp.blob())
                            .then(blob => { return {...md, dataUrl: URL.createObjectURL(blob) } })
                    ))
                    .then(datas => setUploadedMedias(datas.map(res => res.value)))
                })
                .finally(() => setOpenMedia(true))
        }
    }

    if (!ws.completionDate) {
        return (
            <ButtonGroup>
                <OverlayTrigger trigger="click" placement="right"
                        overlay={
                        <Popover>
                            <Popover.Header><Calendar /> Choose a date for completion</Popover.Header>
                            <Popover.Body>
                                <InputGroup>
                                <Form.Control ref={completionDateRef} required name="completionDate" type="date" defaultValue={todayDate} min={ws.startDate} max={todayDate}></Form.Control>
                                <InputGroupText><Button variant="success" className="px-1 py-0" onClick={confirmComplete}>Go</Button></InputGroupText>
                                </InputGroup>
                                <Form.Text>Default is today's date {todayDate}</Form.Text>
                            </Popover.Body>
                        </Popover>}>
                        <Button variant="outline-success" size="sm"><i className="bi bi-hand-thumbs-up"></i> Complete Service</Button>
                </OverlayTrigger>
                <PromptDeletionButton confirmDelete={onDelete} />
                <Button variant='outline-success' onClick={noteForService}><NoteTaking /></Button>
                <Button variant='outline-success' onClick={mediaForService}><Camera /> {ws.uploadedMediasCount > 0 && <Badge className="position-absolute top-0 start-100 translate-middle" pill>{ws.uploadedMediasCount}</Badge>}</Button>
            </ButtonGroup>
        )
    }

    return (
        <div className="text-body-secondary">
            <span className="fs-6 me-3">Completed on {ws.startDate !== ws.completionDate ? ws.completionDate : 'same day'}</span> 
            {ws.notes && <span role="button" onClick={() => setOpenNote(!openNote)}><NoteTaking /> </span>}
            {ws.uploadedMediasCount > 0 && <span role="button" onClick={() => fetchMediasOrCollapse()}><Camera /> </span>}

            {ws.notes && <Collapse in={openNote}><div>{ws.notes.split(/\r\n|\n|\r/).map((line, index) => (
                <React.Fragment key={index}>{line}<br /></React.Fragment>
            ))}</div></Collapse>}
            {ws.uploadedMediasCount > 0 && <Collapse in={openMedia}>
                <div> { uploadedMedias.length > 0 && <PhotoGallery uploadedMedias={uploadedMedias} /> } </div>
            </Collapse> }
        </div>
    )
}


export default CompletionLabel;
