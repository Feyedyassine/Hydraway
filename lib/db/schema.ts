import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "warehouse", "support"] }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameFr: text("name_fr").notNull(),
  description: text("description"),
  descriptionFr: text("description_fr"),
  price: real("price").notNull(),
  sku: text("sku").unique(),
  stockbridgeProductId: text("stockbridge_product_id").unique(),
  stock: integer("stock").notNull().default(0),
  image: text("image"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["b2c", "b2b"] }).notNull().default("b2c"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  governorate: text("governorate").notNull(),
  postalCode: text("postal_code"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  status: text("status", {
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"],
  })
    .notNull()
    .default("pending"),
  statusHistory: text("status_history").default("[]"),
  paymentMethod: text("payment_method", { enum: ["cod", "flouci", "net30"] }).notNull(),
  orderType: text("order_type", { enum: ["retail", "bulk"] }).notNull().default("retail"),
  paymentStatus: text("payment_status", {
    enum: ["pending", "paid", "failed"],
  })
    .notNull()
    .default("pending"),
  flouciPaymentId: text("flouci_payment_id"),
  stockbridgeOrderId: text("stockbridge_order_id").unique(),
  stockbridgeInternalRef: text("stockbridge_internal_ref"),
  stockbridgeStatus: text("stockbridge_status"),
  stockbridgeError: text("stockbridge_error"),
  trackingNumber: text("tracking_number"),
  shippedAt: text("shipped_at"),
  deliveredAt: text("delivered_at"),
  total: real("total").notNull(),
  shippingFee: real("shipping_fee").notNull().default(9.5),
  promoCodeId: integer("promo_code_id").references(() => promoCodes.id),
  promoCodeSnapshot: text("promo_code_snapshot"),
  discountAmount: real("discount_amount"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const contactMessages = sqliteTable("contact_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["new", "read", "replied"] })
    .notNull()
    .default("new"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const promoCodes = sqliteTable("promo_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["percentage", "fixed"] }).notNull(),
  value: real("value").notNull(),
  maxRedemptions: integer("max_redemptions"),
  redemptionsCount: integer("redemptions_count").notNull().default(0),
  expiresAt: text("expires_at"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
});
