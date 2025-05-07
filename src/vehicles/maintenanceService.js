export const maintenanceServiceKm = 18000;

export const maintenanceServiceWarningKm = 1000;

export function triggerWarning(lastServiceMileageKm=0, latestMileageKm=0) {
    return (maintenanceServiceKm - (latestMileageKm - lastServiceMileageKm)) <= maintenanceServiceWarningKm
}