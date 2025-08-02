import React from "react";
import formatThousandSeparator from "../utils/numberUtils";
import { maintenanceServiceKm, triggerWarning } from "./maintenanceService";
import { Inspection, MaintenanceServices } from "../Icons";
import { addMonthsToDate } from "../utils/dateUtils";

/**
 * 
 * @param {Object} props 
 * @param {import("../ServiceTransactions").WorkshopService} props.lastService 
 * @param {import("../ServiceTransactions").WorkshopService} props.lastInspection 
 * @param {import("./Vehicles").Vehicle} props.vehicle
 * @returns 
 */
export default function VehicleServices({lastService, lastInspection, vehicle}) {

    const mileageKmDiff = (lastService && lastService.mileageKm) ? (maintenanceServiceKm - (vehicle.latestMileageKm - lastService.mileageKm)) : undefined

    const toWarn = triggerWarning(lastService?.mileageKm, vehicle.latestMileageKm)

    const twoWeeksInMillis = 14 * 24 * 60 * 60 * 1000
    const toWarnInspection = lastInspection?.startDate && (addMonthsToDate(lastInspection.startDate, 6) - new Date()) <= twoWeeksInMillis

    return (
        <React.Fragment>
            {lastService && lastService.mileageKm ? <div><MaintenanceServices />&nbsp;
                {formatThousandSeparator(lastService.mileageKm)} KM @ {lastService.startDate} { toWarn && <span className={mileageKmDiff < 0 ? 'text-danger' : 'text-warning'}><i className="bi bi-exclamation-diamond-fill"></i></span> }</div> : ''}
            {lastInspection && lastInspection.mileageKm ? <div><Inspection />&nbsp;
                {formatThousandSeparator(lastInspection.mileageKm)} KM @ {lastInspection.startDate} { toWarnInspection && <span className='text-warning'><i className="bi bi-exclamation-diamond-fill"></i></span> }</div> : ''}
        </React.Fragment>
    )
}