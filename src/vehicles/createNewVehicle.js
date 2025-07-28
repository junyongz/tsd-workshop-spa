export default function createNewVehicle(veh, vehicles, setSelectedVehicles, onNewVehicleCreated) {
    if (vehicles.findIndex(v => v.vehicleNo === veh?.vehicleNo) === -1) {
        onNewVehicleCreated(veh.vehicleNo)
        .then(stored => setSelectedVehicles([stored]))
    }
    else {
        setSelectedVehicles([veh])
    }
}