import React from "react";
import formatThousandSeparator from "../utils/numberUtils";
import { maintenanceServiceKm, triggerWarning } from "./maintenanceService";
import { Inspection, MaintenanceServices } from "../Icons";

export default function VehicleServices({lastService, lastInspection, vehicle}) {

    const mileageKmDiff = (lastService && lastService.mileageKm) ? (maintenanceServiceKm - (vehicle.latestMileageKm - lastService.mileageKm)) : undefined

    const toWarn = triggerWarning(lastService?.mileageKm, vehicle.latestMileageKm)

    return (
        <React.Fragment>
            {lastService && lastService.mileageKm ? <div><MaintenanceServices />&nbsp;
                {formatThousandSeparator(lastService.mileageKm)} KM @ {lastService.startDate} { toWarn && <span className={mileageKmDiff < 0 ? 'text-danger' : 'text-warning'}><i className="bi bi-exclamation-diamond-fill"></i></span> }</div> : ''}
            {lastInspection && lastInspection.mileageKm ? <div><Inspection />&nbsp;
                {formatThousandSeparator(lastInspection.mileageKm)} KM @ {lastInspection.startDate}</div> : ''}
        </React.Fragment>
    )
}