import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const services = pgTable(
  "services",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull(),
    priceCents: integer("price_cents"),
    priceFrom: boolean("price_from").notNull().default(false),
    isAddon: boolean("is_addon").notNull().default(false),
    priceNote: text("price_note").notNull().default(""),
    durationMinutes: integer("duration_minutes").notNull().default(60),
    bookable: boolean("bookable").notNull().default(true),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_services_category").on(table.category, table.sortOrder)],
);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    customerName: text("customer_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    notes: text("notes").notNull().default(""),
    status: text("status").notNull().default("new"),
    totalCents: integer("total_cents").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_orders_created").on(table.createdAt)],
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    priceCents: integer("price_cents").notNull(),
    shape: text("shape").notNull().default("almond"),
    length: text("length").notNull().default("M"),
    colors: text("colors").notNull().default("[]"),
    imageUrl: text("image_url").notNull().default(""),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_products_sort").on(table.sortOrder)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    serviceId: text("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    productId: text("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    serviceName: text("service_name").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull().default(0),
    extraNote: text("extra_note").notNull().default(""),
  },
  (table) => [index("idx_order_items_order").on(table.orderId)],
);

export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    customerName: text("customer_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    serviceId: text("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    serviceName: text("service_name").notNull(),
    startAt: timestamp("start_at", { withTimezone: true, mode: "date" }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true, mode: "date" }).notNull(),
    notes: text("notes").notNull().default(""),
    extras: jsonb("extras").$type<BookingExtra[]>().notNull().default([]),
    status: text("status").notNull().default("pending"),
    source: text("source").notNull().default("site"),
    icalUid: text("ical_uid"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_bookings_start").on(table.startAt),
    index("idx_bookings_status").on(table.status),
  ],
);

export const blockedSlots = pgTable(
  "blocked_slots",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull().default("Non disponibile"),
    startAt: timestamp("start_at", { withTimezone: true, mode: "date" }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true, mode: "date" }).notNull(),
    source: text("source").notNull().default("admin"),
    icalUid: text("ical_uid").unique(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_blocked_start").on(table.startAt)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
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
