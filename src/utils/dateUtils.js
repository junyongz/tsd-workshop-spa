export function addDaysToDate(dateVal, dayNum) {
    const aDate = new Date(dateVal)
    aDate.setDate(aDate.getDate() + dayNum)
    return aDate;
}

export function addDaysToDateStr(dateVal, dayNum) {
    const aDate = addDaysToDate(dateVal, dayNum)
    return `${aDate.getFullYear()}-${(aDate.getMonth()+1).toString().padStart(2,0)}-${aDate.getDate().toString().padStart(2,0)}`
}

export function addMonthsToDate(dateVal, monthNum) {
    const aDate = new Date(dateVal)
    aDate.setMonth(aDate.getMonth() + monthNum)
    return aDate;
}

export function addMonthsToDateStr(dateVal, monthNum) {
    const aDate = addMonthsToDate(dateVal, monthNum)
    return `${aDate.getFullYear()}-${(aDate.getMonth()+1).toString().padStart(2,0)}-${aDate.getDate().toString().padStart(2,0)}`
}

/**
 * 
 * @param {Date} aDate 
 * @param {Date} anotherDate 
 * @returns whether provided dates are same day
 */
export function sameDay(aDate, anotherDate) {
    return aDate.getFullYear() === anotherDate.getFullYear() &&
            aDate.getMonth() === anotherDate.getMonth() &&
            aDate.getDate() === anotherDate.getDate()
}

/**
 * 
 * @param {Date} aDate 
 * @param {Date} anotherDate 
 * @returns whether provided dates are same in same year and mont
 */
export function sameMonth(aDate, anotherDate) {
    return aDate.getFullYear() === anotherDate.getFullYear() &&
            aDate.getMonth() === anotherDate.getMonth()
}

export const months3EngChars = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const days3EngCharsStartWithSun = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']