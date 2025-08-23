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
 * @param {import("@testing-library/user-event").UserEvent} user 
 * @param {string} keys 
 * @returns {string}
 */
export function clearAllAndPaste(user, keys) {
    user.keyboard('{Control>}A{/Control}')
    user.paste(keys)
}

/**
 * 
 * @param {Element|Node} elem 
 * @param {string|number} value 
 */
export function keyIn(elem, value) {
    fireEvent.change(elem, { target: { value: value } })
}

/**
 * 
 * @param {Element|Node} elem 
 */
export function clickOtherPlace(elem) {
    fireEvent.blur(elem)
}

export function clickToFocus(elem) {
    fireEvent.focus(elem)
}