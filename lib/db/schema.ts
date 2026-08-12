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
  // Automatic promotions are a separate feature from promo codes: at most one
  // of `discountAmount` / `promotionDiscount` is ever non-zero on an order.
  promotionId: integer("promotion_id").references(() => promotions.id),
  promotionSnapshot: text("promotion_snapshot"),
  // Nullable because drizzle-kit can't add a NOT NULL column to a table that
  // already holds rows. Null means the same as 0: no promotion discounted this
  // order. Order creation always writes an explicit number.
  promotionDiscount: real("promotion_discount"),
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
  // Units of this line granted free by a promotion. Covers both shapes:
  // "buy 2 get 1" is quantity 3 / freeQuantity 1, and a free tote alongside a
  // paid one is quantity 2 / freeQuantity 1. Nullable for the same reason as
  // orders.promotionDiscount — null reads as 0, no units were free.
  freeQuantity: integer("free_quantity"),
});

export const promotions = sqliteTable("promotions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type", { enum: ["percentage", "bxgy"] }).notNull(),
  triggerProductId: integer("trigger_product_id")
    .notNull()
    .references(() => products.id),
  triggerQuantity: integer("trigger_quantity").notNull(),
  // Units of the trigger product the cart must hold for this promotion to
  // fire: X + Y for same-product BXGY, X otherwise. The creation-time
  // uniqueness gate keys on (triggerProductId, activationQuantity), so two
  // promotions can never fight over the same cart.
  activationQuantity: integer("activation_quantity").notNull(),
  discountPercent: real("discount_percent"),
  giftProductId: integer("gift_product_id").references(() => products.id),
  giftQuantity: integer("gift_quantity"),
  headline: text("headline").notNull(),
  headlineFr: text("headline_fr").notNull(),
  description: text("description"),
  descriptionFr: text("description_fr"),
  ogImage: text("og_image"),
  startsAt: text("starts_at"),
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
