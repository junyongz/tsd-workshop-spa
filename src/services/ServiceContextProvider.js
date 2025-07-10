import { createContext, useContext, useReducer } from "react";
import ServiceTransactions from "../ServiceTransactions";

export const ServiceContext = createContext(new ServiceTransactions())

export function WorkshopServicesProvider({initialServices=[], children}) {
    const reducer = (prev = new ServiceTransactions(), newTransactions=[]) => {
        return new ServiceTransactions(newTransactions, prev.dispatch)
    }

    const [workshopServices, dispatch] = useReducer(reducer, new ServiceTransactions(initialServices))
    workshopServices.acceptDispatch(dispatch)
    
    return (
        <ServiceContext value={workshopServices}>
            {children}
        </ServiceContext>
    )
}

export function useService() {
    return useContext(ServiceContext)
}