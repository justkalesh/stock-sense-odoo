import { dayOffset } from './format';
import { createOp, todoOp, validateOp, cancelOp, adjust } from './engine';

export function buildSeed() {
  const db = {
    nextId: 1000, seq: {}, quants: {}, moves: [], operations: [],
    users: [
      { id: 1, loginId: "arjunk", name: "Arjun Kumar", email: "arjun@stocksense.in", password: "Admin@123", role: "MANAGER", createdAt: dayOffset(-30) },
      { id: 2, loginId: "priyas", name: "Priya Sharma", email: "priya@stocksense.in", password: "Staff@123", role: "STAFF", createdAt: dayOffset(-20) },
    ],
    warehouses: [
      { id: 1, name: "Main Warehouse", shortCode: "WH", address: "Plot 14, MIDC, Pune" },
      { id: 2, name: "Secondary Warehouse", shortCode: "WH2", address: "Sector 5, Noida" },
    ],
    locations: [
      { id: 1, name: "Stock 1", shortCode: "Stock1", fullName: "WH/Stock1", type: "INTERNAL", warehouseId: 1 },
      { id: 2, name: "Stock 2", shortCode: "Stock2", fullName: "WH/Stock2", type: "INTERNAL", warehouseId: 1 },
      { id: 3, name: "Rack A", shortCode: "RackA", fullName: "WH/RackA", type: "INTERNAL", warehouseId: 1 },
      { id: 4, name: "Stock 1", shortCode: "Stock1", fullName: "WH2/Stock1", type: "INTERNAL", warehouseId: 2 },
      { id: 90, name: "Vendors", shortCode: "", fullName: "Vendor", type: "VENDOR", warehouseId: null },
      { id: 91, name: "Customers", shortCode: "", fullName: "Customer", type: "CUSTOMER", warehouseId: null },
      { id: 92, name: "Inventory Loss", shortCode: "", fullName: "Inventory Loss", type: "LOSS", warehouseId: null },
    ],
    categories: [{ id: 1, name: "Furniture" }, { id: 2, name: "Raw Material" }, { id: 3, name: "Hardware" }, { id: 4, name: "Consumables" }],
    products: [
      { id: 1, sku: "DESK001", name: "Desk", categoryId: 1, uom: "Units", unitCost: 3000, reorderMin: 10, reorderMax: 60 },
      { id: 2, sku: "TBL003", name: "Table", categoryId: 1, uom: "Units", unitCost: 3000, reorderMin: 10, reorderMax: 60 },
      { id: 3, sku: "CHR002", name: "Chair", categoryId: 1, uom: "Units", unitCost: 850, reorderMin: 10, reorderMax: 40 },
      { id: 4, sku: "STL010", name: "Steel Rods", categoryId: 2, uom: "kg", unitCost: 62, reorderMin: 20, reorderMax: 150 },
      { id: 5, sku: "BLT005", name: "Bolts M8", categoryId: 3, uom: "Box", unitCost: 120, reorderMin: 50, reorderMax: 120 },
      { id: 6, sku: "PNT007", name: "Paint 1L", categoryId: 4, uom: "L", unitCost: 340, reorderMin: 15, reorderMax: 100 },
      { id: 7, sku: "PLY004", name: "Plywood Sheet", categoryId: 2, uom: "Units", unitCost: 1450, reorderMin: 5, reorderMax: 30 },
    ],
  };
  const U = 1;
  const mk = (type, o) => createOp(db, { type, contact: "", deliveryAddress: "", warehouseId: 1, ...o,
    lines: o.lines.map(([p, q]) => ({ productId: p, quantity: q })) }, U);
  const done = (op, at) => { todoOp(db, op.id); validateOp(db, op.id, U, at); };
  // history (Done)
  done(mk("RECEIPT", { contact: "Azure Interior", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(-6), lines: [[1, 50], [2, 50]] }), dayOffset(-6, 11));
  done(mk("RECEIPT", { contact: "Steel Mart", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(-5), lines: [[4, 100], [5, 12]] }), dayOffset(-5, 12));
  done(mk("RECEIPT", { contact: "Kumar Traders", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(-4), lines: [[3, 10], [6, 80]] }), dayOffset(-4, 10));
  done(mk("INTERNAL", { sourceLocId: 1, destLocId: 3, scheduledDate: dayOffset(-3), lines: [[4, 40]] }), dayOffset(-3, 9));
  done(mk("DELIVERY", { contact: "Azure Interior", deliveryAddress: "12 MG Road, Pune", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(-3), lines: [[3, 6]] }), dayOffset(-3, 16));
  done(mk("DELIVERY", { contact: "Sharma & Co", deliveryAddress: "44 Industrial Area, Ludhiana", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(-2), lines: [[4, 57]] }), dayOffset(-2, 14));
  done(mk("DELIVERY", { contact: "Kumar Traders", deliveryAddress: "7 Mall Road, Jalandhar", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(-1), lines: [[6, 10]] }), dayOffset(-1, 12));
  adjust(db, { productId: 4, locationId: 3, counted: 37, reason: "Damaged" }, U, dayOffset(-1, 15));
  // pending work
  todoOp(db, mk("RECEIPT", { contact: "Vendor Co.", sourceLocId: 90, destLocId: 3, scheduledDate: dayOffset(-1), lines: [[5, 50]] }).id);
  todoOp(db, mk("RECEIPT", { contact: "Steel Mart", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(1), lines: [[4, 60]] }).id);
  mk("RECEIPT", { contact: "Kumar Traders", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(2), lines: [[3, 20]] });
  cancelOp(db, mk("RECEIPT", { contact: "Azure Interior", sourceLocId: 90, destLocId: 1, scheduledDate: dayOffset(-2), lines: [[1, 5]] }).id);
  todoOp(db, mk("DELIVERY", { contact: "Azure Interior", deliveryAddress: "12 MG Road, Pune", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(1), lines: [[1, 5]] }).id);
  todoOp(db, mk("DELIVERY", { contact: "Sharma & Co", deliveryAddress: "44 Industrial Area, Ludhiana", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(-1), lines: [[3, 10], [1, 2]] }).id);
  mk("DELIVERY", { contact: "Kumar Traders", deliveryAddress: "7 Mall Road, Jalandhar", sourceLocId: 1, destLocId: 91, scheduledDate: dayOffset(3), lines: [[2, 3]] });
  todoOp(db, mk("INTERNAL", { sourceLocId: 1, destLocId: 2, scheduledDate: dayOffset(1), lines: [[6, 10]] }).id);
  return db;
}
