"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ProductTable } from "@/components/ProductTable";
import { ProductCard } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import { PageLoader } from "@/components/Loader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useDebounce } from "@/hooks/useDebounce";
import { parsePage, parsePageSize, parseSort, sanitizeString } from "@/lib/urlHelpers";
import {
  getProducts,
  searchProducts,
  getProductsByCategory,
  getCategories,
  deleteProduct as deleteProductApi,
} from "@/services/productApi";
import type { Product, ProductsResponse, SortField } from "@/types";
import {
  applyLocalChangesToProducts,
  applyLocalChangesToPage,
  saveLocalDeletion,
  removeLocalAddition,
} from "@/lib/localChanges";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const SORT_FIELDS: { value: SortField | ""; label: string }[] = [
  { value: "", label: "Default" },
  { value: "price", label: "Price" },
  { value: "rating", label: "Rating" },
  { value: "title", label: "Title" },
];

const ProductListContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageSizeFromUrl = parsePageSize(
    searchParams?.get("limit"),
    PAGE_SIZE_OPTIONS
  );
  const [pageSize, setPageSizeState] = useState<number>(pageSizeFromUrl);

  const searchInput = sanitizeString(searchParams?.get("search"));
  const categoryFilter = sanitizeString(searchParams?.get("category"));
  const { field: sortField, order: sortOrder } = parseSort(
    searchParams?.get("sort"),
    searchParams?.get("order"),
    ["price", "rating", "title"]
  );

  const [searchValue, setSearchValue] = useState(searchInput);
  const debouncedSearch = useDebounce(searchValue, 400);

  const pageFromUrl = parsePage(searchParams?.get("page"));
  const [page, setPageState] = useState<number>(pageFromUrl);

  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPageState((prev) => {
      const safe = parsePage(searchParams?.get("page"), totalPages);
      return safe === prev ? prev : safe;
    });
  }, [searchParams, totalPages]);

  useEffect(() => {
    setSearchValue(searchInput);
  }, [searchInput]);

  useEffect(() => {
    setPageSizeState((prev) => {
      const safe = parsePageSize(searchParams?.get("limit"), PAGE_SIZE_OPTIONS);
      return safe === prev ? prev : safe;
    });
  }, [searchParams]);

  const sortProductsList = useCallback(
    (list: Product[]): Product[] => {
      if (!sortField) return list;
      return [...list].sort((a, b) => {
        const field = sortField as SortField;
        let av: string | number = a[field];
        let bv: string | number = b[field];
        if (typeof av === "string") av = av.toLowerCase();
        if (typeof bv === "string") bv = bv.toLowerCase();
        if (av < bv) return sortOrder === "asc" ? -1 : 1;
        if (av > bv) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    },
    [sortField, sortOrder]
  );

  const loadProducts = useCallback(async () => {
    const currentId = ++requestIdRef.current;
    setProductsLoading(true);
    setProductsError(null);

    try {
      const skip = (page - 1) * pageSize;
      let response: ProductsResponse;
      const sortOptions = sortField
        ? { sort: sortField as SortField, order: sortOrder }
        : undefined;

      if (debouncedSearch && !categoryFilter) {
        response = await searchProducts(debouncedSearch, page, pageSize, sortOptions);
      } else if (categoryFilter && !debouncedSearch) {
        response = await getProductsByCategory(categoryFilter, page, pageSize, sortOptions);
      } else if (debouncedSearch && categoryFilter) {
        response = await searchProducts(debouncedSearch, 1, 500);
        const filtered = response.products.filter(
          (p) => p.category.toLowerCase() === categoryFilter.toLowerCase()
        );
        response = {
          products: filtered,
          total: filtered.length,
          skip: 0,
          limit: 500,
        };
      } else {
        response = await getProducts(page, pageSize, sortOptions);
      }

      if (currentId !== requestIdRef.current) return;

      const localResult =
        debouncedSearch && categoryFilter
          ? applyLocalChangesToProducts(response.products, skip, pageSize)
          : applyLocalChangesToPage(
              response.products,
              response.total,
              page,
              pageSize
            );
      const { products: merged, total: mergedTotal } = localResult;

      const sorted = sortProductsList(merged);

      setProducts(sorted);
      setTotal(mergedTotal);
    } catch (err) {
      if (currentId !== requestIdRef.current) return;
      const message =
        err instanceof Error ? err.message : "Failed to load products";
      setProductsError(message);
    } finally {
      if (currentId === requestIdRef.current) {
        setProductsLoading(false);
      }
    }
  }, [page, pageSize, debouncedSearch, categoryFilter, sortField, sortOrder, sortProductsList]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const updateUrl = useCallback(
    (params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      sort?: string | null;
      order?: string | null;
    }) => {
      const current = new URLSearchParams(searchParams?.toString() || "");

      if (params.page !== undefined) {
        if (params.page > 1) current.set("page", String(params.page));
        else current.delete("page");
      }
      if (params.limit !== undefined) {
        if (params.limit !== PAGE_SIZE_OPTIONS[0])
          current.set("limit", String(params.limit));
        else current.delete("limit");
      }
      if (params.search !== undefined) {
        if (params.search) current.set("search", params.search);
        else current.delete("search");
      }
      if (params.category !== undefined) {
        if (params.category) current.set("category", params.category);
        else current.delete("category");
      }
      if (params.sort !== undefined) {
        if (params.sort) current.set("sort", params.sort);
        else current.delete("sort");
      }
      if (params.order !== undefined) {
        if (params.order && params.order !== "asc")
          current.set("order", params.order);
        else current.delete("order");
      }

      const query = current.toString();
      const path = query ? `/products?${query}` : "/products";
      router.push(path, { scroll: false });
    },
    [router, searchParams]
  );

  const handlePageChange = (newPage: number) => {
    const safePage = parsePage(String(newPage), totalPages);
    updateUrl({ page: safePage });
  };

  const handlePageSizeChange = (newSize: number) => {
    const safeSize = parsePageSize(String(newSize), PAGE_SIZE_OPTIONS);
    updateUrl({ limit: safeSize, page: 1 });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  useEffect(() => {
    if (debouncedSearch !== searchInput) {
      updateUrl({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, searchInput, updateUrl]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = sanitizeString(e.target.value);
    updateUrl({ category: val, page: 1 });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "") {
      updateUrl({ sort: null, order: null });
    } else {
      updateUrl({ sort: val });
    }
  };

  const handleSortOrderChange = () => {
    const newOrder: "asc" | "desc" = sortOrder === "asc" ? "desc" : "asc";
    updateUrl({ order: newOrder });
  };

  const handleClearFilters = () => {
    setSearchValue("");
    updateUrl({
      search: "",
      category: "",
      sort: null,
      order: null,
      page: 1,
    });
  };

  const handleEdit = (id: number) => {
    router.push(`/products/${id}/edit`);
  };

  const handleDeleteRequest = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleteSubmitting(true);
    try {
      if (productToDelete.id < 0) {
        removeLocalAddition(productToDelete.id);
      } else {
        try {
          await deleteProductApi(productToDelete.id);
        } catch {
        }
        saveLocalDeletion(productToDelete.id);
      }
      setDeleteSuccess(`"${productToDelete.title}" was deleted.`);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      await loadProducts();
      setTimeout(() => setDeleteSuccess(null), 4000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete product";
      setProductsError(message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const hasAnyFilter = useMemo(() => {
    return !!(searchValue || categoryFilter || sortField);
  }, [searchValue, categoryFilter, sortField]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      {deleteSuccess && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-emerald-600 flex-shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-emerald-800 flex-1">
              {deleteSuccess}
            </span>
          </div>
        </div>
      )}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Products
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your product catalog
            </p>
          </div>
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Product
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2 relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search products by title, description..."
                value={searchValue}
                onChange={handleSearchChange}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {searchValue && (
                <button
                  onClick={() => {
                    setSearchValue("");
                    updateUrl({ search: "", page: 1 });
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={handleCategoryChange}
                disabled={categoriesLoading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={sortField || ""}
                  onChange={handleSortChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {SORT_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>
                      Sort by {f.label.toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleSortOrderChange}
                disabled={!sortField}
                title={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
                className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sortOrder === "asc" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {(debouncedSearch || categoryFilter) && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {debouncedSearch && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                    Search: {debouncedSearch}
                    <button
                      onClick={() => {
                        setSearchValue("");
                        updateUrl({ search: "", page: 1 });
                      }}
                      className="ml-0.5 text-primary-500 hover:text-primary-700"
                    >
                      ×
                    </button>
                  </span>
                )}
                {categoryFilter && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                    Category: {categoryFilter}
                    <button
                      onClick={() => updateUrl({ category: "", page: 1 })}
                      className="ml-0.5 text-purple-500 hover:text-purple-700"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              {hasAnyFilter && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {productsLoading ? (
            <PageLoader label="Loading products..." />
          ) : productsError ? (
            <div className="py-8">
              <ErrorState
                title="Couldn't load products"
                message={productsError}
                onRetry={() => loadProducts()}
                isRetrying={productsLoading}
              />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title={hasAnyFilter ? "No products match your filters" : "No products yet"}
              description={
                hasAnyFilter
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Get started by creating your first product."
              }
              action={
                hasAnyFilter ? (
                  <button
                    onClick={handleClearFilters}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Clear filters
                  </button>
                ) : (
                  <Link
                    href="/products/new"
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Add first product
                  </Link>
                )
              }
            />
          ) : (
            <>
              <div className="hidden md:block">
                <ProductTable
                  products={products}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                />
              </div>
              <div className="md:hidden p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                  />
                ))}
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                total={total}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </div>
      </main>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete product?"
        message={
          productToDelete
            ? `Are you sure you want to delete "${productToDelete.title}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteSubmitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setProductToDelete(null);
        }}
      />
    </div>
  );
};

const ProductListPage: React.FC = () => (
  <Suspense fallback={<PageLoader label="Loading products..." />}>
    <ProductListContent />
  </Suspense>
);

export default ProductListPage;
