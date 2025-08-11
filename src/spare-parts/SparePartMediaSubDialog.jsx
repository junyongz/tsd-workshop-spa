import { useEffect, useState } from "react";
import { Button, ButtonGroup, Card, Carousel, Col, Form, Image, InputGroup, Row } from "react-bootstrap";
import { Camera, Download, Trash } from "../Icons";
import imageCompression from 'browser-image-compression';
import download from "../utils/downloadUtils";

export default function SparePartMediaSubDialog({sparePart, uploadedMedias, setUploadedMedias,
    uploadedFiles, setUploadedFiles, subscribe, afterRemoveMedia}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const [previewDataUrls, setPreviewDataUrls] = useState([]);

    const clearPreviewDataUrls = () => {
        if (previewDataUrls.length > 0) {
            previewDataUrls.forEach(pdu => URL.revokeObjectURL(pdu));
        }
        setPreviewDataUrls([])
    }

    const removeMedia = (media, idx) => {
        fetch(`${apiUrl}/api/spare-parts/${media.sparePartId}/medias/${media.id}`, 
            { method: 'DELETE' })
            .then(resp => {
                // TODO, deal with bad response
                if (resp.ok) {
                    URL.revokeObjectURL(media.dataUrl)
                    setUploadedMedias(prev => {
                        const newItems = [...prev]
                        newItems.splice(idx, 1)
                        return newItems
                    })
                }
            })
            .finally(() => afterRemoveMedia(media))
    }

    const afterUploadMedia = (event) => {
        const selectedFiles = event.target.files;

        // this will always make sure files uploaded would replace whatever already uploaded
        setUploadedFiles([])
        clearPreviewDataUrls()

        const doWork = (file) => {
            setUploadedFiles(prev => [...prev, file])
            setPreviewDataUrls(prev => [...prev, URL.createObjectURL(file)]) 
        }

        for (const selectedFile of selectedFiles) {
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
    }

    useEffect(() => {
        const unsubscribe = subscribe(clearPreviewDataUrls)

        return () => unsubscribe(clearPreviewDataUrls)
    }, [sparePart])

    return (
        <>
            {uploadedMedias.length > 0 && 
            <Row className="mb-3">
            <Col>
                Uploaded:
                <Carousel key={uploadedMedias.length} interval={null}>
                    {uploadedMedias.map((v, i) => 
                    <Carousel.Item key={i}>
                        <Image src={v.dataUrl} className="d-block w-100"/>
                        <Carousel.Caption>
                            <ButtonGroup>
                            <Button aria-label={`download ${v.fileName}`} variant="success" onClick={() => download(v.dataUrl, v.fileName)}><Download /> {v.fileName}</Button>
                            <Button variant="danger" aria-label={`remove ${v.fileName}`} onClick={() => removeMedia(v, i)}><Trash /></Button>
                            </ButtonGroup>
                        </Carousel.Caption>
                    </Carousel.Item>
                    )}
                </Carousel>
            </Col>
            </Row> }
            <Row className="mb-3">
                <Col>
                    To upload:
                    <InputGroup>
                        <InputGroup.Text><Camera /></InputGroup.Text>
                        <Form.Control type="file" multiple name="file" role="button" aria-label="upload file(s)" accept="image/*,video/*"
                            onChange={afterUploadMedia}></Form.Control>
                    </InputGroup>
                </Col>
            </Row>
            {previewDataUrls.length > 0 && 
            <Row>
            <Col>
            <Carousel interval={null}>
            {previewDataUrls.map((v, i) => 
                <Carousel.Item key={i}>
                <Card>
                    <Card.Header>File Type: {uploadedFiles[i].type} File Size: {uploadedFiles[i].size} bytes</Card.Header>
                    <Card.Body>
                    {uploadedFiles[i].type.startsWith('video') && <video autoPlay controls src={v.dataUrl} aria-label={`video of ${v.fileName}`} className="d-block w-100" width={640} height={480}/> }
                    {uploadedFiles[i].type.startsWith('image') && <Image className="d-block w-100" src={previewDataUrls[i]} width={640}></Image> }
                    </Card.Body>
                </Card> 
                </Carousel.Item>
            )}
            </Carousel>
            </Col>
            </Row>}
        </>
    )

}