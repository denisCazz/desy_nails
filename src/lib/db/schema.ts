import {
  boolean,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

export const services = mysqlTable(
  "services",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull().default(""),
    category: varchar("category", { length: 32 }).notNull(),
    priceCents: int("price_cents"),
    priceFrom: boolean("price_from").notNull().default(false),
    isAddon: boolean("is_addon").notNull().default(false),
    priceNote: varchar("price_note", { length: 255 }).notNull().default(""),
    durationMinutes: int("duration_minutes").notNull().default(60),
    bookable: boolean("bookable").notNull().default(true),
    active: boolean("active").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  },
  (table) => [index("idx_services_category").on(table.category, table.sortOrder)],
);

export const orders = mysqlTable(
  "orders",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }).notNull().default(""),
    notes: text("notes").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("new"),
    totalCents: int("total_cents").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  },
  (table) => [index("idx_orders_created").on(table.createdAt)],
);

export const products = mysqlTable(
  "products",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    priceCents: int("price_cents").notNull(),
    shape: varchar("shape", { length: 32 }).notNull().default("almond"),
    length: varchar("length", { length: 8 }).notNull().default("M"),
    colors: text("colors").notNull(),
    imageUrl: varchar("image_url", { length: 512 }).notNull().default(""),
    active: boolean("active").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  },
  (table) => [index("idx_products_sort").on(table.sortOrder)],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    orderId: varchar("order_id", { length: 64 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    serviceId: varchar("service_id", { length: 64 }).references(() => services.id, {
      onDelete: "set null",
    }),
    productId: varchar("product_id", { length: 64 }).references(() => products.id, {
      onDelete: "set null",
    }),
    serviceName: varchar("service_name", { length: 255 }).notNull(),
    quantity: int("quantity").notNull().default(1),
    unitPriceCents: int("unit_price_cents").notNull().default(0),
    extraNote: varchar("extra_note", { length: 255 }).notNull().default(""),
  },
  (table) => [index("idx_order_items_order").on(table.orderId)],
);

export const bookings = mysqlTable(
  "bookings",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }).notNull().default(""),
    serviceId: varchar("service_id", { length: 64 }).references(() => services.id, {
      onDelete: "set null",
    }),
    serviceName: varchar("service_name", { length: 255 }).notNull(),
    startAt: datetime("start_at", { mode: "date", fsp: 3 }).notNull(),
    endAt: datetime("end_at", { mode: "date", fsp: 3 }).notNull(),
    notes: text("notes").notNull(),
    extras: json("extras").$type<BookingExtra[]>().notNull(),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    source: varchar("source", { length: 32 }).notNull().default("site"),
    icalUid: varchar("ical_uid", { length: 255 }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_bookings_start").on(table.startAt),
    index("idx_bookings_status").on(table.status),
  ],
);

export const blockedSlots = mysqlTable(
  "blocked_slots",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    title: varchar("title", { length: 255 }).notNull().default("Non disponibile"),
    startAt: datetime("start_at", { mode: "date", fsp: 3 }).notNull(),
    endAt: datetime("end_at", { mode: "date", fsp: 3 }).notNull(),
    source: varchar("source", { length: 32 }).notNull().default("admin"),
    icalUid: varchar("ical_uid", { length: 255 }).unique(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).notNull().defaultNow(),
  },
  (table) => [index("idx_blocked_start").on(table.startAt)],
);

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
});

export type BookingExtra = {
  id: string;
  name: string;
  priceCents: number;
  quantity: number;
};

export type Service = typeof services.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BlockedSlot = typeof blockedSlots.$inferSelect;
