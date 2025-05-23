import React, { useRef, useState } from "react";
import { Button, ButtonGroup, Carousel, Collapse, Form, Image, InputGroup, OverlayTrigger, Popover } from "react-bootstrap";
import InputGroupText from "react-bootstrap/esm/InputGroupText";
import { Calendar, Camera, Download, NoteTaking, Trash } from "../Icons";

const CompletionLabel = ({ws, onCompletion, onDelete, noteForService, mediaForService}) => {
    const apiUrl = process.env.REACT_APP_API_URL

    const [promptDelete, setPromptDelete] = useState(false)
    const [openNote, setOpenNote] = useState(false)
    const [openMedia, setOpenMedia] = useState(false)
    const [uploadedMedias, setUploadedMedias] = useState([])
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

    const fetchMediasOrCollapse = () => {
        if (openMedia) {
            setOpenMedia(false)
        }
        else {
            fetch(`${apiUrl}/workshop-services/${ws.id}/medias`)
                .then(resp => resp.json())
                .then(medias => {
                    // try to fetch all
                    Promise.allSettled(medias.map(md =>
                        fetch(`${apiUrl}/workshop-services/${ws.id}/medias/${md.id}/data`)
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
                                <Form.Control ref={completionDateRef} required type="date" defaultValue={todayDate} min={ws.creationDate} max={todayDate}></Form.Control>
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
                <Button variant='outline-success' onClick={mediaForService}><Camera /></Button>
            </ButtonGroup>
        )
    }

    return (
        <div className="text-body-secondary">
            <span className="fs-6 me-3">Completed on {ws.creationDate !== ws.completionDate ? ws.completionDate : 'same day'}</span> 
            {ws.notes && <span role="button" onClick={() => setOpenNote(!openNote)}><NoteTaking /> </span>}
            {ws.uploadedMediasCount > 0 && <span role="button" onClick={() => fetchMediasOrCollapse()}><Camera /> </span>}

            {ws.notes && <Collapse in={openNote}><div>{ws.notes.split(/\r\n|\n|\r/).map((line, index) => (
                <React.Fragment key={index}>{line}<br /></React.Fragment>
            ))}</div></Collapse>}
            {ws.uploadedMediasCount > 0 && <Collapse in={openMedia}>
                <div> { uploadedMedias.length > 0 && <Carousel data-bs-theme="light" interval={null}
                    nextIcon={<Button><i className="bi bi-chevron-right"></i></Button>}
                    prevIcon={<Button><i className="bi bi-chevron-left"></i></Button>}>
                    { uploadedMedias.map(v => 
                        <Carousel.Item key={v.id}>
                            <Image src={v.dataUrl} className="d-block w-100" width={640} height={480}/>
                            <Carousel.Caption>
                                <Button variant="success" onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = v.dataUrl;
                                    link.download = v.fileName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}><Download /> {v.fileName}</Button>
                            </Carousel.Caption>
                        </Carousel.Item>
                    ) }
                </Carousel> } </div>
            </Collapse> }
        </div>
    )
}


export default CompletionLabel;