import { addDaysToDateStr } from "../utils/dateUtils";

/** const numericKeys = ["part_costs", "task_costs", "count", 
    "repair_count", "service_count", "inspection_count", "tyre_count", 
    "pending_count", "completion_count", "average_completion_days"]; **/

/**
 * 
 * @param {Object[]} stats 
 * @returns 
 */
export function flattenNameForWeekly(stats) {
    return Object.values(
                stats.reduce((acc, { start_date, company_name, ...rest }) => {
                    const date = new Date(start_date);
                    const weekStartDate = new Date(date.setDate(date.getDate() - date.getDay()));
                    const weekStart = addDaysToDateStr(weekStartDate, 0)
                    acc[weekStart] = acc[weekStart] || { ...rest, start_date, count: 0, repair_count: 0, service_count: 0, inspection_count: 0, tyre_count: 0, completion_count: 0, pending_count: 0, part_costs: 0  };
                        Object.keys(rest).forEach(key => {
                            acc[weekStart][key] += + rest[key];
                        });
                    return acc;
                }, {})
            ).map(record => {
                record['week_start'] = 'Week ' + record['start_date'].substring(5)
                return record
            })
}

/**
 * 
 * @param {Object[]} stats 
 * @returns 
 */
export function flattenForWeeklyByCompanyName(stats) {
    return Object.values(
                stats.reduce((acc, { start_date, company_name, count }) => {
                    const date = new Date(start_date);
                    const weekStartDate = new Date(date.setDate(date.getDate() - date.getDay()));
                    const weekStart = addDaysToDateStr(weekStartDate, 0)
                    acc[weekStart] = acc[weekStart] || { weekStart, start_date, harsoon: 0, external: 0 };
                    acc[weekStart].harsoon += company_name?.startsWith('Harsoon Logistics') ? count : 0;
                    acc[weekStart].external += !company_name?.startsWith('Harsoon Logistics') ? count : 0;
                    return acc;
                }, {})
            ).map(record => {
                record['week_start'] = 'Week ' + record['start_date'].substring(5)
                return record
            })
}