import { createContext, useContext, useReducer } from "react";
import SupplierOrders from "./SupplierOrders";

export const SupplierOrderContext = createContext(new SupplierOrders())

export function SupplierOrderProvider({children}) {
    const reducer = (prev = new SupplierOrders(), newOrders=[]) => {
        return new SupplierOrders(newOrders, prev.dispatch)
    }

    const [supplierOrders, dispatch] = useReducer(reducer, new SupplierOrders([]))
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