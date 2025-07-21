import { useEffect, useRef, useState } from "react";
import CalendarView from "../components/CalendarView";
import NewSchedulingDialog from "./NewSchedulingDialog";
import { mapToCalendarEvent } from "./mappingUtils.js";
import { addDaysToDate } from "../utils/dateUtils.js";

export default function SchedulingCalendarView({vehicles=[], onNewVehicleCreated}) {
    const apiUrl = process.env.REACT_APP_API_URL

    const [showEventDialog, setShowEventDialog] = useState(false)
    const [events, setEvents] = useState([])

    const theDate = useRef()

    const showDialog = (choosenDate) => {
        theDate.current = choosenDate
        setShowEventDialog(true)
    }

    const removeScheduling = (id) => {
        fetch(`${apiUrl}/api/scheduling/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(resp => resp.json())
        .then(id => setEvents(prev => [...prev].filter(item => item.id !== id))) 
    }

    useEffect(() => {
        fetch(`${apiUrl}/api/scheduling`, {
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(resp => resp.json())
        .then(schedulings => {
            setEvents(
                schedulings
                    .concat(vehicles
                    .filter(veh => new Date(veh.nextInspectionDate) > addDaysToDate(new Date(), -1))
                    .map(veh => {
                        return {
                            id: `veh-insp-${veh.id}`, // to different for 'key' also dont allow to delete
                            scheduledDate: veh.nextInspectionDate,
                            vehicleNo: `${veh.vehicleNo}`,
                            notes: `Inspection booked ${veh.vehicleNo}`,
                            variant: 'warning'
                        }
                    }))
                    .concat(vehicles
                    .filter(veh => new Date(veh.roadTaxExpiryDate) > addDaysToDate(new Date(), -1))
                    .map(veh => {
                        return {
                            id: `veh-roadtax-${veh.id}`, // to different for 'key' also dont allow to delete
                            scheduledDate: veh.roadTaxExpiryDate,
                            vehicleNo: `${veh.vehicleNo}`,
                            notes: `Roadtax expiring ${veh.vehicleNo}`,
                            variant: 'success'
                        }
                    }))
                .map(sch => mapToCalendarEvent(sch))
            )
        })
    }, [vehicles])

    return (
        <>
        <NewSchedulingDialog isShow={showEventDialog} setShowDialog={setShowEventDialog} theDate={theDate.current}
            vehicles={vehicles} onNewVehicleCreated={onNewVehicleCreated} setEvents={setEvents}/>
        <CalendarView 
            events={events} 
            onClickNew={showDialog}
            onClickRemove={(id) => removeScheduling(id)}
             />
        </>
    )
}