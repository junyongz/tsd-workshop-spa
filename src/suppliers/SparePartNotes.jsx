import React, { useState } from "react"
import { Badge } from "react-bootstrap"
import { Calendar, HandPointer, NoteTaking } from "../Icons"

function SparePartNotes({order, onNoteClick, sparePartUsages=[] }) {

    const filteredSparePartUsages = sparePartUsages.filter(spu => spu.orderId === order.id)
    const [usageLoadCount, setUsageLoadCount] = useState(5)

    return (
        <div><span role="button" onClick={onNoteClick}><NoteTaking /></span>&nbsp;
            {order.notes && <span>{order.notes.split(/\r\n|\n|\r/).map((line, index) => (
                                <React.Fragment key={index}>
                                {line}<br />
                                </React.Fragment>
                            ))}</span>}
            {filteredSparePartUsages
                    .sort((a, b) => new Date(b.usageDate) - new Date(a.usageDate))
                    .slice(0, usageLoadCount)
                    .map(spu => 
                        <span key={spu.id} style={{display: 'block'}}>Used by {spu.vehicleNo}
                            <Badge pill>{spu.quantity}</Badge>&nbsp;
                            <Calendar /> {spu.usageDate}
                        </span>)
            }
            {
                filteredSparePartUsages.length > usageLoadCount && <span className="text-secondary" role="button" onClick={() => setUsageLoadCount(usageLoadCount+5)}><HandPointer /> Click to load more.</span>
            }
        </div>
    )
}

export default SparePartNotes