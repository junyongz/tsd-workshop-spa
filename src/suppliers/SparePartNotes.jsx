import React from "react"
import { Badge } from "react-bootstrap"
import { Calendar } from "../Icons"

function SparePartNotes({order, onNoteClick, sparePartUsages }) {
    return (
        <div><i role="button" className="bi bi-pencil" onClick={onNoteClick}></i>&nbsp;
            {order.notes && <span>{order.notes.split(/\r\n|\n|\r/).map((line, index) => (
                                <React.Fragment key={index}>
                                {line}<br />
                                </React.Fragment>
                            ))}</span>}
            {sparePartUsages.findIndex(spu => spu.orderId === order.id) >= 0 
                && sparePartUsages.filter(spu => spu.orderId === order.id)
                    .map(spu => 
                        <span key={spu.id} style={{display: 'block'}}>Used by {spu.vehicleNo}
                            <Badge pill>{spu.quantity}</Badge>&nbsp;
                            <Calendar /> {spu.usageDate}
                        </span>)
            }
        </div>
    )
}

export default SparePartNotes