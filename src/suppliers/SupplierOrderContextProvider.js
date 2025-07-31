import { createContext, useContext, useReducer } from "react";
import SupplierOrders from "./SupplierOrders";

/**
 * @constant 
 * @type {React.Context<SupplierOrders>}
 */
export const SupplierOrderContext = createContext()

export function SupplierOrderProvider({initialOrders=[], children}) {
    const reducer = (prev = new SupplierOrders(), newOrders=[]) => {
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