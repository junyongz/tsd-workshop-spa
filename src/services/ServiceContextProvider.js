import { createContext, useContext, useReducer } from "react";
import ServiceTransactions from "../ServiceTransactions";

/**
 * @constant 
 * @type {React.Context<ServiceTransactions>}
 */
export const ServiceContext = createContext()

export function WorkshopServicesProvider({initialServices=[], children}) {

    /**
     * 
     * @param {ServiceTransactions} prev 
     * @param {Object[]} newTransactions 
     * @returns 
     */
    const reducer = (prev, newTransactions) => {
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