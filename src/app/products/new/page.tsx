"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProductForm } from "@/components/ProductForm";
import { PageLoader } from "@/components/Loader";
import { getCategories, addProduct as addProductApi } from "@/services/productApi";
import type { Product, ProductFormData } from "@/types";
import { NEXT_LOCAL_ID, saveLocalAddition } from "@/lib/localChanges";

const NewProductPage: React.FC = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submittedRef = React.useRef(false);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load categories";
      setSubmitError(message);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async (data: ProductFormData) => {
    if (submittedRef.current || submitting) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const images = data.thumbnail ? [data.thumbnail] : [];
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
        images,
      };

      let newProduct: Product;
      try {
        newProduct = await addProductApi(payload);
      } catch {
        newProduct = {
          id: NEXT_LOCAL_ID(),
          title: payload.title,
          description: payload.description,
          category: payload.category,
          price: payload.price,
          discountPercentage: payload.discountPercentage,
          rating: payload.rating,
          stock: payload.stock,
          brand: payload.brand,
          thumbnail: payload.thumbnail,
          images: payload.images,
          tags: [],
          reviews: [],
        };
      }

      saveLocalAddition(newProduct);

      setSuccess(`"${newProduct.title}" has been added.`);
      setTimeout(() => {
        router.push(`/products/${newProduct.id}`);
      }, 800);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create product";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
      submittedRef.current = false;
    }
  };

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
          <span className="font-medium text-slate-700">New Product</span>
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
            <h1 className="text-2xl font-bold text-slate-900">Add new product</h1>
            <p className="mt-1 text-sm text-slate-500">
              Fill in the details below to create a new product listing.
            </p>
          </div>

          {categoriesLoading ? (
            <PageLoader label="Loading categories..." />
          ) : (
            <ProductForm
              categories={categories}
              isSubmitting={submitting}
              error={submitError}
              onSubmit={handleSubmit}
              submitLabel="Create Product"
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default NewProductPage;
