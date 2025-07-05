import { useEffect, useState } from "react";
import { Button, ButtonGroup, Card, Carousel, Col, Form, Image, InputGroup, Row } from "react-bootstrap";
import { Camera, Download, Trash } from "../Icons";
import imageCompression from 'browser-image-compression';

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
                            <Button variant="success" onClick={() => {
                                const link = document.createElement('a');
                                link.href = v.dataUrl;
                                link.download = v.fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}><Download /> {v.fileName}</Button>
                            <Button variant="danger" onClick={() => removeMedia(v, i)}><Trash /></Button>
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
                        <Form.Control type="file" multiple name="file" accept="image/*,movie/*"
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
                    <Image className="d-block w-100" src={previewDataUrls[i]} width={640}></Image>
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