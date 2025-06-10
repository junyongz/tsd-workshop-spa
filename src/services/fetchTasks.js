export default async function fetchTasks(setTaskTemplates) {
    const apiUrl = process.env.REACT_APP_API_URL

    return fetch(`${apiUrl}/api/tasks`, {
        mode: 'cors',
        headers: {
            'Content-type': 'application/json'
        }
    })
    .then(resp => resp.json())
    .then(json => {
        setTaskTemplates(json)
    })
}