const BASE_URL =
  process.env.STOCKBRIDGE_BASE_URL || "http://srv1624191.hstgr.cloud";

function apiKey(): string {
  const key = process.env.STOCKBRIDGE_API_KEY;
  if (!key) throw new Error("STOCKBRIDGE_API_KEY not set");
  return key;
}

export type StockBridgeStatus =
  | "RECEIVED"
  | "ACCEPTED"
  | "PICKING"
  | "PACKING"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED"
  | "REJECTED";

export interface StockBridgeAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  governorate: string;
  country_code?: string;
}

export interface StockBridgeOrderItemInput {
  product_id: string;
  sku: string;
  product_name: string;
  quantity: number;
  price_ht: number;
  tax_rate?: number;
  variant_id?: string | null;
}

export interface StockBridgeCreateOrderInput {
  external_ref?: string;
  priority?: "normal" | "high" | "express";
  shipping_address: StockBridgeAddress;
  items: StockBridgeOrderItemInput[];
}

export interface StockBridgeOrder {
  id: string;
  internal_ref: string;
  external_ref: string | null;
  status: StockBridgeStatus;
  priority: "normal" | "high" | "express";
  total_ht: number;
  total_ttc: number;
  shipping_cost: number;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  shipping_address: StockBridgeAddress;
  created_at: string;
  updated_at: string;
  items?: StockBridgeOrderItem[];
}

export interface StockBridgeOrderItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  sku: string;
  product_name: string;
  quantity: number;
  picked_qty: number;
}

export interface StockBridgeProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price_ht: number;
  tax_rate: number;
  weight_kg: number | null;
  alert_threshold: number;
  is_active: boolean;
  is_fragile: boolean;
  stock_physical: number;
  stock_reserved: number;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockBridgeCreateProductInput {
  sku: string;
  name: string;
  description?: string | null;
  barcode?: string | null;
  price_ht?: number;
  tax_rate?: number;
  weight_kg?: number | null;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  alert_threshold?: number;
  is_fragile?: boolean;
  external_ref?: string | null;
  image_url?: string | null;
}

export class StockBridgeError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "StockBridgeError";
  }
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.length > 0) return Number(v);
  return 0;
}

function toBool(v: unknown): boolean {
  return v === 1 || v === true || v === "1" || v === "true";
}

function normalizeProduct(raw: Record<string, unknown>): StockBridgeProduct {
  return {
    id: String(raw.id),
    sku: String(raw.sku),
    name: String(raw.name),
    description: (raw.description as string | null) ?? null,
    barcode: (raw.barcode as string | null) ?? null,
    price_ht: toNum(raw.price_ht),
    tax_rate: toNum(raw.tax_rate),
    weight_kg: raw.weight_kg == null ? null : toNum(raw.weight_kg),
    alert_threshold: toNum(raw.alert_threshold),
    is_active: toBool(raw.is_active),
    is_fragile: toBool(raw.is_fragile),
    stock_physical: toNum(raw.stock_physical),
    stock_reserved: toNum(raw.stock_reserved),
    is_low_stock: toBool(raw.is_low_stock),
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
  };
}

function normalizeOrderItem(raw: Record<string, unknown>): StockBridgeOrderItem {
  return {
    id: String(raw.id),
    product_id: String(raw.product_id),
    variant_id: (raw.variant_id as string | null) ?? null,
    sku: String(raw.sku),
    product_name: String(raw.product_name),
    quantity: toNum(raw.quantity),
    picked_qty: toNum(raw.picked_qty),
  };
}

function normalizeOrder(raw: Record<string, unknown>): StockBridgeOrder {
  return {
    id: String(raw.id),
    internal_ref: String(raw.internal_ref),
    external_ref: (raw.external_ref as string | null) ?? null,
    status: raw.status as StockBridgeStatus,
    priority: raw.priority as "normal" | "high" | "express",
    total_ht: toNum(raw.total_ht),
    total_ttc: toNum(raw.total_ttc),
    shipping_cost: toNum(raw.shipping_cost),
    tracking_number: (raw.tracking_number as string | null) ?? null,
    shipped_at: (raw.shipped_at as string | null) ?? null,
    delivered_at: (raw.delivered_at as string | null) ?? null,
    shipping_address: raw.shipping_address as StockBridgeAddress,
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    items: Array.isArray(raw.items)
      ? (raw.items as Record<string, unknown>[]).map(normalizeOrderItem)
      : undefined,
  };
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  attempt = 0
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "X-API-Key": apiKey(),
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (res.status === 429 && attempt < 2) {
    const retryAfter = Number(res.headers.get("retry-after")) || 5;
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return request<T>(path, init, attempt + 1);
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = body as { error?: string; message?: string; details?: unknown };
    throw new StockBridgeError(
      res.status,
      err.error || "UNKNOWN",
      err.message || `StockBridge ${res.status}`,
      err.details
    );
  }

  return body as T;
}

export async function createOrder(
  input: StockBridgeCreateOrderInput
): Promise<StockBridgeOrder> {
  const { data } = await request<{ data: Record<string, unknown> }>(
    "/api/v1/orders",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  return normalizeOrder(data);
}

export async function getOrder(id: string): Promise<StockBridgeOrder> {
  const { data } = await request<{ data: Record<string, unknown> }>(
    `/api/v1/orders/${id}`
  );
  return normalizeOrder(data);
}

export async function listOrders(params: {
  page?: number;
  limit?: number;
  status?: StockBridgeStatus;
  from?: string;
  to?: string;
  search?: string;
} = {}): Promise<{ data: StockBridgeOrder[]; meta: { total: number; pages: number } }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  }
  const body = await request<{
    data: Record<string, unknown>[];
    meta: { total: number; pages: number };
  }>(`/api/v1/orders?${qs}`);
  return { data: body.data.map(normalizeOrder), meta: body.meta };
}

export async function createProduct(
  input: StockBridgeCreateProductInput
): Promise<StockBridgeProduct> {
  const { data } = await request<{ data: Record<string, unknown> }>(
    "/api/v1/products",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  return normalizeProduct(data);
}

export async function getProduct(id: string): Promise<StockBridgeProduct> {
  const { data } = await request<{ data: Record<string, unknown> }>(
    `/api/v1/products/${id}`
  );
  return normalizeProduct(data);
}

export async function listProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
} = {}): Promise<{ data: StockBridgeProduct[]; meta: { total: number; pages: number } }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  }
  const body = await request<{
    data: Record<string, unknown>[];
    meta: { total: number; pages: number };
  }>(`/api/v1/products?${qs}`);
  return { data: body.data.map(normalizeProduct), meta: body.meta };
}

// Map StockBridge → our internal status.
// PICKING / PACKING / ACCEPTED collapse to "confirmed" because our enum
// is coarser; the raw status is preserved separately in orders.stockbridgeStatus.
export function mapStockBridgeStatus(
  sb: StockBridgeStatus
): "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned" {
  switch (sb) {
    case "RECEIVED":
      return "pending";
    case "ACCEPTED":
    case "PICKING":
    case "PACKING":
      return "confirmed";
    case "SHIPPED":
      return "shipped";
    case "DELIVERED":
      return "delivered";
    case "RETURNED":
      return "returned";
    case "CANCELLED":
    case "REJECTED":
      return "cancelled";
  }
}
