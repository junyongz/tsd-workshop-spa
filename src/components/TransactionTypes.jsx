import { Badge } from "react-bootstrap";
import { Inspection, MaintenanceServices, Repair } from "../Icons";

export default function TransactionTypes({service}) {
    return (
        <div className="d-inline">
            <Badge bg={ service.transactionTypes?.includes('REPAIR') ? "info" : "secondary" } text="dark"><Repair /></Badge>&nbsp;
            <Badge bg={ service.transactionTypes?.includes('SERVICE') ? "info" : "secondary" } text="dark"><MaintenanceServices /></Badge>&nbsp;
            <Badge bg={ service.transactionTypes?.includes('INSPECTION') ? "info" : "secondary" } text="dark"><Inspection /></Badge>
        </div>
    )

}