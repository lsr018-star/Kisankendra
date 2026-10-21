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
    config: {
      commissionPct: 8,
      deliveryFeePaise: 4900,
      taxPct: 5,
      refundNote:
        "Refunds for cancelled orders are processed to the original payment method within 7 working days after the shop confirms return of the goods in sealed condition.",
      lowStockThreshold: 5,
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
