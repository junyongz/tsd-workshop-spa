import { useEffect, useState } from "react"
import { Pagination } from "react-bootstrap";
import getPaginationItems from "../utils/getPaginationItems";

export default function ResponsivePagination({
    activePage, setActivePage, totalPages, lgPageNum=10, xsPageNum=3
}) {
    const [pageNum, setPageNum] = useState(lgPageNum);

    useEffect(() => {
        const settingResponsivePageNum = () => {
            if (window.matchMedia('(min-width: 992px)').matches) {
                setPageNum(lgPageNum)
            }
            else {
                setPageNum(xsPageNum)
            }
        }
        settingResponsivePageNum()

        window.addEventListener('resize', settingResponsivePageNum)

        return () => window.removeEventListener('resize', settingResponsivePageNum)
    }, [])


    return (
        <Pagination className='fw-lighter'>
        { getPaginationItems(activePage, setActivePage, totalPages, pageNum) }
        </Pagination>
    )
}