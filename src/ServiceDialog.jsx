import { useEffect, useRef, useState } from "react";
import { Modal, Button, Container, Col, Row, FormLabel, Badge } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import Form from "react-bootstrap/Form";

function ServiceDialog({isShow, setShow, trx, onNewServiceCreated, vehicles, setVehicles, spareParts}) {
    const [items, setItems] = useState([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0}])
    const [validated, setValidated] = useState(false)
    const formRef = useRef()
    
    const [selectedVehicles, setSelectedVehicles] = useState(trx?.current?.vehicleNo ? [vehicles.find(veh => veh.vehicleNo === trx.current.vehicleNo)] : [])

    const handleClose = () => {
        setItems([{partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0}])
        setValidated(false)
        setShow(false)
    }

    const addNewItem = () => {
        setValidated(false)
        setItems(prev => {
            return [...prev, {partName: 'Choose one ...', quantity: 1, unit: 'pc', unitPrice: 0}]
        })
    }

    const updateSparePartMeta = ([sparePart], i) => {
        setItems(prevs => {
            prevs[i] = {...sparePart, quantity: 1}
            return [...prevs]
        })
    }

    const updatePriceByQuantity = (val, i) => {
        setItems(prevs => {
            prevs[i] = {...prevs[i], quantity: val}
            return [...prevs]
        })
    }

    const updatePriceByUnitPrice = (val, i) => {
        setItems(prevs => {
            prevs[i] = {...prevs[i], unitPrice: val}
            return [...prevs]
        })
    }

    const addOrUpdateVehicles = ([veh]) => {
        if (veh) {
            if (vehicles.findIndex(v => v.vehicleNo === veh?.vehicleNo) === -1) {
                setVehicles(prevs => [...prevs, {vehicleNo: veh.vehicleNo}])
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
        const itemDescriptions = nativeForm['partName'].length === undefined ? [nativeForm['partName']] 
            : Array.from(nativeForm['partName'])

        const formQuantity = nativeForm['quantity'].length === undefined ? [nativeForm['quantity']] 
            : Array.from(nativeForm['quantity'])

        const formUnits = nativeForm['unit'].length === undefined ? [nativeForm['unit']] 
            : Array.from(nativeForm['unit'])

        const formUnitPrices = nativeForm['unitPrice'].length === undefined ? [nativeForm['unitPrice']] 
            : Array.from(nativeForm['unitPrice'])

        onNewServiceCreated(itemDescriptions.map((v, i) => {
            return {
                creationDate: trx?.current?.creationDate,
                vehicleNo: nativeForm[0].value,
                quantity: formQuantity[i].value,
                unit: formUnits[i].value,
                unitPrice: parseFloat(formUnitPrices[i].value),
                itemDescription: v.value,
                totalPrice: formQuantity[i].value * formUnitPrices[i].value
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
                                <Button size="sm" onClick={addNewItem}>New</Button>
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
                                    onChange={(opts) => updateSparePartMeta(opts, i)}
                                    placeholder="Find a spare part..."
                                    renderMenuItemChildren={(option) => 
                                        <div>
                                            <div>{option.partName}</div>
                                            {/** TODO: to add supplier info later on */} 
                                            <small className="text-secondary">Unit Price: {option?.unitPrice} per {option?.unit}</small>
                                        </div>
                                    }
                                    />                                
                                </Form.Group>
                                <Form.Group as={Col} className="mb-3 col-2" controlId="quantity">
                                    <Form.Control onChange={(e) => updatePriceByQuantity(e.target.value, i)} required type="number" name="quantity" placeholder="Quantity" value={v?.quantity}/>
                                </Form.Group>
                                <Form.Group as={Col} className="mb-3 col-4" controlId="unitPrice">
                                    <Form.Control onChange={(e) => updatePriceByUnitPrice(e.target.value, i)} required type="number" step="0.01" name="unitPrice" placeholder="Price $" value={v?.unitPrice} />
                                </Form.Group>
                            </Row>
                            <Row>
                                <Col className="mb-3">
                                </Col>
                                <Col className="mb-3 col-2" controlId="unit">
                                    <Form.Control required type="text" name="unit" placeholder="Unit" value={v?.unit}/>
                                </Col>
                                <Col className="mb-3 col-4">
                                    <FormLabel><Badge pill>$ {v?.quantity * v?.unitPrice}</Badge></FormLabel>
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