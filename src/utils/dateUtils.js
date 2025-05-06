export function addMonthsToDate(dateVal, monthNum) {
    const aDate = new Date(dateVal)
    aDate.setMonth(aDate.getMonth() + monthNum)
    return aDate;
}

export function addMonthsToDateStr(dateVal, monthNum) {
    const aDate = addMonthsToDate(dateVal, monthNum)
    return `${aDate.getFullYear()}-${aDate.getMonth()+1}-${aDate.getDate()}`
}