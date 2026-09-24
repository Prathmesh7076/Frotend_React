import axiosInstance from "@/lib/axios";
import {
  Product,
  ProductsResponse,
  ProductFormData,
  SortField,
  SortOrder,
} from "@/types";

type CategoryResponse = string | { slug: string };

const DEFAULT_LIMIT = 10;

type ProductListOptions = {
  sort?: SortField;
  order?: SortOrder;
};

export const getProducts = async (
  page: number = 1,
  limit: number = DEFAULT_LIMIT,
  options: ProductListOptions = {}
): Promise<ProductsResponse> => {
  const skip = (page - 1) * limit;
  const { data } = await axiosInstance.get<ProductsResponse>("/products", {
    params: {
      limit,
      skip,
      ...(options.sort ? { sortBy: options.sort, order: options.order } : {}),
      select: "id,title,category,price,rating,stock,thumbnail,description,images,reviews,brand,discountPercentage,tags,sku,weight,warrantyInformation,shippingInformation,availabilityStatus,returnPolicy,minimumOrderQuantity",
    },
  });
  return data;
};

export const searchProducts = async (
  query: string,
  page: number = 1,
  limit: number = DEFAULT_LIMIT,
  options: ProductListOptions = {}
): Promise<ProductsResponse> => {
  const skip = (page - 1) * limit;
  const { data } = await axiosInstance.get<ProductsResponse>("/products/search", {
    params: {
      q: query,
      limit,
      skip,
      ...(options.sort ? { sortBy: options.sort, order: options.order } : {}),
    },
  });
  return data;
};

export const getProductsByCategory = async (
  category: string,
  page: number = 1,
  limit: number = DEFAULT_LIMIT,
  options: ProductListOptions = {}
): Promise<ProductsResponse> => {
  const skip = (page - 1) * limit;
  const { data } = await axiosInstance.get<ProductsResponse>(
    `/products/category/${encodeURIComponent(category)}`,
    {
      params: {
        limit,
        skip,
        ...(options.sort ? { sortBy: options.sort, order: options.order } : {}),
      },
    }
  );
  return data;
};

export const getCategories = async (): Promise<string[]> => {
  const { data } = await axiosInstance.get<CategoryResponse[]>("/products/categories");
  return data.map((category) =>
    typeof category === "string" ? category : category.slug
  );
};

export const getProductById = async (id: number): Promise<Product> => {
  const { data } = await axiosInstance.get<Product>(`/products/${id}`);
  return data;
};

export const addProduct = async (product: ProductFormData): Promise<Product> => {
  const { data } = await axiosInstance.post<Product>("/products/add", product);
  return data;
};

export const updateProduct = async (
  id: number,
  product: Partial<ProductFormData>
): Promise<Product> => {
  const { data } = await axiosInstance.put<Product>(
    `/products/${id}`,
    product
  );
  return data;
};

export const deleteProduct = async (id: number): Promise<Product> => {
  const { data } = await axiosInstance.delete<Product>(`/products/${id}`);
  return data;
};
