export const parseNumber = (
  value: string | null | undefined,
  min?: number,
  max?: number
): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  if (isNaN(n) || !isFinite(n)) return undefined;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
};

export const parsePage = (
  value: string | null | undefined,
  totalPages: number = Infinity
): number => {
  const parsed = parseNumber(value, 1);
  if (parsed === undefined) return 1;
  return Math.min(Math.floor(parsed), Math.max(1, totalPages));
};

export const parsePageSize = (
  value: string | null | undefined,
  validSizes: number[] = [10, 20, 50]
): number => {
  const parsed = parseNumber(value);
  if (parsed === undefined || !validSizes.includes(parsed)) return validSizes[0];
  return parsed;
};

export const parseSort = (
  sortField: string | null | undefined,
  sortOrder: string | null | undefined,
  validFields: string[] = ["price", "rating", "title"]
): { field: string | null; order: "asc" | "desc" } => {
  const field =
    sortField && validFields.includes(sortField) ? sortField : null;
  const order = sortOrder === "desc" ? "desc" : "asc";
  return { field, order };
};

export const sanitizeString = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.trim();
};
