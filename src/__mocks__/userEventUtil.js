import { fireEvent } from "@testing-library/react"

/**
 * 
 * @param {string} key 
 * @returns {string}
 */
export function clearAllThen(key) {
    return `{Control>}A{/Control}[Backspace]${key}`
}

/**
 * 
 * @param {Element|Node} elem 
 * @param {string|number} value 
 */
export function keyIn(elem, value) {
    fireEvent.change(elem, { target: { value: value } })
}