"use client";

import React from "react";
import Link from "next/link";

export interface TableColumn<T> {
  key: string;
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface TableAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: (item: T) => void;
  href?: (item: T) => string;
  className?: string;
  disabled?: (item: T) => boolean;
}

export interface CompactTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  pageSize?: number;
  maxHeight?: string;
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  onRowClick?: (item: T) => void;
  showSkeletons?: boolean;
  stickyHeader?: boolean;
  className?: string;
}

function CompactTable<T extends { _id?: string; id?: string }>({
  data,
  columns,
  actions,
  loading = false,
  pageSize = 10,
  maxHeight = "420px",
  emptyMessage = "No data found",
  emptyIcon: EmptyIcon,
  onRowClick,
  showSkeletons = true,
  stickyHeader = true,
  className = "",
}: CompactTableProps<T>) {
  // Generate skeleton rows if needed
  const displayData = React.useMemo(() => {
    if (!showSkeletons) return data;
    const items = [...data];
    while (items.length < pageSize) {
      items.push(null as any);
    }
    return items.slice(0, pageSize);
  }, [data, pageSize, showSkeletons]);

  const renderCell = (item: T | null, column: TableColumn<T>, index: number) => {
    if (!item) {
      // Skeleton cell
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      );
    }

    if (column.render) {
      return column.render(item, index);
    }

    if (column.accessor) {
      if (typeof column.accessor === "function") {
        return column.accessor(item);
      }
      return item[column.accessor] as React.ReactNode;
    }

    return null;
  };

  const renderActions = (item: T | null) => {
    if (!item || !actions || actions.length === 0) {
      if (!item) {
        // Skeleton actions
        return (
          <div className="flex items-center space-x-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3.5 w-3.5 rounded bg-gray-200"></div>
            ))}
          </div>
        );
      }
      return null;
    }

    return (
      <div className="flex items-center justify-end space-x-2">
        {actions.map((action, actionIndex) => {
          const isDisabled = action.disabled?.(item);
          const ActionIcon = action.icon;

          if (action.href) {
            return (
              <Link
                key={actionIndex}
                href={action.href(item)}
                className={`text-gray-600 hover:text-black ${
                  isDisabled ? "opacity-50 pointer-events-none" : ""
                } ${action.className || ""}`}
              >
                {ActionIcon ? (
                  <ActionIcon className="h-3.5 w-3.5" />
                ) : (
                  action.label
                )}
              </Link>
            );
          }

          return (
            <button
              key={actionIndex}
              onClick={() => action.onClick?.(item)}
              disabled={isDisabled}
              className={`text-gray-600 hover:text-black disabled:opacity-50 ${action.className || ""}`}
            >
              {ActionIcon ? (
                <ActionIcon className="h-3.5 w-3.5" />
              ) : (
                action.label
              )}
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="table-responsive">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-sm text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <div className="table-responsive">
        <div style={{ maxHeight }} className="overflow-y-auto">
          <table className="table-compact">
            <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`${column.headerClassName || ""} ${
                      column.className || ""
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th className="text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, index) => {
                const key = item?._id || item?.id || `row-${index}`;
                return (
                  <tr
                    key={key}
                    onClick={onRowClick && item ? () => onRowClick(item) : undefined}
                    className={onRowClick && item ? "cursor-pointer" : ""}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={column.className || ""}
                      >
                        {renderCell(item, column, index)}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className="actions">{renderActions(item)}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {data.length === 0 && !loading && (
          <div className="text-center py-12">
            {EmptyIcon && <EmptyIcon className="mx-auto h-12 w-12 text-gray-400" />}
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {emptyMessage}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompactTable;
