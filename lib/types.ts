export type Role = "farmer" | "shop_owner" | "shop_staff" | "admin";
export type Lang = "en" | "hi";

export interface Address {
  id: string;
  label: string;
  name: string;
  mobile: string;
  village: string;
  addressLine: string;
  deliveryType: "home" | "field";
  instructions?: string;
}

export interface User {
  id: string;
  role: Role;
  name: string;
  email?: string;
  mobile: string;
  passwordHash: string;
  shopId?: string;
  permissions?: string[];
  language: Lang;
  village?: string;
  addresses: Address[];
  createdAt: string;
}

export type ShopStatus = "Pending" | "Under Review" | "Approved" | "Suspended" | "Rejected";

export interface ShopLicences {
  pesticideNo: string;
  pesticideExpiry: string;
  fertilizerNo: string;
  fertilizerExpiry: string;
  verified: boolean;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  villages: string[];
  status: ShopStatus;
  licences: ShopLicences;
  taxDetails: string;
  deliveryCapable: boolean;
  createdAt: string;
}

export interface PackSize {
  size: string;
  pricePaise: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "Pesticides" | "Fertilizers";
  sku: string;
  packSizes: PackSize[];
  description: string;
  labelInfo: string;
  warnings: string;
  crops: string[];
  active: boolean;
  tileColor: string;
  initials: string;
}

export interface Inventory {
  id: string;
  shopId: string;
  productId: string;
  packSize: string;
  sku: string;
  batch: string;
  expiry: string;
  costPaise: number;
  pricePaise: number;
  stock: number;
  reserved: number;
}

export interface StockMovement {
  id: string;
  shopId: string;
  inventoryId: string;
  productId: string;
  delta: number;
  reason: string;
  actorId: string;
  at: string;
}

export interface CustomerNote {
  text: string;
  at: string;
  by: string;
}

export interface Customer {
  id: string;
  shopId: string;
  customerCode: string;
  name: string;
  mobile: string;
  village: string;
  addresses: Address[];
  consentMarketing: boolean;
  consentRecordedAt?: string;
  notes: CustomerNote[];
  linkedUserId?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  packSize: string;
  qty: number;
  pricePaise: number;
  lineTotalPaise: number;
  costPaise?: number;
}

export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Processing"
  | "Ready for Dispatch"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Unassigned";

export interface Order {
  id: string;
  orderNo: string;
  farmerId?: string;
  customerId?: string;
  customerName: string;
  mobile: string;
  village: string;
  addressLine: string;
  deliveryType: "home" | "field";
  instructions?: string;
  items: OrderItem[];
  itemsTotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  supplyTotalPaise: number;
  commissionPaise: number;
  paymentMethod: "COD" | "Manual";
  paymentStatus: "Pending" | "Confirmed" | "Paid" | "Refunded";
  source: "platform" | "manual";
  shopId?: string;
  status: OrderStatus;
  unassignedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  orderId: string;
  shopId: string;
  status: "Assigned" | "Accepted" | "Rejected";
  score: number;
  reason: string;
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  orderId: string;
  status: string;
  actorId: string;
  actorRole: string;
  note?: string;
  at: string;
}

export interface PlatformConfig {
  commissionPct: number;
  deliveryFeePaise: number;
  taxPct: number;
  refundNote: string;
  lowStockThreshold: number;
  // Phase 2/3 settings (defaults seeded in lib/seed.ts).
  nearExpiryDays: number; // inventory batches expiring within this window are flagged
  subscriptionGraceDays: number; // days after plan expiry before a subscription is Expired
  paymentProvider: "manual" | "razorpay"; // live gateway switches on via env keys, see lib/payments
  upiId: string; // platform UPI id shown for the manual/UPI provider (demo value)
}

export interface TicketResponse {
  by: string;
  byRole: string;
  text: string;
  at: string;
}

export interface Ticket {
  id: string;
  type: "solution" | "support" | "crop";
  farmerId?: string;
  name: string;
  mobile: string;
  crop?: string;
  stage?: string;
  village?: string;
  symptoms?: string;
  description: string;
  imageName?: string;
  imageDataUrl?: string; // legacy Phase 1 storage; new uploads use imageFile
  imageFile?: string; // filename under the uploads dir, served by /api/uploads/[name]
  status: "Open" | "In Progress" | "Closed";
  assignedTo?: string;
  responses: TicketResponse[];
  createdAt: string;
}

export interface Disease {
  id: string;
  crop: string;
  disease: string;
  symptoms: string;
  causes: string;
  prevention: string;
  tileColor: string;
}

export interface Notification {
  id: string;
  shopId?: string;
  userId?: string;
  text: string;
  at: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  at: string;
}

export interface Reminder {
  id: string;
  shopId: string;
  customerId?: string;
  type: "follow-up" | "stock" | "licence" | "service";
  text: string;
  dueDate: string;
  done: boolean;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

// One active password-reset OTP per user. Only the hash is stored.
export interface PasswordOtp {
  id: string;
  userId: string;
  otpHash: string;
  createdAt: string;
  expiresAt: string;
  attempts: number;
}

// ---------- Phase 2: subscription plans & billing ----------

export interface SubscriptionPlan {
  id: string;
  name: string;
  nameHi: string;
  pricePaise: number;
  periodDays: number;
  features: string[];
  featuresHi: string[];
  active: boolean;
  createdAt: string;
}

export type SubscriptionStatus = "Active" | "Grace" | "Expired" | "Cancelled";

export interface ShopSubscription {
  id: string;
  shopId: string;
  planId: string;
  status: SubscriptionStatus;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface BillingRecord {
  id: string;
  shopId: string;
  subscriptionId?: string;
  planId?: string;
  description: string;
  amountPaise: number;
  method: "COD" | "Manual" | "UPI" | "Gateway";
  status: "Pending" | "Confirmed" | "Paid" | "Refunded" | "Failed";
  reference?: string;
  paymentId?: string;
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

// ---------- Phase 3: payments (provider adapter layer, lib/payments) ----------

export type PaymentProviderId = "manual" | "razorpay";

export type PaymentStatus =
  | "Created"
  | "Authorized"
  | "Captured"
  | "Paid"
  | "Failed"
  | "Refunded"
  | "PartiallyRefunded";

export interface PaymentRecord {
  id: string;
  orderId?: string;
  billingId?: string;
  shopId?: string;
  provider: PaymentProviderId;
  providerOrderId?: string;
  providerPaymentId?: string;
  amountPaise: number;
  currency: "INR";
  status: PaymentStatus;
  method?: string; // cod | upi | card | netbanking | manual
  reference?: string; // UPI reference / manual receipt note
  createdAt: string;
  updatedAt: string;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  orderId?: string;
  provider: PaymentProviderId;
  providerRefundId?: string;
  amountPaise: number;
  status: "Initiated" | "Processed" | "Failed";
  reason: string;
  createdAt: string;
}

export interface SettlementRecord {
  id: string;
  shopId: string;
  periodStart: string;
  periodEnd: string;
  grossPaise: number; // delivered order totals in the period
  commissionPaise: number; // platform commission for the period
  supplyPaise: number; // amount due to the shop for the period
  status: "Open" | "Settled";
  createdAt: string;
  settledAt?: string;
}

export interface Store {
  users: User[];
  shops: Shop[];
  products: Product[];
  inventory: Inventory[];
  stockMovements: StockMovement[];
  customers: Customer[];
  orders: Order[];
  assignments: Assignment[];
  statusHistory: StatusHistory[];
  tickets: Ticket[];
  diseases: Disease[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  reminders: Reminder[];
  sessions: Session[];
  passwordOtps: PasswordOtp[];
  config: PlatformConfig;
  counters: Record<string, number>;
  // Phase 2/3 collections
  plans: SubscriptionPlan[];
  subscriptions: ShopSubscription[];
  billingRecords: BillingRecord[];
  payments: PaymentRecord[];
  refunds: RefundRecord[];
  settlements: SettlementRecord[];
}
