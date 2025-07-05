import { useRef, useState } from "react"
import { Container, Form, Modal, Row, Col, Button, InputGroup, FormControl, FloatingLabel, ListGroup, Tabs, Tab, Badge } from "react-bootstrap"
import { Company, Medias, Notes, NoteTaking, Suppliers, Tools, Trash, Truck } from "../Icons"
import SupplierOrders from "../suppliers/SupplierOrders"
import SparePartMediaSubDialog from "./SparePartMediaSubDialog"
import SparePartSupplierSubDialog from "./SparePartSupplierSubDialog"
import { clearState } from "../autoRefreshWorker"

function SparePartDialog({isShow, setShowDialog, 
        sparePart, setSparePart,
        orders=new SupplierOrders(), 
        suppliers=[{id: 1000, supplierName: ''}],
        afterSave=() => {}, afterRemoveMedia=() => {}}) {

    const apiUrl = process.env.REACT_APP_API_URL

    const formRef = useRef()
    const [validated, setValidated] = useState(false)
    const [tabKey, setTabKey] = useState('detail')

    const [maxSelectedOrdersShown, setMaxSelectedOrdersShown] = useState(5)

    // orderIds not part of the fields in spare_parts table
    // rather to be retrieved where select id from mig_supplier_spare_parts where spare_part_id = ?
    
    // to populate based on the sparePart.id in mig_supplier_spare_parts
    // upon saving, popluate spare part id back to mig_supplier_spare_parts.spare_part_id based on the orderIds here
    const [matchingOrders, setMatchingOrders] = useState([])
    const [selectedSuppliers, setSelectedSuppliers] = useState([])
    const [activeSupplierId, setActiveSupplierId] = useState('')
    const [uploadedFiles, setUploadedFiles] = useState([])

    const [uploadedMedias, setUploadedMedias] = useState([])

    const subscribers = useRef([])
    const subscribe = (callback) => {
        subscribers.current.push(callback);
        return () => subscribers.current = subscribers.current.filter((cb) => cb !== callback);
    };
    const postHandeClose = () => {
        subscribers.current.forEach((callback) => callback());
    };

    const onShowingDialog = () => {
        const matchedOrders = orders.list().filter(o => o.sparePartId === sparePart.id)
        // setSelectedSuppliers(sparePart.supplierIds.map(spid => suppliers.find(s => s.id === spid)))
        setSelectedSuppliers(Array.from(new Set(matchedOrders.map(mo => mo.supplierId)))
                    .map(spid => suppliers.find(s => s.id === spid)))
        setMatchingOrders(matchedOrders)
        setActiveSupplierId(matchedOrders.length > 0 && matchedOrders[0].supplierId)
        setTabKey('detail')

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
    }

    const handleClose = () => {
        setValidated(false)
        setShowDialog(false)
        setSparePart()
        setMaxSelectedOrdersShown(5)
        setUploadedFiles([])
        uploadedMedias.forEach(media => URL.revokeObjectURL(media.dataUrl))
        setUploadedMedias([])
        postHandeClose()
    }

    const saveChange = () => {
        const nativeForm = formRef.current

        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }

        if (selectedSuppliers.length == 0) {
            alert('Sorry, no suppliers added')
            return
        }
 
        if (matchingOrders.length == 0) {
            alert('Sorry, no orders added')
            return
        }

        const noOrdersSuppliers = selectedSuppliers.filter(sp => matchingOrders.filter(mo => mo.supplierId === sp.id).length === 0)
        if (noOrdersSuppliers.length > 0) {
            alert('Sorry, following suppliers has no orders: ' + noOrdersSuppliers.map(sp => sp.supplierName).join(', '))
            return
        }

        const sparePartToSave = {...sparePart, 
            supplierIds: selectedSuppliers.map(sp => sp.id),
            orderIds: matchingOrders.map(mo => mo.id)
        }
        
        fetch(`${apiUrl}/api/spare-parts`, {
            method: 'POST',
            body: JSON.stringify(sparePartToSave),
            mode: 'cors',
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(response => {
            const doAfterSave = () => {
                response.orderIds = sparePartToSave.orderIds
                afterSave(response)
            }

            if (uploadedFiles.length > 0) {
                const formData = new FormData()
                uploadedFiles.forEach(file => formData.append("file", file, file.name))

                fetch(`${apiUrl}/api/spare-parts/${response.id}/medias`, {
                    method: 'POST', 
                    body: formData
                })
                .then(res => res.json())
                .then(mediaId => {
                    // check first one is enough    
                    if (!isFinite(mediaId[0])) {
                        throw new Error("uploaded media failed")
                    }
                })
                .finally(() => doAfterSave())
            }
            else {
                doAfterSave()
            }
        })
        .finally(() => {
            handleClose()
            clearState()
        })
    }

    const afterKeyInPartNo = (val) => {
        setSparePart(sp => {
            return {...sp, partNo: val, oems: [...sp.oems], compatibleTrucks: [...sp.compatibleTrucks]}
        })
    }

    const afterKeyInPartName = (val) => {
        setSparePart(sp => {
            return {...sp, partName: val, oems: [...sp.oems], compatibleTrucks: [...sp.compatibleTrucks]}
        })
    }
    const afterKeyInPartDescription = (val) => {
        setSparePart(sp => {
            return {...sp, description: val, oems: [...sp.oems], compatibleTrucks: [...sp.compatibleTrucks]}
        })
    }

    const addNewOem = () => {
        setSparePart(sp => {
            return {...sp, oems: [...sp.oems, {}], compatibleTrucks: [...sp.compatibleTrucks]}
        })
    }

    const removeOem = (i) => {
        setSparePart(sp => {
            const newOems = [...sp.oems]
            newOems.splice(i, 1)
            return {...sp, oems: newOems, compatibleTrucks: [...sp.compatibleTrucks]}
        })
    }

    const afterKeyInName = (val, i) => {
        setSparePart(sp => {
            const newOems = [...sp.oems]
            newOems[i].name = val
            return {...sp, oems: newOems, compatibleTrucks: [...sp.compatibleTrucks]}
        })  
    }

    const afterKeyInUrl = (val, i) => {
        setSparePart(sp => {
            const newOems = [...sp.oems]
            newOems[i].url = val
            return {...sp, oems: newOems, compatibleTrucks: [...sp.compatibleTrucks]}
        })  
    }

    const addNewTruck = () => {
        setSparePart(sp => {
            return {...sp, oems: [...sp.oems], compatibleTrucks: [...sp.compatibleTrucks, {}]}
        })
    }

    const removeTruck = (i) => {
        setSparePart(sp => {
            const newTrucks = [...sp.compatibleTrucks]
            newTrucks.splice(i, 1)
            return {...sp, oems: [...sp.oems], compatibleTrucks: newTrucks}
        })
    }

    const afterKeyInMake = (val, i) => {
        setSparePart(sp => {
            const newTrucks = [...sp.compatibleTrucks]
            newTrucks[i].make = val
            return {...sp, oems: [...sp.oems], compatibleTrucks: newTrucks}
        })  
    }

    const afterKeyInModel = (val, i) => {
        setSparePart(sp => {
            const newTrucks = [...sp.compatibleTrucks]
            newTrucks[i].model = val
            return {...sp, oems: [...sp.oems], compatibleTrucks: newTrucks}
        })  
    }

    if (!sparePart) {
        return (<></>)
    }

    return (
        <Modal show={isShow} onHide={handleClose} onShow={() => onShowingDialog()} backdrop="static" onEscapeKeyDown={(e) => e.preventDefault()}  size="lg">
            <Modal.Header closeButton>
            <Modal.Title>
                Add new spare part {tabKey !== 'detail' && sparePart.partName && <span>- {sparePart.partName}</span>}
            </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Tabs className="mb-3" onSelect={setTabKey}>
                            <Tab eventKey={'detail'} title={<span><Notes /> Detail</span>}>
                            <Row>
                                <Col xs="12" xl="6" className="mb-3">
                                    <InputGroup>
                                        <InputGroup.Text><i className="bi bi-123" /></InputGroup.Text>
                                        <FloatingLabel label="OE No">
                                            <FormControl onChange={(e) => afterKeyInPartNo(e.target.value)} required name="partNo" placeholder="OE No" value={sparePart.partNo}></FormControl>
                                        </FloatingLabel>
                                    </InputGroup>
                                </Col>
                                <Col xs="12" xl="6" className="mb-3">
                                    <InputGroup>
                                        <InputGroup.Text><Tools /></InputGroup.Text>
                                        <FloatingLabel label="Part Name">
                                            <FormControl onChange={(e) => afterKeyInPartName(e.target.value)} required name="partName" placeholder="Part Name" value={sparePart.partName}></FormControl>
                                        </FloatingLabel>
                                    </InputGroup>
                                </Col>
                                <Col xs="12" className="mb-3">
                                    <InputGroup>
                                        <InputGroup.Text><NoteTaking /></InputGroup.Text>
                                        <FormControl onChange={(e) => afterKeyInPartDescription(e.target.value)} required as="textarea" rows={3} name="description" placeholder="Description" value={sparePart.description}></FormControl>
                                    </InputGroup>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col xs="12" className="mb-3 text-end">
                                    <Button aria-label="button to add OEM" onClick={() => addNewOem()}><Company /> Add OEM</Button>
                                </Col>
                                <Col>
                                <ListGroup className="mb-3">
                                        <ListGroup.Item>
                                        <Row>
                                        <Col xs="12" xl="4">Name</Col>
                                        <Col xs="12" xl="8">URL</Col>
                                        </Row>
                                        </ListGroup.Item>
                                    {sparePart.oems?.map((v, i) => 
                                        <ListGroup.Item>
                                        <Row>
                                        <Col xs="12" xl="4" className="mb-1 mb-xl-none">
                                            <Form.Control onChange={(e) => afterKeyInName(e.target.value, i)} required value={v.name} />
                                        </Col>
                                        <Col xs="12" xl="7">
                                            <Form.Control onChange={(e) => afterKeyInUrl(e.target.value, i)} required type="url" value={v.url} />
                                        </Col>
                                        <Col xs="12" xl="1" className="fs-5 text-danger text-end">
                                        <span role="button" onClick={() => removeOem(i)}><Trash /></span>
                                        </Col>
                                        </Row>
                                        </ListGroup.Item>
                                    )}
                                </ListGroup>
                                </Col>

                            </Row>
                            <Row>
                                <Col xs="12" className="mb-3 text-end">
                                    <Button aria-label="button to add OEM" onClick={() => addNewTruck()}><Truck /> Add Compatible Trucks</Button>
                                </Col>
                                <Col xs="12">
                                    <ListGroup>
                                        <ListGroup.Item>
                                        <Row>
                                        <Col xs="12" xl="4">Make</Col>
                                        <Col xs="12" xl="8">Model</Col>
                                        </Row>
                                        </ListGroup.Item>
                                    {sparePart.compatibleTrucks.map((v, i) => 
                                        <ListGroup.Item key={i}>
                                        <Row>
                                        <Col xs="12" xl="4" className="mb-1 mb-xl-none">
                                            <Form.Control onChange={(e) => afterKeyInMake(e.target.value, i)} required value={v.make} />
                                        </Col>
                                        <Col xs="12" xl="7">
                                            <Form.Control onChange={(e) => afterKeyInModel(e.target.value, i)} required value={v.model} />
                                        </Col>
                                        <Col xs="12" xl="1" className="fs-5 text-danger text-end">
                                        <span role="button" onClick={() => removeTruck(i)}><Trash /></span>
                                        </Col>
                                        </Row>
                                        </ListGroup.Item>
                                    )}
                                    </ListGroup>
                                </Col>
                            </Row>
                            </Tab>
                            <Tab eventKey={'suppliers'} title={<div><Suppliers /> Suppliers {selectedSuppliers.length > 0 && <Badge pill>{selectedSuppliers.length}</Badge>}</div>}>
                                <SparePartSupplierSubDialog activeSupplierId={activeSupplierId}
                                    setActiveSupplierId={setActiveSupplierId}
                                    maxSelectedOrdersShown={maxSelectedOrdersShown}
                                    setMaxSelectedOrdersShown={setMaxSelectedOrdersShown}
                                    selectedSuppliers={selectedSuppliers}
                                    setSelectedSuppliers={setSelectedSuppliers}
                                    matchingOrders={matchingOrders}
                                    setMatchingOrders={setMatchingOrders}
                                    orders={orders}
                                    suppliers={suppliers} />
                            </Tab>
                            <Tab eventKey='gallery' title={<div><Medias /> Gallery {(uploadedMedias.length > 0 || uploadedFiles.length > 0) && <Badge pill>{uploadedMedias.length + uploadedFiles.length}</Badge>}</div>}>
                                <SparePartMediaSubDialog sparePart={sparePart} uploadedMedias={uploadedMedias} setUploadedMedias={setUploadedMedias} 
                                    uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} subscribe={subscribe}
                                    afterRemoveMedia={afterRemoveMedia}/>
                            </Tab>
                        </Tabs>
                    </Form>
                </Container>
            </Modal.Body>
            { tabKey === 'detail' && 
            <Modal.Footer>
                <Button variant="primary" onClick={saveChange}>
                <i className="bi bi-save2 me-2"></i>Save
                </Button> 
            </Modal.Footer> }
        </Modal>
    )

}

export default SparePartDialog