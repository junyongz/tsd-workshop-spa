import { useEffect, useState } from "react";
import { Button, ButtonGroup, Card, Carousel, Col, Form, Image, InputGroup, Row } from "react-bootstrap";
import { Camera, Download, Trash } from "../Icons";
import imageCompression from 'browser-image-compression';

export default function SparePartMediaSubDialog({sparePart, uploadedFiles, setUploadedFiles, subscribe}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const [previewDataUrls, setPreviewDataUrls] = useState([]);
    const [uploadedMedias, setUploadedMedias] = useState([])

    const handleClose = () => {
        if (previewDataUrls.length > 0) {
            previewDataUrls.forEach(pdu => URL.revokeObjectURL(pdu));
        }
        if (uploadedMedias) {
            uploadedMedias.forEach(um => URL.revokeObjectURL(um.dataUrl))
        }
        setPreviewDataUrls([])
        setUploadedMedias([])
    }

    const removeMedia = (media, idx) => {
        fetch(`${apiUrl}/api/spare-parts/${media.expenseId}/medias/${media.id}`, 
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
    }

    const afterUploadMedia = (event) => {
        const selectedFiles = event.target.files;

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
        const unsubscribe = subscribe && subscribe(handleClose)

        if (sparePart && sparePart.id) {
            fetch(`${apiUrl}/api/spare-parts/${sparePart.id}/medias`)
                .then(resp => resp.json())
                .then(medias => {
                    Promise.allSettled(medias.map(md =>
                        fetch(`${apiUrl}/api/spare-parts/${sparePart.id}/medias/${md.id}/data`)
                            .then(resp => resp.blob())
                            .then(blob => { return {...md, dataUrl: URL.createObjectURL(blob) } })
                    ))
                    .then(datas => setUploadedMedias(datas.map(res => res.value)))
                })
        }

        return () => unsubscribe && unsubscribe(handleClose)
    }, [sparePart])

    return (
        <>
            {uploadedMedias.length > 0 && 
            <Row className="mb-3">
            <Col>
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
                    <Image className="d-block w-100" src={previewDataUrls[i]} height={640}></Image>
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