import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Col, Container, Form, InputGroup, ListGroup, Modal, Row } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import remainingQuantity, { decimalPointUomAvailable } from "../utils/quantityUtils";
import { Calendar, Dollar, Suppliers, Tools } from "../Icons";
import PromptDeletionIcon from "../components/PromptDeletionIcon";
import { useSupplierOrders } from "./SupplierOrderContextProvider";
import generateUniqueId from "../utils/randomUtils";

/**
 * 
 * @param {Object} props
 * @param {boolean} props.isShow
 * @param {React.SetStateAction<boolean>} props.setShowDialog
 * @param {import("./SupplierOrders").SupplierOrder[]} props.existingOrder existing orders based on the same delivery order no
 * @param {import("./SupplierOrders").Supplier[]} props.suppliers
 * @param {import("../ServiceTransactions").SparePartUsage[]} props.sparePartUsages
 * @param {Function} props.onSaveNewOrders
 * @returns 
 */
function AddSparePartsDialog({isShow, setShowDialog, existingOrder, suppliers, sparePartUsages, onSaveNewOrders}) {
    const supplierOrders = useSupplierOrders()

    const formRef = useRef()
    const [validated, setValidated] = useState(false)
    const [deliveryOrderOptional, setDeliveryOrderOptional] = useState(false)

    const [isPending, startTransition] = useTransition();

    const defaultItem = {rid: generateUniqueId(), itemCode: '', partName: 'Choose one ...', quantity: 0, unit: 'pc', unitPrice: 0, selectedItemCode: [], selectedSparePart: []};

    /**
     * @type {[import("./SupplierOrders").SupplierOrder[], React.SetStateAction<import("./SupplierOrders").SupplierOrder[]>]}
     */
    const [items, setItems] = useState(existingOrder || [defaultItem])
    const editing = items && !!items[0]?.deliveryOrderNo
    const hasPendingDO = items.some(it => 
        it.deliveryOrderNo?.startsWith('PENDING-DO-') && it.deliveryOrderNo?.endsWith(it.id))

    const [selectedSupplier, setSelectedSupplier] = useState([])

    const dialogOpened = () => {
    }

    const handleClose = () => {
        setItems([defaultItem])
        setShowDialog(false)
        setSelectedSupplier([])
        setValidated(false)
        setDeliveryOrderOptional(false)
    }

    const clone = () => {
        setItems(prev => {
            const newItems = prev.map(v => {
                const newItem = {...v, rid: generateUniqueId()}
                delete newItem.id
                delete newItem.deliveryOrderNo
                delete newItem.invoiceDate
                delete newItem.disabled
                return newItem
            })
            return newItems
        })
    }

    const saveChange = () => {
        const nativeForm = formRef.current
        if (nativeForm.checkValidity() === false) {
            setValidated(true)
            return
        }

        const invoiceDate = nativeForm.querySelector('[name="invoiceDate"]')
        const deliveryOrderNo = nativeForm.querySelector('[name="deliveryOrderNo"]')

        const payload = items.filter(v => !v.disabled || hasPendingDO).map((v, i) => {
                return {
                    id: v.id,
                    invoiceDate: invoiceDate.value,
                    deliveryOrderNo: deliveryOrderNo.value,
                    supplierId: selectedSupplier[0].id,
                    itemCode: v.selectedItemCode[0]?.itemCode,
                    partName: v.selectedSparePart[0].partName,
                    notes: v.notes,
                    quantity: v.quantity,
                    unit: v.unit,
                    unitPrice: parseFloat(v.unitPrice),
                    totalPrice: v.quantity * v.unitPrice,
                    sparePartId: v.sparePartId
                }
            })
        
        startTransition(() => {
            onSaveNewOrders(payload, handleClose)
        })
        
    }

    const addNewItem = () => {
        setValidated(false)
        setItems(prev => {
            return [...prev, defaultItem]
        })
    }

    const removeItem = (i) => {
        // you shouldn't change the "prevs" state, such as prevs.splice, it would cause 2-times rendering
        setItems(prevs => {
            const newItems = [...prevs]
            newItems.splice(i, 1)
            return newItems
        })
    }

    // retain sparePartId at all cost! oh well
    // make sure dont delete the one in SupplierOrders
    const deleteExistingFields = (sparePart) => {
        delete sparePart.id // we dont want the item.id get replaced
        delete sparePart.supplierId
        delete sparePart.invoiceDate
        delete sparePart.quantity
        delete sparePart.deliveryOrderNo
        delete sparePart.notes
    }

    const afterChooseItemCode = ([sparePart], i) => {
        if (sparePart && suppliers.findIndex(s => s.id === sparePart.supplierId) >= 0) {
            setSelectedSupplier([suppliers.find(s => s.id === sparePart.supplierId)])
        }

        const toAddSparePart = sparePart && {...sparePart}
        sparePart && deleteExistingFields(toAddSparePart)

        setItems(prevs => {
            const newItem = [...prevs]
            newItem[i] = {...prevs[i], ...toAddSparePart, 
                selectedSparePart: (toAddSparePart && 
                    supplierOrders.list().findIndex(sp => sp.itemCode === toAddSparePart.itemCode) >= 0 
                    && supplierOrders.list().filter(sp => sp.itemCode === toAddSparePart.itemCode)) || [...prevs[i].selectedSparePart], 
                selectedItemCode: (toAddSparePart && [toAddSparePart]) || []}
            return newItem
        })
    }
  
    const afterChooseSparePart = ([sparePart], i) => {
        if (sparePart && suppliers.findIndex(s => s.id === sparePart.supplierId) >= 0) {
            setSelectedSupplier([suppliers.find(s => s.id === sparePart.supplierId)])
        }

        const toAddSparePart = sparePart && {...sparePart}
        sparePart && deleteExistingFields(toAddSparePart)

        setItems(prevs => {
            const newItem = [...prevs]
            newItem[i] = {...prevs[i], ...toAddSparePart, 
                selectedSparePart: (toAddSparePart && [toAddSparePart]) || [], 
                selectedItemCode: (toAddSparePart && toAddSparePart.itemCode && [toAddSparePart]) || [...prevs[i].selectedItemCode]}
            return newItem
        })
    }

    /**
     * 
     * @param {number} val 
     * @param {number} i index of part items
     */
    const updatePriceByQuantity = (val, i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...newItems[i], quantity: parseFloat(val)}
            return newItems
        })
    }

    /**
     * 
     * @param {number} val 
     * @param {number} i index of part items
     */
    const updatePriceByUnitPrice = (val, i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...newItems[i], unitPrice: parseFloat(val)}
            return newItems
        })
    }

    const updateUnit = (val, i) => {
        setItems(prevs => {
            const newItems = [...prevs]
            newItems[i] = {...newItems[i], unit: val}
            return newItems
        })
    }

    const updateSelectedSpartPart = (e, idx)  => {
        /* istanbul ignore else */
        if (e.target.value) {
            setItems(prevs => {
                const newItems = [...prevs]
                newItems[idx] = {...newItems[idx], selectedSparePart: [{itemCode: '', partName: e.target.value}]}
                return newItems
            })
        }
    }

    const updateSelectedItemCode = (e, idx)  => {
        /* istanbul ignore else */
        if (e.target.value) {
            setItems(prevs => {
                const newItems = [...prevs]
                newItems[idx] = {...newItems[idx], selectedItemCode: [{itemCode: e.target.value, partName: ''}]}
                return newItems
            })
        }
    }

    useEffect(() => {
        if (existingOrder && existingOrder.length > 0) {
            setItems(existingOrder.map(v => {
                return {...v, disabled: remainingQuantity(v, sparePartUsages) !== v.quantity, selectedItemCode: (v.itemCode && [{itemCode: v.itemCode}]) || [], selectedSparePart: [{partName: v.partName}]}
            }))
            setSelectedSupplier([suppliers.find(s => s.id === existingOrder[0].supplierId)])
        }
    }, [existingOrder, sparePartUsages, suppliers])

    return (
        <Modal show={isShow} onHide={handleClose} onShow={dialogOpened} backdrop="static" onEscapeKeyDown={(e) => e.preventDefault()} size="xl">
            <Modal.Header closeButton closeVariant="danger">
            <Modal.Title><Tools /> <span>{ editing ? "Update Spare Parts" : "Adding New Spare Parts" }</span></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef} validated={validated}>
                        <Row className="mb-3">
                            <Col xs={{span: 6, order: 1}} lg={{span: 3, order: 0}} className="mb-2">
                                <InputGroup>
                                    <InputGroup.Text><Calendar /></InputGroup.Text>
                                    <Form.Control key={items[0]?.rid}required type="date" name="invoiceDate"
                                        placeholder="Key in Invoice Date" 
                                        defaultValue={items[0]?.invoiceDate} disabled={editing}></Form.Control>
                                </InputGroup>
                            </Col>
                            <Col xs={{span: 12, order: 0}} lg={{span: 5, order: 1}} className="mb-2">
                                <InputGroup>
                                    <InputGroup.Text><Suppliers /></InputGroup.Text>
                                    <Typeahead
                                        inputProps={{required:true, name:'supplier'}}
                                        id="supplier-select"
                                        labelKey='supplierName'
                                        options={suppliers}
                                        onChange={setSelectedSupplier}
                                        placeholder="Choose a supplier"
                                        selected={selectedSupplier}
                                        disabled={editing}
                                        clearButton
                                        />
                                </InputGroup>
                            </Col>
                            <Col xs={{span: 6, order: 2}} lg={{span: 4, order: 2}} className="text-end">
                                <InputGroup>
                                    <InputGroup.Text><i className="bi bi-file-earmark-spreadsheet"></i></InputGroup.Text>
                                    <Form.Control key={items[0]?.rid} type="text" required={!deliveryOrderOptional} name="deliveryOrderNo" placeholder="Key in DO. #" defaultValue={items[0]?.deliveryOrderNo} disabled={editing && !hasPendingDO}></Form.Control>
                                    <InputGroup.Text><i className="bi bi-hourglass-split"></i><Form.Check type="checkbox" name="pendingDO" disabled={editing} aria-label="Pending DO/Invoice" onClick={() => setDeliveryOrderOptional(!deliveryOrderOptional)}/></InputGroup.Text>
                                </InputGroup>
                            </Col>
                        </Row>
                        <Row className="my-3">
                            <Col className="text-end">
                                <Button size="sm" aria-label="Add new order" disabled={editing} onClick={addNewItem}><i className="bi bi-plus-circle-fill me-2"></i>Add More</Button>
                            </Col>
                        </Row>
                        
                        <Row>
                        <ListGroup>
                        {items?.map((v, i) =>
                            <ListGroup.Item key={v.rid || v.id}>
                                <div className="fs-4 price-tag text-center mb-1">$ { (Number.isFinite(v.quantity) && Number.isFinite(v.unitPrice)) ? (v.quantity * v.unitPrice).toFixed(2) : 0}</div>
                                <Row>
                                { !editing && <Col xs="1" className="fs-4"><PromptDeletionIcon confirmDelete={() => removeItem(i)} flip/></Col> }
                                <Col xs={!editing ? 11 : 12}>
                                    <Row>
                                        <Col xs="12" lg="4" className="mb-2">
                                            <InputGroup>
                                            <InputGroup.Text><i className="bi bi-123"></i></InputGroup.Text>
                                            <Typeahead
                                                id="typeahead-item-code"
                                                inputProps={{name: 'itemCode'}}
                                                labelKey='itemCode'
                                                options={supplierOrders.list()
                                                    .filter(mo => selectedSupplier.length > 0 ? mo.supplierId === selectedSupplier[0].id : true)
                                                    .filter(mo => !!mo.itemCode)}
                                                onChange={(opts) => afterChooseItemCode(opts, i)}
                                                placeholder="Key in item code"
                                                clearButton
                                                allowNew
                                                onBlur={(e) => updateSelectedItemCode(e, i)}
                                                selected={v.selectedItemCode}
                                                disabled={v.disabled}
                                                />
                                            </InputGroup>
                                        </Col>
                                        <Col xs="12" lg="8" className="mb-2">
                                            <InputGroup>
                                            <InputGroup.Text><Tools /></InputGroup.Text>
                                            <Typeahead
                                                id="typeahead-part"
                                                inputProps={{required: true, name: 'partName'}}
                                                labelKey='partName'
                                                options={supplierOrders.list().filter(mo => selectedSupplier.length > 0 ? mo.supplierId === selectedSupplier[0].id : true)}
                                                onChange={(opts) => afterChooseSparePart(opts, i)}
                                                placeholder="Find a existing one as template"
                                                renderMenuItemChildren={(option) => 
                                                    <div>
                                                        <div>{option.partName}</div>
                                                        <small className="text-secondary">${option?.unitPrice} per {option?.unit} | <Calendar /> {option.invoiceDate}</small>
                                                    </div>
                                                }
                                                clearButton
                                                allowNew
                                                onBlur={(e) => updateSelectedSpartPart(e, i)}
                                                selected={v.selectedSparePart}
                                                disabled={v.disabled}
                                                />
                                            </InputGroup>
                                        </Col>
                                    </Row>
                                    <Row className="mb-3">
                                        <Col lg="4"></Col>
                                        <Col xs="3" lg="2">
                                            <Form.Control onChange={(e) => updatePriceByQuantity(e.target.value, i)} required 
                                                disabled={v.disabled} type="number" min={decimalPointUomAvailable(v?.unit) ? 0.1 : 1} 
                                                    placeholder="Quantity" step={decimalPointUomAvailable(v?.unit) ? 0.1 : 1} name="quantity"
                                                    value={v?.quantity}/>
                                        </Col>
                                        <Col xs="3" lg="2">
                                            <Form.Control onChange={(e) => updateUnit(e.target.value, i)} required type="text" name="unit" 
                                                placeholder="Unit" disabled={v.disabled} value={v?.unit}/>
                                        </Col>
                                        <Col xs="6" lg="4">
                                            <InputGroup>
                                                <InputGroup.Text><Dollar /></InputGroup.Text>
                                                <Form.Control onChange={(e) => updatePriceByUnitPrice(e.target.value, i)} required 
                                                    disabled={v.disabled} type="number" min="0" step="0.01" name="unitPrice" 
                                                    placeholder="Price $" value={v?.unitPrice} />
                                            </InputGroup>
                                        </Col>
                                    </Row>
                                </Col>
                                </Row>
                            </ListGroup.Item>
                        )}
                        <ListGroup.Item key={'total'} className="fs-3 fw-bold" style={{  backgroundColor: 'var(--bs-body-color)', color: 'var(--bs-body-bg)' }}>
                            <Row>
                            <Col xs="6">Total</Col>
                            <Col xs="6" className="text-end">$ {items?.reduce((pv, cv) => pv + ((cv.quantity && cv.unitPrice && cv.quantity * cv.unitPrice) || 0), 0).toFixed(2)}</Col>
                            </Row>
                        </ListGroup.Item>
                        </ListGroup>
                        </Row>
                    </Form>
                </Container>
            </Modal.Body>
            <Modal.Footer>
            {editing && <Button variant="secondary" aria-label="Clone orders" onClick={clone} disabled={isPending}>
                <i className="bi bi-copy me-2"></i><span>Clone</span>
            </Button> }
            <Button variant="primary" aria-label="Save orders" onClick={saveChange} disabled={isPending || items.filter(it => !!!it.disabled).length === 0}>
                <i className="bi bi-save2 me-2"></i><span>Save</span> 
            </Button>
            </Modal.Footer>
        </Modal>
    )

}

export default AddSparePartsDialog