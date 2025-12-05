import React, { useState, useMemo } from 'react';
import Button from './Button';
import './DataTable.css';

const DataTable = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  onEdit,
  onDelete,
  actions,
  className = '',
  ...props
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderSortIcon = (columnKey) => {
    if (!sortable || sortConfig.key !== columnKey) return null;

    return (
      <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
    );
  };

  const renderCellContent = (item, column) => {
    const value = item[column.key];

    if (column.render) {
      return column.render(value, item);
    }

    if (column.type === 'date') {
      return new Date(value).toLocaleDateString();
    }

    if (column.type === 'currency') {
      return `ETB ${Number(value).toLocaleString()}`;
    }

    return value;
  };

  const renderActions = (item) => {
    if (!actions && !onEdit && !onDelete) return null;

    return (
      <div className="table-actions">
        {onEdit && (
          <Button
            variant="secondary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <i className="fas fa-edit"></i>
          </Button>
        )}
        {onDelete && (
          <Button
            variant="error"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
          >
            <i className="fas fa-trash"></i>
          </Button>
        )}
        {actions && actions(item)}
      </div>
    );
  };

  const tableClasses = [
    'data-table',
    loading ? 'data-table-loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="data-table-container">
      {searchable && (
        <div className="data-table-search">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      <div className={tableClasses} {...props}>
        <table>
          <thead>
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={sortable && column.sortable !== false ? 'sortable' : ''}
                >
                  <div className="th-content">
                    {column.label}
                    {renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || actions) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || actions ? 1 : 0)} className="loading-cell">
                  <div className="loading-spinner"></div>
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || actions ? 1 : 0)} className="empty-cell">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={item.id || index}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={onRowClick ? 'clickable' : ''}
                >
                  {columns.map(column => (
                    <td key={column.key}>
                      {renderCellContent(item, column)}
                    </td>
                  ))}
                  {(onEdit || onDelete || actions) && (
                    <td>{renderActions(item)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="data-table-pagination">
          <Button
            variant="secondary"
            size="small"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </Button>

          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>

          <Button
            variant="secondary"
            size="small"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default DataTable;
