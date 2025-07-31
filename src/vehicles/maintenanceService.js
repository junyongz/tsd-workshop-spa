export const maintenanceServiceKm = 18000;

export const maintenanceServiceWarningKm = 1000;

/**
 * @param {number} lastServiceMileageKm 
 * @param {number} latestMileageKm 
 * @returns {number}
 */
export function triggerWarning(lastServiceMileageKm, latestMileageKm) {
    return (maintenanceServiceKm - (latestMileageKm - lastServiceMileageKm)) <= maintenanceServiceWarningKm
}