export function mapToCalendarEvent(scheduling) {
    return {
        id: scheduling.id,
        date: new Date(scheduling.scheduledDate),
        display: scheduling.vehicleNo,
        description: scheduling.notes
    }
}