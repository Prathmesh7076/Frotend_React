"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProductForm } from "@/components/ProductForm";
import { PageLoader } from "@/components/Loader";
import { ErrorState } from "@/components/ErrorState";
import {
  getCategories,
  getProductById,
  updateProduct as updateProductApi,
} from "@/services/productApi";
import type { Product, ProductFormData } from "@/types";
import {
  saveLocalEdit,
  saveLocalAddition,
  NEXT_LOCAL_ID,
  getLocalAdditions,
  getLocalEdits,
} from "@/lib/localChanges";
import { parseNumber } from "@/lib/urlHelpers";

const EditProductPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const idRaw = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const parsedId = parseNumber(idRaw);

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submittedRef = React.useRef(false);

  const loadData = useCallback(async () => {
    if (parsedId === undefined || isNaN(parsedId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [cats, apiProduct] = await Promise.allSettled([
        getCategories(),
        getProductById(parsedId),
      ]);

      if (cats.status === "fulfilled") {
        setCategories(cats.value);
      }

      let finalProduct: Product | null = null;

      if (apiProduct.status === "fulfilled") {
        const edits = getLocalEdits();
        const edit = edits[parsedId];
        finalProduct = edit
          ? ({ ...apiProduct.value, ...edit, id: apiProduct.value.id } as Product)
          : apiProduct.value;
      } else {
        const additions = getLocalAdditions();
        const found = additions.find((p) => p.id === parsedId);
        if (found) {
          finalProduct = found;
        } else {
          setNotFound(true);
        }
      }

      if (finalProduct) {
        setProduct(finalProduct);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load data";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [parsedId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (data: ProductFormData) => {
    if (submittedRef.current || submitting || parsedId === undefined) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        price: Number(data.price),
        discountPercentage: Number(data.discountPercentage),
        rating: Number(data.rating),
        stock: Number(data.stock),
        brand: data.brand,
        thumbnail: data.thumbnail,
      };

      if (parsedId < 0) {
        const additions = getLocalAdditions();
        const idx = additions.findIndex((p) => p.id === parsedId);
        if (idx >= 0) {
          additions[idx] = { ...additions[idx], ...payload } as Product;
          localStorage.setItem(
            "local_product_changes_additions",
            JSON.stringify(additions)
          );
        }
        setSuccess(`"${payload.title}" has been updated.`);
        setTimeout(() => router.push(`/products/${parsedId}`), 800);
        return;
      }

      try {
        const updated = await updateProductApi(parsedId, payload);
        saveLocalEdit(parsedId, payload as Partial<Product>);
        setSuccess(`"${updated.title}" has been updated.`);
      } catch {
        saveLocalEdit(parsedId, payload as Partial<Product>);
        setSuccess(`"${payload.title}" has been updated locally.`);
      }

      setTimeout(() => router.push(`/products/${parsedId}`), 800);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update product";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
      submittedRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <PageLoader label="Loading product..." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
          <ErrorState
            title="Product not found"
            message="The product you&apos;re trying to edit doesn&apos;t exist."
            onRetry={() => router.push("/products")}
          />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
          <ErrorState
            title="Couldn't load product"
            message={loadError}
            onRetry={() => loadData()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href="/products"
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            Products
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4 text-slate-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <Link
            href={`/products/${parsedId}`}
            className="text-slate-500 hover:text-slate-700 transition-colors truncate"
          >
            {product?.title || "Product"}
          </Link>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4 text-slate-400 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="font-medium text-slate-700">Edit</span>
        </nav>

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
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
              {success} Redirecting...
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-8">
          <div className="mb-6 pb-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Edit product</h1>
            <p className="mt-1 text-sm text-slate-500">
              Update the product details below.
            </p>
          </div>

          <ProductForm
            initialData={product || undefined}
            categories={categories}
            isSubmitting={submitting}
            error={submitError}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        </div>
      </main>
    </div>
  );
};

export default EditProductPage;
