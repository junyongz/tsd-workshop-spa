export function isInternal(companies=[], vehicles=[], service) {
    return companies.find(co => co.id === (vehicles.find(veh => veh.id === service.vehicleId).companyId))?.internal
}