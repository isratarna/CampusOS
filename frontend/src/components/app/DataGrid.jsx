import * as React from "react"
import { cn } from "@/lib/utils"
import { EmptyState, Skeleton } from "./primitives"
import { ArrowDown, ArrowUp, ChevronsUpDown, Pencil, Search, Trash2 } from "lucide-react"

/* ============================================================
   The table from the reference sheet: numbered rows, a hairline
   grid, a sticky head, and inline row actions rather than a
   hidden overflow menu.

   columns: [{ key, label, sortable, width, align, render(row) }]
   ============================================================ */

function SortIcon({ state }) {
  if (state === "asc") return <ArrowUp className="size-3" strokeWidth={2.4} />
  if (state === "desc") return <ArrowDown className="size-3" strokeWidth={2.4} />
  return (
    <ChevronsUpDown className="size-3 opacity-0 transition-opacity duration-200 group-hover/th:opacity-60" strokeWidth={2.2} />
  )
}

export function DataGrid({
  columns = [],
  rows = [],
  loading = false,
  searchKeys = [],
  searchPlaceholder = "Search",
  filters,
  onEdit,
  onDelete,
  onRowClick,
  empty,
  numbered = true,
  className,
}) {
  const [query, setQuery] = React.useState("")
  const [sort, setSort] = React.useState({ key: null, dir: "asc" })

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || searchKeys.length === 0) return rows
    return rows.filter((row) =>
      searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(q))
    )
  }, [rows, query, searchKeys])

  const sorted = React.useMemo(() => {
    if (!sort.key) return filtered
    const col = columns.find((c) => c.key === sort.key)
    const read = col?.sortValue || ((row) => row[sort.key])
    return [...filtered].sort((a, b) => {
      const av = read(a)
      const bv = read(b)
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true })
      return sort.dir === "asc" ? cmp : -cmp
    })
  }, [filtered, sort, columns])

  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    )

  const hasActions = Boolean(onEdit || onDelete)
  const colCount = columns.length + (numbered ? 1 : 0) + (hasActions ? 1 : 0)

  return (
    <div className={cn("space-y-4", className)}>
      {/* ---- toolbar ---- */}
      {(searchKeys.length > 0 || filters) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchKeys.length > 0 && (
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-mut-2"
                strokeWidth={2.2}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  "h-9 w-full rounded-sm border border-line bg-paper pl-9 pr-3 text-[13px] text-ink",
                  "placeholder:text-mut-2 transition-[border-color,box-shadow] duration-200",
                  "focus:border-blue focus:outline-none focus:ring-[3px] focus:ring-blue/15"
                )}
              />
            </div>
          )}
          {filters}
        </div>
      )}

      {/* ---- table ---- */}
      <div className="overflow-hidden rounded-md border border-line bg-paper shadow-paper">
        <div className="co-scroll overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-bone-2/50">
                {numbered && (
                  <th className="w-10 px-4 py-2.5 text-center">
                    <span className="co-eyebrow">#</span>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      "group/th px-4 py-2.5 whitespace-nowrap",
                      col.align === "right" && "text-right",
                      col.sortable && "cursor-pointer select-none"
                    )}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span
                      className={cn(
                        "co-eyebrow inline-flex items-center gap-1.5 transition-colors duration-200",
                        col.sortable && "hover:text-ink",
                        sort.key === col.key && "text-ink"
                      )}
                    >
                      {col.label}
                      {col.sortable && (
                        <SortIcon state={sort.key === col.key ? sort.dir : null} />
                      )}
                    </span>
                  </th>
                ))}
                {hasActions && (
                  <th className="w-24 px-4 py-2.5 text-right">
                    <span className="co-eyebrow">Actions</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className={cn(!loading && sorted.length > 0 && "co-stagger")}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-line-2 last:border-0">
                    <td colSpan={colCount} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={colCount}>
                    {empty || (
                      <EmptyState
                        icon={Search}
                        title={query ? "Nothing matches that search" : "Nothing here yet"}
                        description={
                          query
                            ? `No rows contain "${query}". Try a shorter search.`
                            : "Records you add will be listed here."
                        }
                      />
                    )}
                  </td>
                </tr>
              ) : (
                sorted.map((row, i) => (
                    <tr
                      key={row._id || row.id || i}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        "group border-b border-line-2 transition-colors duration-200 last:border-0",
                        "hover:bg-bone-2/60",
                        onRowClick && "cursor-pointer"
                      )}
                    >
                      {numbered && (
                        <td className="px-4 py-3 text-center">
                          <span className="co-index">{String(i + 1).padStart(2, "0")}</span>
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3 text-[13px] text-ink",
                            col.align === "right" && "text-right"
                          )}
                        >
                          {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                        </td>
                      ))}
                      {hasActions && (
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center justify-end gap-1 opacity-60 transition-opacity duration-200 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {onEdit && (
                              <button
                                type="button"
                                onClick={() => onEdit(row)}
                                aria-label="Edit"
                                className="co-press grid size-7 place-items-center rounded-sm text-mut hover:bg-blue-soft hover:text-blue"
                              >
                                <Pencil className="size-3.5" strokeWidth={2.2} />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                type="button"
                                onClick={() => onDelete(row)}
                                aria-label="Delete"
                                className="co-press grid size-7 place-items-center rounded-sm text-mut hover:bg-red-soft hover:text-red"
                              >
                                <Trash2 className="size-3.5" strokeWidth={2.2} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- footer count ---- */}
      {!loading && sorted.length > 0 && (
        <p className="text-[11px] text-mut">
          Showing <span className="co-num font-semibold text-ink">{sorted.length}</span> of{" "}
          <span className="co-num font-semibold text-ink">{rows.length}</span>
          {query && (
            <>
              {" "}
              matching “<span className="text-ink">{query}</span>”
            </>
          )}
        </p>
      )}
    </div>
  )
}
