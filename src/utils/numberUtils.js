export default function formatThousandSeparator(num) {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}