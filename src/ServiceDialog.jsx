import { useRef, useState } from "react";
import { Modal, Button, Container, Col, Row, FormLabel, Badge } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import Form from "react-bootstrap/Form";

function ServiceDialog({isShow, setShow, trx, onNewServiceCreated, vehicles, setVehicles, spareParts, orders=[], suppliers=[]}) {
    const [items, setItems] = useState([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts: []}])
    const [validated, setValidated] = useState(false)
    const formRef = useRef()
    
    const [selectedVehicles, setSelectedVehicles] = useState(trx?.current?.vehicleNo ? [vehicles.find(veh => veh.vehicleNo === trx.current.vehicleNo)] : [])

    const handleClose = () => {
        setItems([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts:[]}])
        setValidated(false)
        setShow(false)
    }

    const addNewItem = () => {
        setValidated(false)
        setItems(prev => {
            return [...prev, {partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0, selectedSpareParts:[]}]
        })
    }

    const afterChooseSparePart = ([sparePart], i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...prevs[i], ...sparePart, quantity: 1, selectedSpareParts: (sparePart && [sparePart]) || []}
            return newItems
        })
    }

    const updatePriceByQuantity = (val, i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...newItems[i], quantity: val}
            return newItems
        })
    }

    const updatePriceByUnitPrice = (val, i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...newItems[i], unitPrice: val}
            return newItems
        })
    }

    const addOrUpdateVehicles = ([veh]) => {
        if (veh) {
            if (vehicles.findIndex(v => v.vehicleNo === veh?.vehicleNo) === -1) {
                setVehicles(prevs => [...prevs, {vehicleNo: veh.vehicleNo}])
                // TODO: api to add new vehicle, but for now internally only
            }
            setSelectedVehicles([veh])
        }
        else {
            setSelectedVehicles([])
        }
    }

    const saveChange = () => {
        const nativeForm = formRef.current
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }

        onNewServiceCreated(items.map((v, i) => {
            return {
                creationDate: trx?.current?.creationDate,
                vehicleNo: nativeForm[0].value,
                quantity: v.quantity,
                unit: v.unit,
                unitPrice: parseFloat(v.unitPrice),
                itemDescription: v.partName,
                totalPrice: v.quantity * v.unitPrice,
                orderId: v.selectedSpareParts[0].orderId,
                supplierId: v.selectedSpareParts[0].supplierId,
            }
        }))
        handleClose()
    }

    const changeSelectedVehicle = () => {
        if (trx?.current?.vehicleNo && vehicles.length > 0 && vehicles.findIndex(veh => veh.vehicleNo === trx.current.vehicleNo) > -1) {
            setSelectedVehicles([vehicles.find(veh => veh.vehicleNo === trx.current.vehicleNo)])
        }
        else {
            setSelectedVehicles([])
        }
    }

    return (
        <Modal show={isShow} onHide={handleClose} onShow={changeSelectedVehicle} size="lg">
            <Modal.Header closeButton>
            <Modal.Title>Service at {trx?.current?.creationDate}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Row className="mb-1">
                            <Col>
                                <Typeahead
                                    allowNew
                                    newSelectionPrefix="Add a new vehicle: "
                                    inputProps={{required:true}}
                                    id="vehicle-select"
                                    labelKey='vehicleNo'
                                    options={vehicles}
                                    onChange={(vehs) => addOrUpdateVehicles(vehs)}
                                    placeholder="Choose a vehicle..."
                                    selected={selectedVehicles}
                                    />
                            </Col>
                        </Row>
                        <Row>
                            <Col className="text-sm-end">
                                <Button size="sm" onClick={addNewItem}>Add More</Button>
                            </Col>
                        </Row>
                        
                        <div>
                            <label>Spart parts</label>
                        </div>
                        {items?.map((v, i) =>
                        <div key={i}>
                            <Row>
                                <Form.Group as={Col} className="mb-3" controlId="spareParts">
                                <Typeahead
                                    inputProps={{required:true, name: 'partName'}}
                                    labelKey='partName'
                                    options={spareParts}
                                    onChange={(opts) => afterChooseSparePart(opts, i)}
                                    placeholder="Find a spare part..."
                                    renderMenuItemChildren={(option) => {
                                        const order = orders.find(o => o.id === option.orderId)
                                        const supplier = suppliers.find(s => s.id === option.supplierId)
                                        return <div>
                                            <div>{option.partName}</div>
                                            {/** TODO: to add supplier info later on */} 
                                            <small className="text-secondary">{option.unitPrice} per {option.unit} / Remaining: {order?.quantity} / Supplier: {supplier.supplierName} </small>
                                        </div>
                                        }
                                    }
                                    clearButton
                                    selected={v.selectedSpareParts}
                                    />                                
                                </Form.Group>
                                <Form.Group as={Col} className="mb-3 col-2" controlId="quantity">
                                    <Form.Control onChange={(e) => updatePriceByQuantity(e.target.value, i)} required type="number" name="quantity" min="1" max={(v.selectedSpareParts[0] && orders.find(o => o.id === v.selectedSpareParts[0].orderId).quantity) || 0} placeholder="Quantity" value={v?.quantity}/>
                                </Form.Group>
                                <Form.Group as={Col} className="mb-3 col-4" controlId="unitPrice">
                                    <Form.Control onChange={(e) => updatePriceByUnitPrice(e.target.value, i)} required type="number" step="0.10" name="unitPrice" placeholder="Price $" value={v?.unitPrice} />
                                </Form.Group>
                            </Row>
                            <Row>
                                <Col className="mb-3">
                                </Col>
                                <Col className="mb-3 col-2" controlId="unit">
                                    <Form.Control required type="text" name="unit" placeholder="Unit" value={v?.unit}/>
                                </Col>
                                <Col className="mb-3 col-4">
                                    <FormLabel><Badge pill>$ {(v?.quantity * v?.unitPrice) || 0}</Badge></FormLabel>
                                </Col>
                            </Row>
                        </div>
                        )}
                        
                    </Form>
                </Container>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="primary" onClick={saveChange}>
                Save Changes
            </Button>
            </Modal.Footer>
        </Modal>
    )

}

export default ServiceDialog