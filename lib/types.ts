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
  imageDataUrl?: string;
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
  config: PlatformConfig;
  counters: Record<string, number>;
}
