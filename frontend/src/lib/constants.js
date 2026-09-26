export const COL = { red: "#FF5C5C", green: "#2FBF71", amber: "#F5A524", blue: "#4C8DFF", gray: "#8B8B94", t2: "#A1A1AA", t3: "#71717A" };

export const STATUS = {
  DRAFT: { label: "Draft", c: "#8B8B94" },
  WAITING: { label: "Waiting", c: "#F5A524" },
  READY: { label: "Ready", c: "#4C8DFF" },
  DONE: { label: "Done", c: "#2FBF71" },
  CANCELED: { label: "Canceled", c: "#8B8B94", bg: "#5C5C66" },
};

export const TYPE_CODE = { RECEIPT: "IN", DELIVERY: "OUT", INTERNAL: "INT", ADJUSTMENT: "ADJ" };
export const TYPE_LABEL = { RECEIPT: "Receipt", DELIVERY: "Delivery", INTERNAL: "Internal Transfer", ADJUSTMENT: "Adjustment" };
export const PENDING = ["DRAFT", "WAITING", "READY"];
export const UOMS = ["Units", "kg", "m", "L", "Box"];
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WDL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY = 864e5;
