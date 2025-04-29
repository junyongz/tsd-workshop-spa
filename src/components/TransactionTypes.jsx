import React from "react";
import { Badge } from "react-bootstrap";

export default function TransactionTypes({service}) {
    return (
        <React.Fragment>
            <Badge bg={ service.transactionTypes?.includes('REPAIR') ? "info" : "secondary" } text="dark"><i className="bi bi-hammer"></i></Badge>&nbsp;
            <Badge bg={ service.transactionTypes?.includes('SERVICE') ? "info" : "secondary" } text="dark"><i className="bi bi-clock"></i></Badge>&nbsp;
            <Badge bg={ service.transactionTypes?.includes('INSPECTION') ? "info" : "secondary" } text="dark"><i className="bi bi-calendar-check"></i></Badge>
        </React.Fragment>
    )

}