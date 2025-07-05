import { Token, Typeahead } from "react-bootstrap-typeahead";
import SupplierOrders from "../suppliers/SupplierOrders";
import { Col, InputGroup, Nav, Row } from "react-bootstrap";
import { Suppliers, Tools, Trash } from "../Icons";
import { getOptionLabel } from "react-bootstrap-typeahead/types/utils";
import { useEffect } from "react";

export default function SparePartSupplierSubDialog({
    maxSelectedOrdersShown, setMaxSelectedOrdersShown,
    selectedSuppliers=[], setSelectedSuppliers,
    activeSupplierId, setActiveSupplierId, 
    orders = new SupplierOrders(), suppliers=[],
    matchingOrders=[], setMatchingOrders}) {


    const ShowMoreToken = () => {
        // tabIndex is important for typeahead/react to populate correct target/currentTarget, 
        // so focus/click event can happen on correct element
        return (
        <div className="rbt-token rbt-token-removeable rbt-token-active" onClick={() => setMaxSelectedOrdersShown(prev => prev + 5)} tabIndex="0">
            <span className="rbt-token-label">{matchingOrders.filter(mo => mo.supplierId == activeSupplierId).length - maxSelectedOrdersShown} more...</span>
        </div>)
    }

    const afterChooseSupplier = (options) => {
        if (options && options.length > 0) {
            setSelectedSuppliers(sups => [...sups, options[0]])
            setActiveSupplierId(options[0].id)
        }
    }

    const removeFromSelectedSupplier = (supplier) => {
        setSelectedSuppliers(prev => {
            const newItems = [...prev]
            newItems.splice(newItems.findIndex(sp => sp.id === supplier.id), 1)
            return newItems
        })

        // remove order for the supplier
        setMatchingOrders(prev => [...prev.filter(mo => mo.supplierId !== supplier.id)])
    }

    const afterChooseOrders = (options=[]) => {
        const newSupplierIds = Array.from(new Set(
            options.map(opt => opt.supplierId)
                .filter(spid => !selectedSuppliers.map(sp => sp.id).includes(spid))))

        // assume only 1
        if (newSupplierIds.length > 0) {
            setSelectedSuppliers(prev => {
                const newItems = [...prev]
                newItems.push(suppliers.find(sp => sp.id === newSupplierIds[0]))
                return newItems
            })
            setActiveSupplierId(newSupplierIds[0])

            setMatchingOrders(prev => [...prev].concat(options))
        }
        else {
            setMatchingOrders(prev => {
                const newItems = [...prev]
                const otherSuppliersMatchingOrders = newItems.filter(mo => mo.supplierId != activeSupplierId)

                return otherSuppliersMatchingOrders.concat(options || [])
            })
        }
    }

    useEffect(() => {
        if (selectedSuppliers.length === 0 || selectedSuppliers.findIndex(sp => sp.id == activeSupplierId) === -1) {
            setActiveSupplierId(selectedSuppliers.length === 0 ? '' : selectedSuppliers[0].id)
        }

    }, [selectedSuppliers])

    return (
    <Row>
        <Col xs="12" className="mb-3 text-end">
        {/** <Form.Label><Suppliers /> Suppliers</Form.Label> */}
            <InputGroup className="mb-1">
            <InputGroup.Text><Suppliers /></InputGroup.Text>
            <Typeahead
                inputProps={{formNoValidate: true}}
                labelKey={(option) => `${option.supplierName}`}
                options={suppliers.filter(sp => selectedSuppliers.findIndex(ssp => ssp.id === sp.id) === -1)}
                onChange={(option) => afterChooseSupplier(option)}
                selected={[]}
                placeholder="Find a supplier then choose an order"
                clearButton />
            </InputGroup>

            <InputGroup>
            <InputGroup.Text><Tools /></InputGroup.Text>
            <Typeahead
                inputProps={{formNoValidate: true}}
                labelKey={(option) => `${option.partName} (${option.invoiceDate}) - ${suppliers.find(sp => sp.id === option.supplierId)?.supplierName}`}
                options={orders.list().filter(mo => !mo.sparePartId)}
                onChange={(options) => afterChooseOrders(options)}
                selected={[]}
                placeholder="How about start with an order"
                clearButton />
            </InputGroup>
        </Col>
        <Col xs="12">
            {selectedSuppliers.length > 0 && <Nav key={selectedSuppliers.length} className="mb-1" variant="tabs" defaultActiveKey={selectedSuppliers.length === 1 && selectedSuppliers[0].id} 
                onSelect={setActiveSupplierId} activeKey={(selectedSuppliers.length === 1 && selectedSuppliers[0].id) || activeSupplierId}>
            {
                selectedSuppliers.map((v, i) => <Nav.Item key={v?.id}>
                                <Nav.Link eventKey={v?.id}>{v?.supplierName} {activeSupplierId == v.id && <span role="button" className="text-danger" onClick={(e) => removeFromSelectedSupplier(v)}><Trash /></span>}</Nav.Link>
                                </Nav.Item>)
            }
            </Nav> }

            {selectedSuppliers.length > 0 && <Typeahead
                key={activeSupplierId}
                inputProps={{name: 'orders'}}
                labelKey={(option) => `${option.partName} (${option.invoiceDate})`}
                options={orders.list().filter(o => o.supplierId == activeSupplierId).filter(mo => !mo.sparePartId)}
                onChange={(opts) => afterChooseOrders(opts)}
                selected={matchingOrders.filter(mo => mo.supplierId == activeSupplierId)}
                placeholder="Find a spare part from orders"
                renderToken={(option, props, idx) => 
                            (idx == maxSelectedOrdersShown)
                            ? <ShowMoreToken {...props} />
                            : ((idx > maxSelectedOrdersShown) ? <></>
                            : <Token
                                disabled={props.disabled}
                                key={idx}
                                onRemove={props.onRemove}
                                option={option}
                                tabIndex={props.tabIndex}>
                                {getOptionLabel(option, props.labelKey)}
                            </Token>) }
                clearButton
                multiple /> }
        </Col>
    </Row> )
}