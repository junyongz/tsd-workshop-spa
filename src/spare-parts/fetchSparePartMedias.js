const apiUrl = process.env.REACT_APP_API_URL

/**
 * 
 * @param {number} sparePartId spare part id
 * @returns {Promise<Response>}
 */
export default async function fetchSparePartMedias(sparePartId) {
    return fetch(`${apiUrl}/api/spare-parts/${sparePartId}/medias`)
                .then(resp => resp.json())
                .then(medias => 
                    Promise.allSettled(medias.map(md =>
                        fetch(`${apiUrl}/api/spare-parts/${sparePartId}/medias/${md.id}/data`)
                            .then(resp => resp.blob())
                            .then(blob => { return {...md, dataUrl: URL.createObjectURL(blob) } })
                    ))
                )
}