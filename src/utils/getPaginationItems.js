import Pagination from "react-bootstrap/Pagination";
/**
 * 
 * @param {number} activePage 
 * @param {React.SetStateAction<number>} setActivePage 
 * @param {number} totalPages 
 * @param {number} maxVisiblePages 
 * @returns the sub components for &lt;Pagination&gt;&lt;/Pagination&gt; component
 */
const getPaginationItems = (activePage, setActivePage, totalPages, maxVisiblePages) => {
    const items = [];
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
      // If total pages <= 10, show all
      startPage = 1;
      endPage = totalPages;
    } else {
      // Calculate range around activePage
      const halfVisible = Math.floor(maxVisiblePages / 2);
      startPage = Math.max(1, activePage - halfVisible);
      endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      // Adjust if nearing the end
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    // Add First and Prev
    items.push(<Pagination.First key="first" onClick={() => setActivePage(1)} disabled={activePage === 1} />);
    items.push(<Pagination.Prev key="prev" onClick={() => setActivePage(activePage - 1)} disabled={activePage === 1} />);

    // Add ellipsis if startPage > 2
    if (startPage > 2) {
      items.push(<Pagination.Item key={1} onClick={() => setActivePage(1)}>{1}</Pagination.Item>);
      items.push(<Pagination.Ellipsis key="start-ellipsis" />);
    } else if (startPage === 2) {
      items.push(<Pagination.Item key={1} onClick={() => setActivePage(1)}>{1}</Pagination.Item>);
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === activePage}
          onClick={() => setActivePage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Add ellipsis if endPage < totalPages - 1
    if (endPage < totalPages - 1) {
      items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      items.push(<Pagination.Item key={totalPages} onClick={() => setActivePage(totalPages)}>{totalPages}</Pagination.Item>);
    } else if (endPage === totalPages - 1) {
      items.push(<Pagination.Item key={totalPages} onClick={() => setActivePage(totalPages)}>{totalPages}</Pagination.Item>);
    }

    // Add Next and Last
    items.push(<Pagination.Next key="next" onClick={() => setActivePage(activePage + 1)} disabled={activePage === totalPages} />);
    items.push(<Pagination.Last key="last" onClick={() => setActivePage(totalPages)} disabled={activePage === totalPages} />);

    return items;
  };

  export default getPaginationItems