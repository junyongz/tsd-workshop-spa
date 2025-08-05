import { Badge } from "react-bootstrap";
import { Inspection, MaintenanceServices, Repair, Tyre } from "../Icons";


const Icon = [<Repair />, <MaintenanceServices />, <Inspection />, <Tyre />]

/**
 * 
 * @param {Object} props
 * @param {import("../ServiceTransactions").WorkshopService} props.service 
 * @returns 
 */
export default function TransactionTypes({service}) {
    return (
        <div className="d-inline">
            {
                ['REPAIR', 'SERVICE', 'INSPECTION', 'TYRE'].map((v, i) => 
                    <Badge key={v} className="me-1"
                        role="listitem" aria-label={`service type: ${v.toLocaleLowerCase()}`}
                        aria-current={service.transactionTypes?.includes(v)} 
                        bg={ service.transactionTypes?.includes(v) ? "info" : "secondary" } 
                        text="dark"> {Icon[i]}
                    </Badge>
                )
            }
        </div>
    )

}