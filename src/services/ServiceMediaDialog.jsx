import { useRef, useState } from "react";
import { Button, ButtonGroup, Card, Carousel, Col, Container, Form, Image, InputGroup, Modal, Row } from "react-bootstrap";
import { Camera, Download, Trash } from "../Icons";
import TransactionTypes from "../components/TransactionTypes";
import imageCompression from 'browser-image-compression';
import download from "../utils/downloadUtils";

function ServiceMediaDialog({isShow, setShowDialog, ws, onSaveMedia}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const formRef = useRef()
    const [validated, setValidated] = useState(false)

    const [uploadedFile, setUploadedFile] = useState()
    const [previewDataUrl, setPreviewDataUrl] = useState();
    const [uploadedMedias, setUploadedMedias] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)

    const handleClose = () => {
        if (previewDataUrl) {
            URL.revokeObjectURL(previewDataUrl);
        }
        if (uploadedMedias && uploadedMedias.length > 0) {
            uploadedMedias.forEach(md => URL.revokeObjectURL(md.dataUrl))
        }
        setValidated(false)
        setShowDialog(false)
        setPreviewDataUrl()
        setUploadedMedias([])
        setCurrentIndex(0)
    }

    const onShow = () => {
        fetch(`${apiUrl}/api/workshop-services/${ws.id}/medias`)
            .then(resp => resp.json())
            .then(medias => {
                Promise.allSettled(medias.map(md =>
                    fetch(`${apiUrl}/api/workshop-services/${ws.id}/medias/${md.id}/data`)
                        .then(resp => resp.blob())
                        .then(blob => { return {...md, dataUrl: URL.createObjectURL(blob) } })
                ))
                .then(datas => setUploadedMedias(datas.map(res => res.value)))
            })
    }

    const removeMedia = (media, idx) => {
        fetch(`${apiUrl}/api/workshop-services/${media.serviceId}/medias/${media.id}`, 
            { method: 'DELETE' })
            .then(resp => {
                if (resp.ok) {
                    URL.revokeObjectURL(media.dataUrl)
                    setUploadedMedias(prev => {
                        const newMedias = [...prev]
                        newMedias.splice(idx, 1)
                        return newMedias
                    })
                    if (currentIndex > 0) {
                        setCurrentIndex(currentIndex - 1)
                    }
                }
            })
    }

    const afterUploadMedia = (event) => {
        const selectedFile = event.target.files[0];

        const doWork = (file) => {
            setUploadedFile(file)
            setPreviewDataUrl(URL.createObjectURL(file)) 
        }

        if (selectedFile.type.startsWith('image')) {
            imageCompression(selectedFile, {
                maxSizeMB: 1, maxWidthOrHeight: 1080, useWebWorker: true,
            }).then(compressedFile => {
                doWork(compressedFile)
            })
        }
        else {
            doWork(selectedFile)
        }
    }

    const validateSave = () => {
        const nativeForm = formRef.current
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return false
        }
        return true
    }

    const saveChange = () => {
        if (!validateSave()) {
            return
        }
        saveAndAddMore()
        handleClose()
    }

    const saveAndAddMore = () => {
        if (!validateSave()) {
            return
        }

        const nativeForm = formRef.current
        onSaveMedia(ws, uploadedFile, (newMediaId) => {
                setUploadedMedias(prev => {
                    const newMedias = [...prev]
                    newMedias.push({id: newMediaId,
                        fileName: uploadedFile.name, 
                        fileSize: uploadedFile.size,
                        serviceId: ws.id,
                        mediaType: uploadedFile.type,
                        dataUrl: previewDataUrl
                    })
                    return newMedias
                })

                setUploadedFile()
                setPreviewDataUrl()
                setCurrentIndex(uploadedMedias.length)
                nativeForm.elements.namedItem('file').value = ''
            })
    }

    return (
        <Modal show={isShow} onShow={onShow} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
            <Modal.Title>
                <div><Camera /> {ws.vehicleNo} started since {ws.startDate} <TransactionTypes service={ws}/></div>
            </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    {uploadedMedias.length > 0 && 
                    <Row className="mb-3">
                    <Col>
                        <Carousel key={uploadedMedias.length} data-bs-theme="light" interval={null} 
                            nextIcon={<Button aria-label="next media"><i className="bi bi-chevron-right"></i></Button>}
                            prevIcon={<Button aria-label="prev media"><i className="bi bi-chevron-left"></i></Button>}
                            defaultActiveIndex={currentIndex}
                            onSelect={(eventKey) => setCurrentIndex(eventKey)}>
                            { uploadedMedias.map((v, i) => 
                                <Carousel.Item key={v.id}>
                                    {v.mediaType.startsWith('image') && <Image src={v.dataUrl} aria-label={`image of ${v.fileName}`} className="d-block w-100" width={640} height={480}/> }
                                    {v.mediaType.startsWith('video') && <video autoPlay controls src={v.dataUrl} aria-label={`video of ${v.fileName}`} className="d-block w-100" width={640} height={480}/> }
                                    <Carousel.Caption>
                                        <ButtonGroup>
                                        <Button variant="success" aria-label={`download media ${v.fileName}`} onClick={() => download(v.dataUrl, v.fileName)}><Download /> {v.fileName}</Button>
                                        <Button variant="danger" aria-label={`remove media ${v.fileName}`} onClick={() => removeMedia(v, i)}><Trash /></Button>
                                        </ButtonGroup>
                                    </Carousel.Caption>
                                </Carousel.Item>
                            ) }
                        </Carousel>
                    </Col>
                    </Row>}
                    <Form ref={formRef} validated={validated} aria-label="upload form">
                        <Row className="mb-3">
                            <Col>
                                <InputGroup>
                                    <InputGroup.Text><Camera /></InputGroup.Text>
                                    <Form.Control required type="file" name="file" accept="image/*,video/*"
                                        role="button" aria-label="upload image or video"
                                        onChange={afterUploadMedia}></Form.Control>
                                </InputGroup>
                            </Col>
                        </Row>
                    </Form>
                    {previewDataUrl && 
                    <Row>
                    <Col>
                        <Card>
                            <Card.Header>File Type: {uploadedFile.type} File Size: {uploadedFile.size} bytes</Card.Header>
                            <Card.Body>
                            <Image className="d-block w-100" src={previewDataUrl} width={640}></Image>
                            </Card.Body>
                        </Card>
                    </Col>
                    </Row>}
                </Container>
            </Modal.Body>
            <Modal.Footer>
            <ButtonGroup>
                <Button variant="secondary" onClick={saveAndAddMore}><i className="bi bi-cloud-plus-fill me-2"></i>Save & Continue</Button>
                <Button variant="primary" onClick={saveChange}><i className="bi bi-save2 me-2"></i>Save</Button>
            </ButtonGroup>
            </Modal.Footer>
        </Modal>
    )

}

export default ServiceMediaDialog