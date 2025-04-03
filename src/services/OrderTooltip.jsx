import { OverlayTrigger, Tooltip } from "react-bootstrap";

function OrderTooltip({order, supplier}) {

    return (
        <OverlayTrigger trigger={order.notes ? ['hover'] : []} overlay={<Tooltip>{order.notes}</Tooltip>}>
            <small className="text-secondary">
                <i className="bi bi-shop"></i>{supplier?.supplierName}&nbsp;
                <i className="bi bi-calendar-event"></i>{order.invoiceDate}
            </small>
        </OverlayTrigger>
    )

}

export default OrderTooltip;