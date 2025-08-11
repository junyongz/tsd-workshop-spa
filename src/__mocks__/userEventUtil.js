/**
 * 
 * @param {string} key 
 * @returns {string}
 */
export default function clearAllThen(key) {
    return `{Control>}A{/Control}[Backspace]${key}`
}