"use client";

import React, { useEffect, useState } from "react";
import type { Product, ProductFormData } from "@/types";
import { ButtonSpinner } from "./Loader";

interface ProductFormProps {
  initialData?: Partial<Product>;
  categories?: string[];
  isLoading?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (data: ProductFormData) => void;
  submitLabel?: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  price?: string;
  discountPercentage?: string;
  rating?: string;
  stock?: string;
  brand?: string;
  thumbnail?: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories = [],
  isLoading = false,
  isSubmitting = false,
  error = null,
  onSubmit,
  submitLabel = "Save Product",
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    category: "",
    price: 0,
    discountPercentage: 0,
    rating: 0,
    stock: 0,
    brand: "",
    thumbnail: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title ?? "",
        description: initialData.description ?? "",
        category: initialData.category ?? "",
        price: initialData.price ?? 0,
        discountPercentage: initialData.discountPercentage ?? 0,
        rating: initialData.rating ?? 0,
        stock: initialData.stock ?? 0,
        brand: initialData.brand ?? "",
        thumbnail: initialData.thumbnail ?? "",
      });
    }
  }, [initialData]);

  const validateField = (
    name: keyof ProductFormData,
    value: string | number
  ): string | undefined => {
    switch (name) {
      case "title":
        if (!String(value).trim()) return "Title is required";
        if (String(value).trim().length < 3)
          return "Title must be at least 3 characters";
        if (String(value).trim().length > 200)
          return "Title must be less than 200 characters";
        return undefined;
      case "description":
        if (!String(value).trim()) return "Description is required";
        if (String(value).trim().length < 10)
          return "Description must be at least 10 characters";
        return undefined;
      case "category":
        if (!String(value).trim()) return "Category is required";
        return undefined;
      case "price": {
        const n = Number(value);
        if (isNaN(n) || value === "" || value === null)
          return "Price is required";
        if (n < 0) return "Price cannot be negative";
        if (n > 1000000) return "Price is too high";
        return undefined;
      }
      case "discountPercentage": {
        const n = Number(value);
        if (isNaN(n) || value === "" || value === null) return "Discount is required";
        if (n < 0) return "Discount cannot be negative";
        if (n > 100) return "Discount cannot be more than 100%";
        return undefined;
      }
      case "rating": {
        const n = Number(value);
        if (isNaN(n) || value === "" || value === null)
          return "Rating is required";
        if (n < 0) return "Rating cannot be negative";
        if (n > 5) return "Rating cannot be more than 5";
        return undefined;
      }
      case "stock": {
        const n = Number(value);
        if (isNaN(n) || value === "" || value === null)
          return "Stock is required";
        if (!Number.isInteger(n)) return "Stock must be a whole number";
        if (n < 0) return "Stock cannot be negative";
        return undefined;
      }
      case "brand":
        if (String(value).trim().length > 100)
          return "Brand must be less than 100 characters";
        return undefined;
      case "thumbnail":
        if (String(value).trim() && !isValidUrl(String(value)))
          return "Please enter a valid URL";
        return undefined;
      default:
        return undefined;
    }
  };

  const isValidUrl = (s: string): boolean => {
    try {
      new URL(s);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const key = name as keyof ProductFormData;
    const newValue =
      type === "number" ? (value === "" ? (0 as never) : (Number(value) as never)) : (value as never);

    setFormData((prev) => ({ ...prev, [key]: newValue }));

    if (touched[key]) {
      const fieldError = validateField(key, newValue);
      setErrors((prev) => ({ ...prev, [key]: fieldError }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const key = name as keyof ProductFormData;
    setTouched((prev) => ({ ...prev, [key]: true }));

    const actualValue =
      type === "number" ? (value === "" ? 0 : Number(value)) : value;
    const fieldError = validateField(key, actualValue);
    setErrors((prev) => ({ ...prev, [key]: fieldError }));
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as (keyof ProductFormData)[]).forEach((key) => {
      const err = validateField(key, formData[key] as string | number);
      if (err) {
        newErrors[key as keyof FormErrors] = err;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.fromEntries(Object.keys(formData).map((k) => [k, true]))
    );
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateAll()) return;
    onSubmit(formData);
  };

  const inputCls = (hasError?: boolean) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50"
        : "border-slate-300 bg-white focus:border-primary-500 focus:ring-primary-500"
    } disabled:bg-slate-50 disabled:text-slate-500`;

  const labelCls =
    "block text-sm font-medium text-slate-700 mb-1.5";

  if (isLoading) {
    return (
      <div className="py-16">
        <ButtonSpinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="title" className={labelCls}>
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter product title"
            className={inputCls(!!errors.title)}
            disabled={isSubmitting}
          />
          {errors.title && (
            <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className={labelCls}>
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Describe the product in detail..."
            className={inputCls(!!errors.description) + " resize-y"}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className={labelCls}>
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            onBlur={handleBlur}
            className={inputCls(!!errors.category)}
            disabled={isSubmitting}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1.5 text-xs text-red-600">{errors.category}</p>
          )}
        </div>

        <div>
          <label htmlFor="brand" className={labelCls}>
            Brand
          </label>
          <input
            id="brand"
            name="brand"
            type="text"
            value={formData.brand}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Brand name"
            className={inputCls(!!errors.brand)}
            disabled={isSubmitting}
          />
          {errors.brand && (
            <p className="mt-1.5 text-xs text-red-600">{errors.brand}</p>
          )}
        </div>

        <div>
          <label htmlFor="price" className={labelCls}>
            Price (USD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              $
            </span>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0.00"
              className={inputCls(!!errors.price) + " pl-7"}
              disabled={isSubmitting}
            />
          </div>
          {errors.price && (
            <p className="mt-1.5 text-xs text-red-600">{errors.price}</p>
          )}
        </div>

        <div>
          <label htmlFor="discountPercentage" className={labelCls}>
            Discount (%) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="discountPercentage"
              name="discountPercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.discountPercentage || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0"
              className={inputCls(!!errors.discountPercentage) + " pr-8"}
              disabled={isSubmitting}
            />
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
              %
            </span>
          </div>
          {errors.discountPercentage && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.discountPercentage}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="rating" className={labelCls}>
            Rating (0-5) <span className="text-red-500">*</span>
          </label>
          <input
            id="rating"
            name="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={formData.rating || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="4.5"
            className={inputCls(!!errors.rating)}
            disabled={isSubmitting}
          />
          {errors.rating && (
            <p className="mt-1.5 text-xs text-red-600">{errors.rating}</p>
          )}
        </div>

        <div>
          <label htmlFor="stock" className={labelCls}>
            Stock <span className="text-red-500">*</span>
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            step="1"
            min="0"
            value={formData.stock === 0 ? "" : formData.stock}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="0"
            className={inputCls(!!errors.stock)}
            disabled={isSubmitting}
          />
          {errors.stock && (
            <p className="mt-1.5 text-xs text-red-600">{errors.stock}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="thumbnail" className={labelCls}>
            Thumbnail Image URL
          </label>
          <input
            id="thumbnail"
            name="thumbnail"
            type="text"
            value={formData.thumbnail}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="https://example.com/image.jpg"
            className={inputCls(!!errors.thumbnail)}
            disabled={isSubmitting}
          />
          {errors.thumbnail && (
            <p className="mt-1.5 text-xs text-red-600">{errors.thumbnail}</p>
          )}
          {formData.thumbnail && !errors.thumbnail && (
            <div className="mt-2 inline-block overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.thumbnail}
                alt="Thumbnail preview"
                className="h-24 w-24 object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting && <ButtonSpinner />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
