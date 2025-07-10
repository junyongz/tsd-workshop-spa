export default function formatThousandSeparator(num=0) {
    if (typeof num !== 'number') {
        return num
    }
    if (!num) {
        return
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}