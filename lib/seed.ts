import { hashPassword, uid } from "./password";
import type {
  Customer,
  Disease,
  Inventory,
  Order,
  Product,
  Shop,
  Store,
  User,
} from "./types";

// All seed records are fictional demo data for local development.
export { VILLAGES } from "./villages";

const now = new Date();
function daysAgo(days: number, hour = 10): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

export function buildSeed(): Store {
  const store: Store = {
    users: [],
    shops: [],
    products: [],
    inventory: [],
    stockMovements: [],
    customers: [],
    orders: [],
    assignments: [],
    statusHistory: [],
    tickets: [],
    diseases: [],
    notifications: [],
    auditLogs: [],
    reminders: [],
    sessions: [],
    plans: [],
    subscriptions: [],
    billingRecords: [],
    payments: [],
    refunds: [],
    settlements: [],
    config: {
      commissionPct: 8,
      deliveryFeePaise: 4900,
      taxPct: 5,
      refundNote:
        "Refunds for cancelled orders are processed to the original payment method within 7 working days after the shop confirms return of the goods in sealed condition.",
      lowStockThreshold: 5,
      nearExpiryDays: 45,
      subscriptionGraceDays: 7,
      paymentProvider: "manual",
      upiId: "kisankendra@demoupi",
    },
    counters: { order: 1000, customerA: 100, customerB: 100, ticket: 100 },
  };

  // ---------- Shops ----------
  const shopA: Shop = {
    id: "shop_a",
    name: "Sharma Krishi Seva Kendra",
    ownerName: "Anil Sharma",
    mobile: "9822011101",
    email: "shopa@kisankendra.in",
    address: "Main Road, Seoni Malwa, Narmadapuram, MP 461223",
    villages: ["Seoni Malwa", "Babai", "Semri Harchand", "Timarni"],
    status: "Approved",
    licences: {
      pesticideNo: "PEST/MP/2019/1142",
      pesticideExpiry: "2027-03-31",
      fertilizerNo: "FERT/MP/2019/0873",
      fertilizerExpiry: "2027-03-31",
      verified: true,
    },
    taxDetails: "GSTIN 23ABCDE1234F1Z5 (demo)",
    deliveryCapable: true,
    createdAt: daysAgo(90),
  };
  const shopB: Shop = {
    id: "shop_b",
    name: "Verma Agro Centre",
    ownerName: "Sunil Verma",
    mobile: "9822011102",
    email: "shopb@kisankendra.in",
    address: "Station Road, Timarni, Harda, MP 461228",
    villages: ["Timarni", "Seoni Malwa", "Dolriya Kalan", "Hoshangabad"],
    status: "Approved",
    licences: {
      pesticideNo: "PEST/MP/2020/2210",
      pesticideExpiry: "2026-11-30",
      fertilizerNo: "FERT/MP/2020/1564",
      fertilizerExpiry: "2026-11-30",
      verified: true,
    },
    taxDetails: "GSTIN 23FGHIJ5678K1Z2 (demo)",
    deliveryCapable: true,
    createdAt: daysAgo(80),
  };
  const shopC: Shop = {
    id: "shop_c",
    name: "New Agro Point",
    ownerName: "Kailash Yadav",
    mobile: "9822011103",
    email: "shopc@kisankendra.in",
    address: "Bus Stand Road, Babai, Narmadapuram, MP 461661",
    villages: ["Babai"],
    status: "Pending",
    licences: {
      pesticideNo: "PEST/MP/2026/0091",
      pesticideExpiry: "2028-01-31",
      fertilizerNo: "FERT/MP/2026/0102",
      fertilizerExpiry: "2028-01-31",
      verified: false,
    },
    taxDetails: "GSTIN applied (demo)",
    deliveryCapable: false,
    createdAt: daysAgo(2),
  };
  store.shops.push(shopA, shopB, shopC);

  // ---------- Users ----------
  const mkUser = (u: Partial<User> & { password: string }): User => {
    const { password, ...rest } = u;
    return {
      id: uid("user_"),
      role: "farmer",
      name: "",
      mobile: "",
      language: "en",
      addresses: [],
      createdAt: daysAgo(60),
      ...rest,
      passwordHash: hashPassword(password),
    } as User;
  };

  store.users.push(
    mkUser({
      id: "user_admin",
      role: "admin",
      name: "Kisankendra Admin (Demo)",
      email: "admin@kisankendra.in",
      mobile: "9000000001",
      password: "admin123",
    }),
    mkUser({
      id: "user_farmer",
      role: "farmer",
      name: "Ramesh Patel",
      email: "ramesh@demo.in",
      mobile: "9876543210",
      password: "farmer123",
      village: "Seoni Malwa",
      addresses: [
        {
          id: "addr_1",
          label: "Home",
          name: "Ramesh Patel",
          mobile: "9876543210",
          village: "Seoni Malwa",
          addressLine: "Ward 5, Near Bus Stand, Seoni Malwa",
          deliveryType: "home",
        },
      ],
    }),
    mkUser({
      id: "user_shopa",
      role: "shop_owner",
      name: "Anil Sharma",
      email: "shopa@kisankendra.in",
      mobile: "9822011101",
      password: "shop123",
      shopId: "shop_a",
    }),
    mkUser({
      id: "user_staffa",
      role: "shop_staff",
      name: "Deepak (Staff, Shop A)",
      email: "staffa@kisankendra.in",
      mobile: "9822011104",
      password: "staff123",
      shopId: "shop_a",
      permissions: ["orders", "customers"],
    }),
    mkUser({
      id: "user_shopb",
      role: "shop_owner",
      name: "Sunil Verma",
      email: "shopb@kisankendra.in",
      mobile: "9822011102",
      password: "shop123",
      shopId: "shop_b",
    }),
    mkUser({
      id: "user_shopc",
      role: "shop_owner",
      name: "Kailash Yadav",
      email: "shopc@kisankendra.in",
      mobile: "9822011103",
      password: "shop123",
      shopId: "shop_c",
    })
  );

  // ---------- Products (fictional brands and labels) ----------
  const P = (
    id: string,
    name: string,
    brand: string,
    category: Product["category"],
    sku: string,
    packs: [string, number][],
    crops: string[],
    tileColor: string,
    initials: string,
    description: string,
    labelInfo: string,
    warnings: string
  ): Product => ({
    id,
    name,
    brand,
    category,
    sku,
    packSizes: packs.map(([size, pricePaise]) => ({ size, pricePaise })),
    crops,
    tileColor,
    initials,
    description,
    labelInfo,
    warnings,
    active: true,
  });

  const labelGeneric =
    "Fictional demo label. Always read the printed product label before use and follow the directions given on the label pack. Keep the original labelled container for reference.";
  const warnGeneric =
    "Keep out of reach of children. Store in a cool, dry place away from food and fodder. This is fictional demo safety text, not a real product warning.";

  store.products.push(
    P("prod_1", "KisanShield EC Insecticide", "FasalRaksha", "Pesticides", "KS-EC-500",
      [["250 ml", 34900], ["500 ml", 64900], ["1 L", 119900]], ["Soybean", "Cotton"], "#2E7D32", "KS",
      "Broad-spectrum insecticide emulsion concentrate for sucking pests in the listed crops (fictional demo product).",
      labelGeneric + " Demo label direction: mix as printed on the pack label and spray with adequate water coverage.",
      warnGeneric + " Avoid spraying during peak bee activity as printed on the label."),
    P("prod_2", "FasalRaksha Systemic Insecticide", "FasalRaksha", "Pesticides", "FR-SI-100",
      [["100 g", 28900], ["250 g", 64900]], ["Paddy", "Soybean"], "#558B2F", "FR",
      "Systemic insecticide granules for early-season pest management (fictional demo product).",
      labelGeneric + " Demo label direction: apply at the rate printed on the pack label only.",
      warnGeneric),
    P("prod_3", "UrvaraGold Urea 46% N", "UrvaraGold", "Fertilizers", "UG-UR-45",
      [["45 kg bag", 26650]], ["Wheat", "Paddy", "Maize"], "#F57C00", "UG",
      "Nitrogen fertilizer, 46% N urea in a 45 kg bag (fictional demo listing; urea is a price-controlled fertilizer in India).",
      labelGeneric + " Demo label direction: apply in split doses as recommended for the crop and soil test report.",
      warnGeneric),
    P("prod_4", "UrvaraGold DAP 18-46-0", "UrvaraGold", "Fertilizers", "UG-DAP-50",
      [["50 kg bag", 135000]], ["Wheat", "Soybean", "Maize"], "#EF6C00", "UD",
      "Di-ammonium phosphate fertilizer for basal application (fictional demo product).",
      labelGeneric + " Demo label direction: apply at sowing as printed on the bag.",
      warnGeneric),
    P("prod_5", "KhetSuraksha Fungicide WP", "FasalRaksha", "Pesticides", "KH-FW-250",
      [["250 g", 42900], ["500 g", 79900]], ["Soybean", "Paddy", "Vegetables"], "#00838F", "KH",
      "Wettable powder fungicide for leaf spot and blight management (fictional demo product).",
      labelGeneric + " Demo label direction: mix and spray as printed on the pack label; observe the waiting period printed on the label.",
      warnGeneric + " Do not harvest before the label waiting period ends."),
    P("prod_6", "Ankur MOP Potash 60%", "UrvaraGold", "Fertilizers", "AN-MOP-50",
      [["50 kg bag", 170000]], ["Banana", "Vegetables", "Soybean"], "#6A1B9A", "AN",
      "Muriate of potash fertilizer for fruit quality and stress tolerance (fictional demo product).",
      labelGeneric + " Demo label direction: apply as per soil test based recommendation printed on the bag.",
      warnGeneric),
    P("prod_7", "HerbiClear Selective Herbicide", "FasalRaksha", "Pesticides", "HC-SH-400",
      [["400 ml", 54900], ["1 L", 124900]], ["Soybean", "Wheat"], "#4527A0", "HC",
      "Selective post-emergence herbicide for broadleaf weeds (fictional demo product).",
      labelGeneric + " Demo label direction: spray on actively growing weeds as printed on the pack label.",
      warnGeneric + " Avoid drift to neighbouring sensitive crops."),
    P("prod_8", "Jaivik Jeevamrut Bio-Stimulant", "UrvaraGold", "Fertilizers", "UG-BIO-1",
      [["1 L", 39900], ["5 L", 174900]], ["All crops"], "#33691E", "JJ",
      "Organic bio-stimulant for soil microbial activity (fictional demo product).",
      labelGeneric + " Demo label direction: drench or drip as printed on the bottle label.",
      warnGeneric),
    P("prod_9", "KisanShield Pro Seed Treatment", "FasalRaksha", "Pesticides", "KS-ST-100",
      [["100 ml", 25900]], ["Soybean", "Wheat", "Gram"], "#AD1457", "SP",
      "Seed treatment formulation to protect germinating seed (fictional demo product).",
      labelGeneric + " Demo label direction: treat seed at the rate printed on the pack label and dry in shade before sowing.",
      warnGeneric + " Treated seed must never be used as food or fodder."),
    P("prod_10", "UrvaraGold NPK 19-19-19", "UrvaraGold", "Fertilizers", "UG-NPK-1",
      [["1 kg", 18900], ["25 kg bag", 399900]], ["Vegetables", "Cotton", "Banana"], "#0277BD", "NP",
      "Fully water-soluble NPK 19:19:19 for fertigation and foliar use (fictional demo product).",
      labelGeneric + " Demo label direction: dissolve and apply as printed on the pack label.",
      warnGeneric),
    P("prod_11", "NeemRaksha Neem Oil 1500 ppm", "FasalRaksha", "Pesticides", "NR-NO-500",
      [["500 ml", 32900], ["1 L", 59900]], ["Vegetables", "Pulses"], "#827717", "NR",
      "Neem oil based botanical insecticide (fictional demo product).",
      labelGeneric + " Demo label direction: spray in the evening as printed on the bottle label.",
      warnGeneric),
    P("prod_12", "UrvaraGold Zinc Sulphate 33%", "UrvaraGold", "Fertilizers", "UG-ZN-5",
      [["5 kg", 44900]], ["Paddy", "Wheat", "Maize"], "#4E342E", "ZN",
      "Zinc sulphate micronutrient fertilizer for zinc-deficient soils (fictional demo product).",
      labelGeneric + " Demo label direction: apply as per soil test recommendation printed on the bag.",
      warnGeneric),
    P("prod_13", "FasalRaksha TermiteGuard SC", "FasalRaksha", "Pesticides", "FR-TG-250",
      [["250 ml", 47900]], ["Sugarcane", "Wheat"], "#5D4037", "TG",
      "Soil insecticide suspension concentrate for termite-prone fields (fictional demo product).",
      labelGeneric + " Demo label direction: apply with irrigation water as printed on the pack label.",
      warnGeneric),
    P("prod_14", "UrvaraGold SSP Single Super Phosphate", "UrvaraGold", "Fertilizers", "UG-SSP-50",
      [["50 kg bag", 49900]], ["Oilseeds", "Pulses"], "#78909C", "SS",
      "Single super phosphate with sulphur and calcium (fictional demo product).",
      labelGeneric + " Demo label direction: apply at land preparation as printed on the bag.",
      warnGeneric)
  );

  // ---------- Inventory ----------
  // cost = roughly 88% of selling price for demo margins.
  const inv = (
    shopId: string,
    productId: string,
    packSize: string,
    stock: number,
    batch: string,
    expiry: string
  ): Inventory => {
    const product = store.products.find((p) => p.id === productId)!;
    const pack = product.packSizes.find((p) => p.size === packSize) ?? product.packSizes[0];
    return {
      id: uid("inv_"),
      shopId,
      productId,
      packSize: pack.size,
      sku: product.sku,
      batch,
      expiry,
      costPaise: Math.round(pack.pricePaise * 0.88),
      pricePaise: pack.pricePaise,
      stock,
      reserved: 0,
    };
  };

  // Shop A inventory: broad stock. prod_7 out of stock at A, prod_2 low stock at A.
  store.inventory.push(
    inv("shop_a", "prod_1", "500 ml", 40, "A-2401", "2027-06-30"),
    inv("shop_a", "prod_2", "100 g", 3, "A-2402", "2026-12-31"),
    inv("shop_a", "prod_3", "45 kg bag", 120, "A-2403", "2028-01-31"),
    inv("shop_a", "prod_4", "50 kg bag", 60, "A-2404", "2027-09-30"),
    inv("shop_a", "prod_5", "250 g", 25, "A-2405", "2027-03-31"),
    inv("shop_a", "prod_6", "50 kg bag", 15, "A-2406", "2027-08-31"),
    inv("shop_a", "prod_7", "400 ml", 0, "A-2407", "2027-05-31"),
    inv("shop_a", "prod_8", "1 L", 30, "A-2408", "2026-10-31"),
    inv("shop_a", "prod_10", "1 kg", 50, "A-2410", "2027-04-30"),
    inv("shop_a", "prod_12", "5 kg", 22, "A-2412", "2027-07-31"),
    inv("shop_a", "prod_14", "50 kg bag", 45, "A-2414", "2027-10-31")
  );
  // Shop B inventory: stocks prod_7 (out of stock at A) and a different mix.
  store.inventory.push(
    inv("shop_b", "prod_1", "500 ml", 18, "B-1180", "2027-02-28"),
    inv("shop_b", "prod_3", "45 kg bag", 80, "B-1181", "2028-01-31"),
    inv("shop_b", "prod_5", "250 g", 12, "B-1182", "2027-01-31"),
    inv("shop_b", "prod_7", "400 ml", 20, "B-1183", "2027-05-31"),
    inv("shop_b", "prod_9", "100 ml", 35, "B-1184", "2027-06-30"),
    inv("shop_b", "prod_11", "500 ml", 28, "B-1185", "2026-12-31"),
    inv("shop_b", "prod_13", "250 ml", 9, "B-1186", "2027-03-31"),
    inv("shop_b", "prod_4", "50 kg bag", 25, "B-1187", "2027-09-30")
  );

  // Phase 2: multi-batch rows — the same product/pack held as separate
  // batches with different expiry dates (FEFO consumption), one near-expiry
  // batch and one already-expired batch for the alerts demo.
  store.inventory.push(
    inv("shop_a", "prod_1", "500 ml", 12, "A-2511", "2026-11-20"), // second batch, near expiry
    inv("shop_a", "prod_2", "100 g", 6, "A-2390", "2026-08-31"), // expired batch (excluded from saleable stock)
    inv("shop_b", "prod_11", "500 ml", 10, "B-1201", "2026-11-05") // near-expiry batch
  );

  // ---------- A second demo farmer (served by Shop B side) ----------
  store.users.push(
    mkUser({
      id: "user_farmer2",
      role: "farmer",
      name: "Sunita Bai",
      email: "sunita@demo.in",
      mobile: "9876501234",
      password: "farmer123",
      village: "Timarni",
      addresses: [
        {
          id: "addr_2",
          label: "Home",
          name: "Sunita Bai",
          mobile: "9876501234",
          village: "Timarni",
          addressLine: "House 22, Gandhi Chowk, Timarni",
          deliveryType: "home",
        },
      ],
    })
  );

  // ---------- Shop CRM customers (fictional) ----------
  const cust = (
    shopId: string,
    code: string,
    name: string,
    mobile: string,
    village: string,
    linkedUserId?: string,
    note?: string
  ): Customer => ({
    id: uid("cust_"),
    shopId,
    customerCode: code,
    name,
    mobile,
    village,
    addresses: [
      {
        id: uid("addr_"),
        label: "Home",
        name,
        mobile,
        village,
        addressLine: `${village} (demo address)`,
        deliveryType: "home",
      },
    ],
    consentMarketing: false,
    notes: note ? [{ text: note, at: daysAgo(10), by: "Shop owner" }] : [],
    linkedUserId,
    createdAt: daysAgo(45),
  });

  const custA1 = cust("shop_a", "KKA-101", "Ramesh Patel", "9876543210", "Seoni Malwa", "user_farmer", "Prefers morning delivery.");
  const custA2 = cust("shop_a", "KKA-102", "Mohan Gond", "9812345001", "Seoni Malwa");
  const custA3 = cust("shop_a", "KKA-103", "Seeta Bai", "9812345002", "Babai");
  const custA4 = cust("shop_a", "KKA-104", "Arvind Raghuwanshi", "9812345003", "Semri Harchand");
  const custA5 = cust("shop_a", "KKA-105", "Prakash Meena", "9812345004", "Seoni Malwa");
  const custA6 = cust("shop_a", "KKA-106", "Kamla Devi", "9812345005", "Babai");
  const custB1 = cust("shop_b", "KKB-101", "Sunita Bai", "9876501234", "Timarni", "user_farmer2");
  const custB2 = cust("shop_b", "KKB-102", "Vijay Kumar", "9812345101", "Timarni");
  const custB3 = cust("shop_b", "KKB-103", "Rakesh Sahu", "9812345102", "Dolriya Kalan");
  const custB4 = cust("shop_b", "KKB-104", "Geeta Verma", "9812345103", "Hoshangabad");
  const custB5 = cust("shop_b", "KKB-105", "Nandu Prasad", "9812345104", "Timarni");
  store.customers.push(custA1, custA2, custA3, custA4, custA5, custA6, custB1, custB2, custB3, custB4, custB5);

  // ---------- Historical + live orders ----------
  const hist = (orderId: string, status: string, actorId: string, role: string, at: string, note?: string) => {
    store.statusHistory.push({ id: uid("hist_"), orderId, status, actorId, actorRole: role, note, at });
  };

  const order1: Order = {
    id: "order_1",
    orderNo: "KK-ORD-1001",
    farmerId: "user_farmer",
    customerId: custA1.id,
    customerName: "Ramesh Patel",
    mobile: "9876543210",
    village: "Seoni Malwa",
    addressLine: "Ward 5, Near Bus Stand, Seoni Malwa",
    deliveryType: "home",
    items: [
      { productId: "prod_3", productName: "UrvaraGold Urea 46% N", packSize: "45 kg bag", qty: 2, pricePaise: 26650, lineTotalPaise: 53300, costPaise: 23452 },
    ],
    itemsTotalPaise: 53300,
    deliveryFeePaise: 4900,
    taxPaise: 2665,
    totalPaise: 60865,
    supplyTotalPaise: 46904,
    commissionPaise: 4264,
    paymentMethod: "COD",
    paymentStatus: "Paid",
    source: "platform",
    shopId: "shop_a",
    status: "Delivered",
    createdAt: daysAgo(5, 9),
    updatedAt: daysAgo(5, 16),
  };
  const order2: Order = {
    id: "order_2",
    orderNo: "KK-ORD-1002",
    farmerId: "user_farmer2",
    customerId: custB1.id,
    customerName: "Sunita Bai",
    mobile: "9876501234",
    village: "Timarni",
    addressLine: "House 22, Gandhi Chowk, Timarni",
    deliveryType: "field",
    items: [
      { productId: "prod_7", productName: "HerbiClear Selective Herbicide", packSize: "400 ml", qty: 1, pricePaise: 54900, lineTotalPaise: 54900, costPaise: 48312 },
      { productId: "prod_9", productName: "KisanShield Pro Seed Treatment", packSize: "100 ml", qty: 2, pricePaise: 25900, lineTotalPaise: 51800, costPaise: 22792 },
    ],
    itemsTotalPaise: 106700,
    deliveryFeePaise: 4900,
    taxPaise: 5335,
    totalPaise: 116935,
    supplyTotalPaise: 93896,
    commissionPaise: 8536,
    paymentMethod: "COD",
    paymentStatus: "Paid",
    source: "platform",
    shopId: "shop_b",
    status: "Delivered",
    createdAt: daysAgo(12, 11),
    updatedAt: daysAgo(12, 17),
  };
  const order3: Order = {
    id: "order_3",
    orderNo: "KK-ORD-1003",
    customerId: custA2.id,
    customerName: "Mohan Gond",
    mobile: "9812345001",
    village: "Seoni Malwa",
    addressLine: "Walk-in at shop",
    deliveryType: "home",
    items: [
      { productId: "prod_10", productName: "UrvaraGold NPK 19-19-19", packSize: "1 kg", qty: 3, pricePaise: 18900, lineTotalPaise: 56700, costPaise: 16632 },
    ],
    itemsTotalPaise: 56700,
    deliveryFeePaise: 0,
    taxPaise: 2835,
    totalPaise: 59535,
    supplyTotalPaise: 49896,
    commissionPaise: 0,
    paymentMethod: "Manual",
    paymentStatus: "Paid",
    source: "manual",
    shopId: "shop_a",
    status: "Delivered",
    createdAt: daysAgo(3, 12),
    updatedAt: daysAgo(3, 12),
  };
  const order4: Order = {
    id: "order_4",
    orderNo: "KK-ORD-1004",
    farmerId: "user_farmer",
    customerId: custA1.id,
    customerName: "Ramesh Patel",
    mobile: "9876543210",
    village: "Seoni Malwa",
    addressLine: "Ward 5, Near Bus Stand, Seoni Malwa",
    deliveryType: "home",
    items: [
      { productId: "prod_1", productName: "KisanShield EC Insecticide", packSize: "500 ml", qty: 1, pricePaise: 64900, lineTotalPaise: 64900, costPaise: 57112 },
    ],
    itemsTotalPaise: 64900,
    deliveryFeePaise: 4900,
    taxPaise: 3245,
    totalPaise: 73045,
    supplyTotalPaise: 57112,
    commissionPaise: 5192,
    paymentMethod: "COD",
    paymentStatus: "Pending",
    source: "platform",
    shopId: "shop_a",
    status: "Pending",
    createdAt: daysAgo(0, 8),
    updatedAt: daysAgo(0, 8),
  };
  store.orders.push(order1, order2, order3, order4);
  store.counters.order = 1004;

  // Reserve stock for the live pending order (order_4).
  const invA1 = store.inventory.find((i) => i.shopId === "shop_a" && i.productId === "prod_1");
  if (invA1) invA1.reserved = 1;

  store.assignments.push(
    { id: uid("asg_"), orderId: "order_1", shopId: "shop_a", status: "Accepted", score: 100, reason: "Seeded history", createdAt: daysAgo(5, 9) },
    { id: uid("asg_"), orderId: "order_2", shopId: "shop_b", status: "Accepted", score: 100, reason: "Seeded history", createdAt: daysAgo(12, 11) },
    { id: uid("asg_"), orderId: "order_4", shopId: "shop_a", status: "Assigned", score: 92, reason: "Full stock, village priority 1, open orders 0", createdAt: daysAgo(0, 8) }
  );
  hist("order_1", "Pending", "user_farmer", "farmer", daysAgo(5, 9), "Order placed");
  hist("order_1", "Accepted", "user_shopa", "shop_owner", daysAgo(5, 10));
  hist("order_1", "Delivered", "user_shopa", "shop_owner", daysAgo(5, 16));
  hist("order_2", "Pending", "user_farmer2", "farmer", daysAgo(12, 11), "Order placed");
  hist("order_2", "Delivered", "user_shopb", "shop_owner", daysAgo(12, 17));
  hist("order_3", "Delivered", "user_shopa", "shop_owner", daysAgo(3, 12), "Walk-in sale recorded by shop");
  hist("order_4", "Pending", "user_farmer", "farmer", daysAgo(0, 8), "Order placed, assigned to Sharma Krishi Seva Kendra");

  store.notifications.push({
    id: uid("ntf_"),
    shopId: "shop_a",
    text: "New order KK-ORD-1004 assigned to your shop (demo seed).",
    at: daysAgo(0, 8),
    read: false,
  });

  // ---------- Disease library (curated reference information) ----------
  const D = (crop: string, disease: string, symptoms: string, causes: string, prevention: string, tileColor: string): Disease => ({
    id: uid("dis_"),
    crop,
    disease,
    symptoms,
    causes,
    prevention,
    tileColor,
  });
  store.diseases.push(
    D("Soybean", "Yellow Mosaic Virus", "Yellow-green mosaic patches on leaves, stunted plants, fewer pods.", "Virus transmitted by whitefly.", "Grow resistant varieties, control whitefly, remove and destroy infected plants early, avoid late sowing.", "#F9A825"),
    D("Soybean", "Rust", "Small reddish-brown pustules on the underside of leaves, premature leaf fall.", "Fungal spores spread by wind in humid weather.", "Scout fields weekly in humid weather, use resistant varieties, and follow local agriculture department advisories for fungicide use.", "#8D6E63"),
    D("Paddy", "Blast", "Spindle-shaped spots with grey centres on leaves; neck rot at panicle stage.", "Fungus favoured by high nitrogen and leaf wetness.", "Balanced nitrogen use, resistant varieties, treat seed, and consult the local agriculture office for current recommendations.", "#00838F"),
    D("Paddy", "Bacterial Leaf Blight", "Water-soaked streaks from leaf tips turning yellow-white, leaves dry from margins.", "Bacteria spread through irrigation water and storms.", "Use clean seed, avoid excess nitrogen, drain fields after storms, choose tolerant varieties.", "#7CB342"),
    D("Wheat", "Yellow (Stripe) Rust", "Yellow-orange powdery stripes along leaf veins, mainly in cool weather.", "Wind-borne fungal spores, cool humid conditions.", "Grow resistant varieties, monitor from tillering stage, report severe outbreaks to the agriculture department.", "#FB8C00"),
    D("Cotton", "Pink Bollworm", "Larvae inside flowers and bolls, rosette flowers, damaged lint.", "Moth lays eggs on flowers and young bolls.", "Install pheromone traps, destroy crop residue after harvest, avoid ratoon cotton, follow IPM advisories.", "#EC407A"),
    D("Soybean", "Girdle Beetle", "Ring-like cut around the stem, wilting of the upper plant portion.", "Beetle girdles the stem to lay eggs inside.", "Remove and destroy affected plants, deep summer ploughing, timely sowing.", "#5E35B1"),
    D("Maize", "Fall Armyworm", "Ragged holes in whorl leaves, sawdust-like frass, larvae with inverted Y mark on head.", "Migratory moth pest spreading rapidly.", "Scout twice a week, install traps, encourage natural enemies, follow current ICAR/state advisories.", "#3949AB"),
    D("Gram (Chana)", "Fusarium Wilt", "Plants wilt and dry in patches, roots show dark internal discoloration when split.", "Soil-borne fungus surviving in crop debris.", "Long crop rotation, wilt-resistant varieties, treat seed, avoid waterlogging.", "#6D4C41"),
    D("Chilli", "Leaf Curl Virus", "Leaves curl upward, become small and crinkled, plants stunted with few fruits.", "Virus carried by whitefly and thrips.", "Use virus-free seedlings, control vectors with IPM, remove severely infected plants, use reflective mulch.", "#C62828")
  );

  // ---------- Phase 2: subscription plans, subscriptions, billing ----------
  const planBasic = {
    id: "plan_basic",
    name: "Basic (Pilot)",
    nameHi: "बेसिक (पायलट)",
    pricePaise: 0,
    periodDays: 30,
    features: ["Order management", "Customer book", "Basic stock list"],
    featuresHi: ["ऑर्डर प्रबंधन", "ग्राहक बही", "साधारण स्टॉक सूची"],
    active: true,
    createdAt: daysAgo(60),
  };
  const planGrowth = {
    id: "plan_growth",
    name: "Growth",
    nameHi: "ग्रोथ",
    pricePaise: 49900,
    periodDays: 30,
    features: ["Everything in Basic", "Batch & expiry tracking", "Sales, margin & reconciliation reports", "Stock alerts"],
    featuresHi: ["बेसिक की सभी सुविधाएँ", "बैच व समाप्ति ट्रैकिंग", "बिक्री, लाभ व मिलान रिपोर्ट", "स्टॉक चेतावनी"],
    active: true,
    createdAt: daysAgo(60),
  };
  const planPro = {
    id: "plan_pro",
    name: "Pro (Quarterly)",
    nameHi: "प्रो (तिमाही)",
    pricePaise: 99900,
    periodDays: 90,
    features: ["Everything in Growth", "Advanced analytics", "Priority support", "Multi-staff accounts"],
    featuresHi: ["ग्रोथ की सभी सुविधाएँ", "उन्नत विश्लेषण", "प्राथमिकता सहायता", "एकाधिक कर्मचारी खाते"],
    active: true,
    createdAt: daysAgo(60),
  };
  store.plans.push(planBasic, planGrowth, planPro);

  store.subscriptions.push(
    {
      id: "sub_shop_a",
      shopId: "shop_a",
      planId: "plan_growth",
      status: "Active",
      startsAt: daysAgo(20),
      expiresAt: daysAgo(-10),
      createdAt: daysAgo(20),
    },
    {
      id: "sub_shop_b",
      shopId: "shop_b",
      planId: "plan_basic",
      status: "Active",
      startsAt: daysAgo(15),
      expiresAt: daysAgo(-15),
      createdAt: daysAgo(15),
    }
  );

  store.billingRecords.push(
    {
      id: "bill_a1",
      shopId: "shop_a",
      subscriptionId: "sub_shop_a",
      planId: "plan_growth",
      description: "Growth plan — 30 days",
      amountPaise: 49900,
      method: "Manual",
      status: "Paid",
      reference: "Counter receipt 118 (demo)",
      paymentId: "pay_bill_a1",
      createdAt: daysAgo(20),
      confirmedAt: daysAgo(20),
      confirmedBy: "user_admin",
    },
    {
      id: "bill_b1",
      shopId: "shop_b",
      subscriptionId: "sub_shop_b",
      planId: "plan_basic",
      description: "Basic (Pilot) plan — 30 days",
      amountPaise: 0,
      method: "Manual",
      status: "Paid",
      reference: "Free pilot plan",
      createdAt: daysAgo(15),
      confirmedAt: daysAgo(15),
      confirmedBy: "user_admin",
    }
  );

  // ---------- Phase 3: payment + settlement records for seeded orders ----------
  store.payments.push(
    {
      id: "pay_bill_a1",
      billingId: "bill_a1",
      shopId: "shop_a",
      provider: "manual",
      amountPaise: 49900,
      currency: "INR",
      status: "Paid",
      method: "manual",
      reference: "Counter receipt 118 (demo)",
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      id: "pay_ord_1",
      orderId: "order_1",
      shopId: "shop_a",
      provider: "manual",
      amountPaise: 60865,
      currency: "INR",
      status: "Paid",
      method: "cod",
      reference: "Cash collected on delivery (demo)",
      createdAt: daysAgo(5, 16),
      updatedAt: daysAgo(5, 16),
    },
    {
      id: "pay_ord_2",
      orderId: "order_2",
      shopId: "shop_b",
      provider: "manual",
      amountPaise: 116935,
      currency: "INR",
      status: "Paid",
      method: "cod",
      reference: "Cash collected on delivery (demo)",
      createdAt: daysAgo(12, 17),
      updatedAt: daysAgo(12, 17),
    },
    {
      id: "pay_ord_3",
      orderId: "order_3",
      shopId: "shop_a",
      provider: "manual",
      amountPaise: 59535,
      currency: "INR",
      status: "Paid",
      method: "manual",
      reference: "Paid at shop counter (demo)",
      createdAt: daysAgo(3, 12),
      updatedAt: daysAgo(3, 12),
    }
  );

  store.settlements.push(
    {
      id: "stl_b_sep",
      shopId: "shop_b",
      periodStart: daysAgo(30),
      periodEnd: daysAgo(1),
      grossPaise: 116935,
      commissionPaise: 8536,
      supplyPaise: 93896,
      status: "Settled",
      createdAt: daysAgo(1),
      settledAt: daysAgo(1),
    },
    {
      id: "stl_a_open",
      shopId: "shop_a",
      periodStart: daysAgo(30),
      periodEnd: daysAgo(1),
      grossPaise: 120400,
      commissionPaise: 4264,
      supplyPaise: 96800,
      status: "Open",
      createdAt: daysAgo(1),
    }
  );

  // ---------- Phase 3: richer order history for analytics (last 30 days) ----------
  const priceOf = (pid: string, pack: string): { price: number; cost: number; name: string } => {
    const p = store.products.find((x) => x.id === pid)!;
    const pk = p.packSizes.find((x) => x.size === pack) ?? p.packSizes[0];
    return { price: pk.pricePaise, cost: Math.round(pk.pricePaise * 0.88), name: p.name };
  };
  let extraNo = 1005;
  const extraOrder = (
    shopId: string,
    customer: { id: string; name: string; mobile: string; village: string },
    farmerId: string | undefined,
    items: [string, string, number][],
    daysBack: number,
    status: Order["status"],
    source: "platform" | "manual" = "platform"
  ): void => {
    const built = items.map(([pid, pack, qty]) => {
      const info = priceOf(pid, pack);
      return {
        productId: pid,
        productName: info.name,
        packSize: pack,
        qty,
        pricePaise: info.price,
        lineTotalPaise: info.price * qty,
        costPaise: info.cost,
      };
    });
    const itemsTotal = built.reduce((s, i) => s + i.lineTotalPaise, 0);
    const supply = built.reduce((s, i) => s + (i.costPaise ?? 0) * i.qty, 0);
    const delivery = source === "manual" ? 0 : store.config.deliveryFeePaise;
    const tax = Math.round((itemsTotal * store.config.taxPct) / 100);
    const commission = source === "manual" ? 0 : Math.round((itemsTotal * store.config.commissionPct) / 100);
    const id = `order_x${extraNo}`;
    const delivered = status === "Delivered";
    store.orders.push({
      id,
      orderNo: `KK-ORD-${extraNo}`,
      farmerId,
      customerId: customer.id,
      customerName: customer.name,
      mobile: customer.mobile,
      village: customer.village,
      addressLine: `${customer.village} (demo address)`,
      deliveryType: "home",
      items: built,
      itemsTotalPaise: itemsTotal,
      deliveryFeePaise: delivery,
      taxPaise: tax,
      totalPaise: itemsTotal + delivery + tax,
      supplyTotalPaise: supply,
      commissionPaise: commission,
      paymentMethod: source === "manual" ? "Manual" : "COD",
      paymentStatus: delivered ? "Paid" : status === "Cancelled" ? "Refunded" : "Pending",
      source,
      shopId,
      status,
      createdAt: daysAgo(daysBack, 11),
      updatedAt: daysAgo(daysBack, 15),
    });
    hist(id, "Pending", farmerId ?? "shop", farmerId ? "farmer" : "shop_owner", daysAgo(daysBack, 11), "Order placed");
    if (delivered) hist(id, "Delivered", shopId === "shop_a" ? "user_shopa" : "user_shopb", "shop_owner", daysAgo(daysBack, 15));
    if (delivered) {
      store.payments.push({
        id: `pay_${id}`,
        orderId: id,
        shopId,
        provider: "manual",
        amountPaise: itemsTotal + delivery + tax,
        currency: "INR",
        status: "Paid",
        method: source === "manual" ? "manual" : "cod",
        reference: "Seeded demo payment",
        createdAt: daysAgo(daysBack, 15),
        updatedAt: daysAgo(daysBack, 15),
      });
    }
    extraNo += 1;
  };
  const cA1 = { id: custA1.id, name: custA1.name, mobile: custA1.mobile, village: custA1.village };
  const cA2 = { id: custA2.id, name: custA2.name, mobile: custA2.mobile, village: custA2.village };
  const cA3 = { id: custA3.id, name: custA3.name, mobile: custA3.mobile, village: custA3.village };
  const cA5 = { id: custA5.id, name: custA5.name, mobile: custA5.mobile, village: custA5.village };
  const cB1 = { id: custB1.id, name: custB1.name, mobile: custB1.mobile, village: custB1.village };
  const cB2 = { id: custB2.id, name: custB2.name, mobile: custB2.mobile, village: custB2.village };
  const cB3 = { id: custB3.id, name: custB3.name, mobile: custB3.mobile, village: custB3.village };
  extraOrder("shop_a", cA1, "user_farmer", [["prod_4", "50 kg bag", 1]], 28, "Delivered");
  extraOrder("shop_a", cA2, undefined, [["prod_3", "45 kg bag", 3]], 25, "Delivered");
  extraOrder("shop_b", cB1, "user_farmer2", [["prod_3", "45 kg bag", 2]], 24, "Delivered");
  extraOrder("shop_a", cA3, undefined, [["prod_5", "250 g", 2], ["prod_10", "1 kg", 1]], 21, "Delivered");
  extraOrder("shop_b", cB2, undefined, [["prod_7", "400 ml", 2]], 19, "Delivered");
  extraOrder("shop_a", cA1, "user_farmer", [["prod_1", "500 ml", 1], ["prod_12", "5 kg", 1]], 17, "Delivered");
  extraOrder("shop_b", cB3, undefined, [["prod_11", "500 ml", 2]], 15, "Delivered");
  extraOrder("shop_a", cA5, undefined, [["prod_14", "50 kg bag", 2]], 13, "Delivered", "manual");
  extraOrder("shop_b", cB1, "user_farmer2", [["prod_9", "100 ml", 3]], 10, "Delivered");
  extraOrder("shop_a", cA2, undefined, [["prod_4", "50 kg bag", 1], ["prod_3", "45 kg bag", 1]], 8, "Delivered");
  extraOrder("shop_b", cB2, undefined, [["prod_5", "250 g", 1]], 6, "Cancelled");
  extraOrder("shop_a", cA1, "user_farmer", [["prod_8", "1 L", 2]], 4, "Delivered");
  store.counters.order = extraNo - 1;

  // ---------- Phase 3: expanded disease library (17 entries) ----------
  store.diseases.push(
    D("Wheat", "Loose Smut", "Black powdery masses replace the grain in ears at heading stage.", "Fungus carried inside the seed from the previous crop.", "Use certified seed, treat seed before sowing, remove and bury smutted ears carefully in a bag before they burst.", "#795548"),
    D("Paddy", "Sheath Blight", "Oval grey-green lesions on the leaf sheath near the water line, spreading upward.", "Fungus surviving in soil and crop stubble, favoured by dense planting and high nitrogen.", "Avoid excess nitrogen, space plants properly, remove stubble, and follow local agriculture department advisories.", "#26A69A"),
    D("Cotton", "Boll Rot", "Bolls turn dark, rot from inside and fail to open properly, lint discoloured.", "Fungi and bacteria entering through insect injury in wet weather.", "Control bollworms, avoid waterlogging, pick and destroy rotten bolls, keep the field clean of weeds.", "#AB47BC"),
    D("Tomato", "Early Blight", "Dark concentric ring spots on older leaves, yellowing and leaf drop from bottom upward.", "Fungus in crop debris and soil, spread by splashing water.", "Rotate crops, mulch to reduce splashing, remove affected leaves, and seek current local fungicide advisories.", "#EF5350"),
    D("Onion", "Purple Blotch", "Purple-brown sunken spots with yellow halos on leaves, leaves dry from the tip.", "Fungus favoured by warm humid weather and dew.", "Wider spacing, avoid overhead irrigation late in the day, rotate with non-onion crops for two seasons.", "#7E57C2"),
    D("Sugarcane", "Red Rot", "Reddened internal tissue with white cross bands when the cane is split, sour smell.", "Fungus carried in infected seed cane and crop debris.", "Plant only healthy seed cane from a trusted source, treat setts, remove and burn infected clumps, long rotation.", "#D32F2F"),
    D("Soybean", "Charcoal Rot", "Plants wilt in dry patches during hot weather; stem base shows grey-black specks under the bark.", "Soil fungus that attacks water-stressed plants.", "Avoid moisture stress at flowering, maintain plant population, rotate with cereals, deep summer ploughing.", "#546E7A")
  );

  // ---------- Phase 4: every crop has at least 3 entries (37 total) ----------
  store.diseases.push(
    D("Soybean", "Anthracnose", "Dark, sunken spots on pods, stems and leaf veins; infected seeds shrivel and turn brown, seedlings may die.", "Fungus carried in infected seed and crop debris, spread by rain in warm wet weather.", "Use clean certified seed, treat seed before sowing, remove crop debris, rotate crops, and follow local agriculture department advisories.", "#AD1457"),
    D("Soybean", "Stem Fly", "Young plants wilt and dry within a few weeks of germination even when soil moisture is adequate; a tiny maggot tunnels inside the stem just above the ground.", "Small fly that lays eggs on young seedlings; the maggot bores into the stem.", "Sow on time at the recommended seed rate so gaps can be tolerated, remove and destroy dried seedlings, and follow current IPM advisories from the agriculture department.", "#00897B"),
    D("Paddy", "Brown Spot", "Circular dark-brown spots on leaves, and dark spots on grains which become discoloured and light in weight.", "Fungus that is worst on weak plants in poorly nourished or water-stressed fields.", "Use healthy seed, give balanced nutrition including potash as per soil test, treat seed, and consult the local agriculture office for current recommendations.", "#6D4C41"),
    D("Paddy", "Tungro Virus", "Plants are stunted with fewer tillers; leaves turn yellow-orange starting from the tips and plants stay short.", "Virus carried from plant to plant by the green leafhopper.", "Grow resistant varieties where available, plant at the same time as neighbouring fields, manage leafhopper with IPM, and remove badly infected hills early.", "#F4511E"),
    D("Wheat", "Brown (Leaf) Rust", "Small, round orange-brown powdery pustules scattered mainly on the upper surface of leaves; heavy attacks dry the leaf.", "Wind-borne fungal spores, mild humid weather favours spread.", "Grow resistant varieties, scout fields regularly from tillering, and follow agriculture department advisories for any spray decision.", "#D84315"),
    D("Wheat", "Powdery Mildew", "White powdery patches on leaves and stems that later turn grey-brown; affected leaves yellow early.", "Fungus favoured by a dense crop, excess nitrogen and cool humid weather.", "Avoid excess nitrogen and very dense sowing, prefer resistant varieties, and follow local agriculture department advisories.", "#90A4AE"),
    D("Cotton", "Bacterial Blight", "Angular water-soaked spots on leaves that stay within the veins and turn brown; stems may blacken and young bolls develop dark spots.", "Bacteria carried in seed and crop debris, splashed by rain and irrigation water.", "Use clean, treated seed from a reliable source, remove crop debris after harvest, avoid working in wet fields, and prefer tolerant varieties.", "#5C6BC0"),
    D("Cotton", "Grey Mildew", "Grey-white mildew growth on the underside of older lower leaves; leaves turn yellow and fall, usually late in the season.", "Fungus that builds up in a humid, dense canopy.", "Keep recommended spacing, avoid excess nitrogen and over-irrigation, remove fallen infected leaves, and follow local advisories.", "#78909C"),
    D("Maize", "Turcicum Leaf Blight", "Long, spindle or cigar-shaped grey-brown dead patches running along the leaf, which can cover most of the leaf in wet weather.", "Fungus surviving in crop debris, spread by wind and rain splash.", "Prefer resistant hybrids, rotate crops, bury crop debris after harvest, and follow local agriculture department advisories.", "#26C6DA"),
    D("Maize", "Banded Leaf and Sheath Blight", "Broad bands of bleached, papery, light areas alternating with brown zones across leaves and leaf sheaths, starting on lower leaves.", "Soil and debris-borne fungus favoured by hot, humid weather and a dense stand.", "Keep proper spacing, remove badly infected lower leaves, avoid excess nitrogen, ensure drainage, and follow local advisories.", "#9CCC65"),
    D("Gram (Chana)", "Ascochyta Blight", "Round spots with concentric rings and tiny black dots on leaves, stems and pods; whole plants can collapse quickly after rainy spells.", "Fungus carried in seed and crop debris, favoured by cool wet weather.", "Use certified treated seed, plough in crop debris deeply, follow a long rotation, and follow agriculture department advisories in blight-prone areas.", "#8D6E63"),
    D("Gram (Chana)", "Pod Borer", "Caterpillars first feed on leaves, then bore into green pods and eat the developing grains inside, leaving empty or half-eaten pods.", "Moth pest common on gram and pigeonpea; moths lay eggs on the crop at flowering.", "Install pheromone traps and bird perches, scout at flowering for small larvae, conserve natural enemies, and follow current ICAR/state IPM advisories.", "#7CB342"),
    D("Chilli", "Anthracnose (Fruit Rot)", "Sunken circular dark spots with concentric rings on ripening fruits; fruits rot, shrivel and fall before harvest.", "Fungus carried in seed and spread by rain splash from infected fruits and debris.", "Use clean treated seed, pick and destroy rotten fruits regularly, avoid overhead watering of fruits, and follow local agriculture department advisories.", "#E53935"),
    D("Chilli", "Powdery Mildew", "White powdery coating, mainly on the underside of leaves; leaves turn yellow, curl slightly and drop, exposing fruits to sunscald.", "Fungus favoured by warm days, humid nights and a dense canopy.", "Keep spacing for good air flow, remove heavily infected leaves, avoid excess nitrogen, and follow local advisories.", "#B0BEC5"),
    D("Tomato", "Late Blight", "Water-soaked dark patches on leaves and stems with white mildew on the leaf underside in damp weather; fruits develop firm, dark, greasy rot. Spreads very fast.", "Water-mould fungus favoured by cool, wet weather and leaf wetness.", "Use healthy seedlings, stake and space plants for drying, avoid wetting leaves, remove infected plants at once, and contact the local agriculture office promptly — follow their current advisories.", "#37474F"),
    D("Tomato", "Leaf Curl Virus", "Leaves curl upward, thicken and feel leathery; plants are stunted with many side branches and produce few, small fruits.", "Virus carried by whitefly from infected plants and weeds.", "Raise seedlings under net, use virus-free seedlings, manage whitefly with IPM, remove and bury infected plants early, and keep weeds down around the field.", "#C0CA33"),
    D("Onion", "Basal Rot", "Leaves yellow and wilt starting from the tips; the base plate and roots of the bulb rot, often with white fungal growth, and bulbs rot in storage too.", "Soil-borne fungus favoured by warm, moist soil and injured bulbs.", "Follow a long rotation with non-onion crops, plant in well-drained fields, handle bulbs gently, cure bulbs thoroughly before storage, and discard infected bulbs.", "#8E24AA"),
    D("Onion", "Stemphylium Blight", "Small yellow-white spots appear on leaf tips and flower stalks and turn brown-purple; leaves blight and dry from the tip downwards.", "Fungus that often follows purple blotch or thrips injury, favoured by humid weather.", "Manage thrips, keep recommended spacing, rotate crops, remove crop debris, and follow local agriculture department advisories.", "#FFA726"),
    D("Sugarcane", "Smut", "A long, whip-like black structure covered in black powdery spores grows out of the top of the cane instead of normal leaves; affected canes stay thin.", "Fungus carried mainly in infected seed cane (setts).", "Plant only disease-free seed cane from a trusted source, treat setts before planting as advised, carefully bag and burn smutted whips before they open, and rotate the field.", "#212121"),
    D("Sugarcane", "Top Shoot Borer", "The growing shoot dies and the central dead heart can be pulled out easily, often with a bad smell; later the top shows bunchy side growth.", "Moth whose caterpillar bores into the growing point of young cane.", "Remove and destroy dead hearts during early growth, avoid excess nitrogen, conserve and release natural enemies as per IPM, and follow current ICAR/state advisories.", "#A1887F")
  );

  store.auditLogs.push({
    id: uid("audit_"),
    actorId: "system",
    actorRole: "system",
    action: "seed",
    entity: "store",
    entityId: "store",
    details: "Demo seed data created on first run.",
    at: new Date().toISOString(),
  });

  return store;
}
