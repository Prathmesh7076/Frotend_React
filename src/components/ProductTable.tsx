"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

interface ProductTableProps {
  products: Product[];
  onEdit: (id: number) => void;
  onDelete: (product: Product) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const rounded = Math.round(rating * 10) / 10;
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4 text-amber-400"
      >
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-sm font-medium text-slate-700">{rounded.toFixed(1)}</span>
    </div>
  );
};

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="min-w-full divide-y divide-slate-200">
      <thead className="bg-slate-50">
        <tr>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Product
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Category
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Price
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Rating
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Stock
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200 bg-white">
        {products.map((product) => (
          <tr
            key={product.id}
            className="hover:bg-slate-50/50 transition-colors"
          >
            <td className="whitespace-nowrap px-4 py-3">
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-3"
              >
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <Image
                    src={product.thumbnail}
                    alt={product.title}
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900 hover:text-primary-600 transition-colors">
                    {product.title}
                  </div>
                  {product.brand && (
                    <div className="truncate text-xs text-slate-500">
                      {product.brand}
                    </div>
                  )}
                </div>
              </Link>
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                {product.category}
              </span>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
              ${product.price.toFixed(2)}
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <StarRating rating={product.rating} />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                product.stock > 20
                  ? "text-emerald-600"
                  : product.stock > 0
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    product.stock > 20
                      ? "bg-emerald-500"
                      : product.stock > 0
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                />
                {product.stock}
              </span>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-1">
                <Link
                  href={`/products/${product.id}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="View details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <button
                  onClick={() => onEdit(product.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="Edit product"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(product)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                  title="Delete product"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
};

export default ProductTable;
