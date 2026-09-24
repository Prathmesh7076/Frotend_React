import { Product } from "@/types";

const LOCAL_STORAGE_PREFIX = "local_product_changes_";

type LocalChangesMap = {
  [id: number]: Partial<Product>;
};

type LocalAddedProducts = Product[];

const getStorageKey = (key: string): string => LOCAL_STORAGE_PREFIX + key;

export const getLocalEdits = (): LocalChangesMap => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getStorageKey("edits"));
    return raw ? (JSON.parse(raw) as LocalChangesMap) : {};
  } catch {
    return {};
  }
};

export const saveLocalEdit = (
  id: number,
  changes: Partial<Product>
): void => {
  if (typeof window === "undefined") return;
  const edits = getLocalEdits();
  edits[id] = { ...edits[id], ...changes };
  localStorage.setItem(getStorageKey("edits"), JSON.stringify(edits));
};

export const removeLocalEdit = (id: number): void => {
  if (typeof window === "undefined") return;
  const edits = getLocalEdits();
  delete edits[id];
  localStorage.setItem(getStorageKey("edits"), JSON.stringify(edits));
};

export const getLocalAdditions = (): LocalAddedProducts => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey("additions"));
    return raw ? (JSON.parse(raw) as LocalAddedProducts) : [];
  } catch {
    return [];
  }
};

export const saveLocalAddition = (product: Product): void => {
  if (typeof window === "undefined") return;
  const additions = getLocalAdditions();
  additions.unshift(product);
  localStorage.setItem(getStorageKey("additions"), JSON.stringify(additions));
};

export const removeLocalAddition = (id: number): void => {
  if (typeof window === "undefined") return;
  const additions = getLocalAdditions().filter((p) => p.id !== id);
  localStorage.setItem(getStorageKey("additions"), JSON.stringify(additions));
};

export const getLocalDeletions = (): number[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey("deletions"));
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
};

export const saveLocalDeletion = (id: number): void => {
  if (typeof window === "undefined") return;
  const deletions = new Set(getLocalDeletions());
  deletions.add(id);
  localStorage.setItem(
    getStorageKey("deletions"),
    JSON.stringify(Array.from(deletions))
  );
  removeLocalEdit(id);
  removeLocalAddition(id);
};

export const applyLocalChangesToProducts = (
  products: Product[],
  skip: number = 0,
  limit: number = Infinity
): { products: Product[]; total: number } => {
  const edits = getLocalEdits();
  const deletions = new Set(getLocalDeletions());
  const additions = getLocalAdditions();

  const mergedProducts: Product[] = [];

  for (const product of products) {
    if (deletions.has(product.id)) continue;
    const edit = edits[product.id];
    if (edit) {
      mergedProducts.push({ ...product, ...edit, id: product.id } as Product);
    } else {
      mergedProducts.push(product);
    }
  }

  const filteredAdditions = additions.filter(
    (p) => !deletions.has(p.id)
  );

  const allProducts = [...filteredAdditions, ...mergedProducts];

  const total = allProducts.length;

  const paginatedProducts =
    limit === Infinity
      ? allProducts.slice(skip)
      : allProducts.slice(skip, skip + limit);

  return { products: paginatedProducts, total };
};

export const applyLocalChangesToPage = (
  products: Product[],
  apiTotal: number,
  page: number,
  limit: number
): { products: Product[]; total: number } => {
  const edits = getLocalEdits();
  const deletions = new Set(getLocalDeletions());
  const additions = getLocalAdditions().filter((product) => !deletions.has(product.id));
  const mergedProducts = products.flatMap((product) => {
    if (deletions.has(product.id)) return [];
    const edit = edits[product.id];
    return [edit ? ({ ...product, ...edit, id: product.id } as Product) : product];
  });

  const visibleProducts = page === 1
    ? [...additions, ...mergedProducts].slice(0, limit)
    : mergedProducts;

  return {
    products: visibleProducts,
    total: Math.max(0, apiTotal - deletions.size + additions.length),
  };
};

export const getProductByIdWithLocalEdits = (
  apiProduct: Product | null,
  id: number
): Product | null => {
  if (!apiProduct) {
    const additions = getLocalAdditions();
    const found = additions.find((p) => p.id === id);
    if (found) return found;
    if (getLocalDeletions().includes(id)) return null;
    return null;
  }
  const edits = getLocalEdits();
  const edit = edits[id];
  if (edit) {
    return { ...apiProduct, ...edit, id: apiProduct.id } as Product;
  }
  return apiProduct;
};

export const NEXT_LOCAL_ID = (): number => {
  const additions = getLocalAdditions();
  if (additions.length === 0) return -1;
  return Math.min(...additions.map((p) => p.id)) - 1;
};
