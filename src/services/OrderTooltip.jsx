import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Calendar, Suppliers } from "../Icons";

function OrderTooltip({order, supplier}) {

    return (
        <OverlayTrigger trigger={order.notes ? ['hover', 'focus'] : []} overlay={<Tooltip>{order.notes}</Tooltip>}>
            <small className="text-secondary fw-lighter">
                <Suppliers /> {supplier?.supplierName}&nbsp;
                <Calendar /> {order.invoiceDate}
            </small>
        </OverlayTrigger>
    )

}

export default OrderTooltip;