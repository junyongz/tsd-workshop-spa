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

export function sameDay(aDate=new Date(), anotherDate=new Date()) {
    return aDate.getFullYear() === anotherDate.getFullYear() &&
            aDate.getMonth() === anotherDate.getMonth() &&
            aDate.getDate() === anotherDate.getDate()
}

export function sameMonth(aDate=new Date(), anotherDate=new Date()) {
    return aDate.getFullYear() === anotherDate.getFullYear() &&
            aDate.getMonth() === anotherDate.getMonth()
}

export const months3EngChars = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const days3EngCharsStartWithSun = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']