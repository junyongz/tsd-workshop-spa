/**
 * 
 * @param {import("./Vehicles").Vehicle} veh vehicle to be created  
 * @param {import("./Vehicles").Vehicle[]} vehicles 
 * @param {React.SetStateAction<import("./Vehicles").Vehicle[]>} setSelectedVehicles 
 * @param {import("../App").CreateNewVehicleCallback} onNewVehicleCreated 
 */
export default function createNewVehicle(veh, vehicles, setSelectedVehicles, onNewVehicleCreated) {
    if (vehicles.findIndex(v => v.vehicleNo === veh?.vehicleNo) === -1) {
        onNewVehicleCreated(veh.vehicleNo)
        .then(stored => setSelectedVehicles([stored]))
    }
    else {
        setSelectedVehicles([veh])
    }
}