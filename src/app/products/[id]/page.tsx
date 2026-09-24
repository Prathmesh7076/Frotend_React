"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/Loader";
import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getProductById, deleteProduct as deleteProductApi } from "@/services/productApi";
import type { Product, Review } from "@/types";
import {
  getProductByIdWithLocalEdits,
  saveLocalDeletion,
  removeLocalAddition,
} from "@/lib/localChanges";
import { parseNumber } from "@/lib/urlHelpers";

const StarRating: React.FC<{ rating: number; size?: "sm" | "md" | "lg" }> = ({
  rating,
  size = "md",
}) => {
  const sizeMap = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };
  const rounded = Math.round(rating * 10) / 10;
  return (
    <div className="flex items-center gap-1">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${sizeMap[size]} text-amber-400`}
      >
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-sm font-semibold text-slate-700">
        {rounded.toFixed(1)}
      </span>
    </div>
  );
};

const ReviewItem: React.FC<{ review: Review }> = ({ review }) => {
  const date = new Date(review.date);
  const formatted = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="py-5 border-b border-slate-100 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold text-sm flex-shrink-0">
            {review.reviewerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {review.reviewerName}
            </p>
            <p className="text-xs text-slate-500">{formatted}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">
        {review.comment}
      </p>
    </div>
  );
};

const ProductNotFound: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-10 w-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Product not found</h1>
        <p className="mt-2 text-slate-500">
          The product you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Back to products
          </button>
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Browse all products
          </Link>
        </div>
      </div>
    </div>
  );
};

const ProductDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const idRaw = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const parsedId = parseNumber(idRaw);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadProduct = useCallback(async () => {
    if (parsedId === undefined || parsedId === null || isNaN(parsedId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const apiProduct = await getProductById(parsedId);
      const merged = getProductByIdWithLocalEdits(apiProduct, parsedId);
      if (!merged) {
        setNotFound(true);
      } else {
        setProduct(merged);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load product";
      if (
        err instanceof Error &&
        (message.toLowerCase().includes("not found") ||
          message.includes("404"))
      ) {
        setNotFound(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [parsedId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleEdit = () => {
    if (parsedId !== undefined) {
      router.push(`/products/${parsedId}/edit`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (parsedId === undefined || !product) return;
    setDeleteSubmitting(true);
    try {
      if (parsedId < 0) {
        removeLocalAddition(parsedId);
      } else {
        try {
          await deleteProductApi(parsedId);
        } catch {
        }
        saveLocalDeletion(parsedId);
      }
      router.push("/products");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete product";
      setError(message);
    } finally {
      setDeleteSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <PageLoader label="Loading product details..." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <ProductNotFound onBack={() => router.push("/products")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
          <ErrorState
            title="Couldn't load product"
            message={error}
            onRetry={() => loadProduct()}
            isRetrying={loading}
          />
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.thumbnail];

  const currentImage = images[activeImageIdx] || product.thumbnail;

  const finalPrice = product.price;
  const beforeDiscount = product.discountPercentage
    ? finalPrice / (1 - product.discountPercentage / 100)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
          <span className="font-medium text-slate-700 truncate">
            {product.title}
          </span>
        </nav>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            <div className="lg:col-span-2 bg-slate-50 p-4 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-200">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-white border border-slate-200 mb-4">
                <Image
                  src={currentImage}
                  alt={product.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                  className="object-contain p-4 sm:p-8"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-lg border-2 overflow-hidden bg-white transition-all ${
                        idx === activeImageIdx
                          ? "border-primary-500 ring-2 ring-primary-200"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.title} view ${idx + 1}`}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-3 p-5 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                      {product.category}
                    </span>
                    {product.brand && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {product.brand}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.stock > 20
                          ? "bg-emerald-50 text-emerald-700"
                          : product.stock > 0
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                    {product.title}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <StarRating rating={product.rating} size="md" />
                    <span className="text-sm text-slate-500">
                      {product.reviews?.length || 0} reviews
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-4xl font-bold text-slate-900">
                  ${finalPrice.toFixed(2)}
                </span>
                {beforeDiscount && (
                  <>
                    <span className="text-xl text-slate-400 line-through">
                      ${beforeDiscount.toFixed(2)}
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      -{product.discountPercentage.toFixed(0)}%
                    </span>
                  </>
                )}
              </div>

              <div className="mt-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-2">
                  Description
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {(product.tags?.length || 0) > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(product.warrantyInformation ||
                product.shippingInformation ||
                product.returnPolicy ||
                product.minimumOrderQuantity) && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.warrantyInformation && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Warranty
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {product.warrantyInformation}
                      </p>
                    </div>
                  )}
                  {product.shippingInformation && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Shipping
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {product.shippingInformation}
                      </p>
                    </div>
                  )}
                  {product.returnPolicy && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Returns
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {product.returnPolicy}
                      </p>
                    </div>
                  )}
                  {product.minimumOrderQuantity && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Min. Order
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {product.minimumOrderQuantity} unit(s)
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                  Edit product
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>

          {(product.reviews?.length || 0) > 0 && (
            <div className="border-t border-slate-200 p-5 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Customer Reviews
                </h2>
                <div className="flex items-center gap-2">
                  <StarRating rating={product.rating} size="md" />
                  <span className="text-sm font-medium text-slate-500">
                    ({product.reviews?.length || 0})
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {product.reviews?.map((review, idx) => (
                  <ReviewItem key={idx} review={review} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete product?"
        message={`Are you sure you want to delete "${product?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteSubmitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default ProductDetailsPage;
