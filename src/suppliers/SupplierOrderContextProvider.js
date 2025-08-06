import { createContext, useContext, useReducer } from "react";
import SupplierOrders from "./SupplierOrders";

/**
 * @constant 
 * @type {React.Context<SupplierOrders>}
 */
export const SupplierOrderContext = createContext()

/**
 * 
 * @param {Object} props
 * @param {import("./SupplierOrders").SupplierOrder[]} props.initialOrders
 * @returns 
 */
export function SupplierOrderProvider({initialOrders, children}) {
    /**
     * 
     * @param {SupplierOrders} prev 
     * @param {import("./SupplierOrders").SupplierOrder[]} newOrders 
     * @returns 
     */
    const reducer = (prev, newOrders) => {
        return new SupplierOrders(newOrders, prev.dispatch)
    }

    const [supplierOrders, dispatch] = useReducer(reducer, new SupplierOrders(initialOrders))
    supplierOrders.acceptDispatch(dispatch)
    
    return (
        <SupplierOrderContext value={supplierOrders}>
            {children}
        </SupplierOrderContext>
    )
}

export function useSupplierOrders() {
    return useContext(SupplierOrderContext)
}