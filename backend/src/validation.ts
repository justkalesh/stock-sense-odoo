import { z } from 'zod';

const threeDecimals = (v: number) => /^\d+(\.\d{1,3})?$/.test(String(v));

export const password = z.string()
  .min(8, 'Password needs at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password needs a special character');

export const id = z.coerce.number().int().positive();
const amount = (msg: string) => z.coerce.number({ error: msg }).min(0, 'Values cannot be negative')
  .max(999_999_999, 'That number is too large').refine(threeDecimals, 'Use at most 3 decimal places');
const quantity = z.coerce.number({ error: 'Enter a quantity' }).positive('Quantities must be greater than 0')
  .max(999_999_999, 'That quantity is too large').refine(threeDecimals, 'Use at most 3 decimal places');

export const signup = z.object({
  loginId: z.string().trim().regex(/^[A-Za-z0-9._-]{6,12}$/, 'Login ID must be 6–12 letters, numbers, dots, dashes or underscores'),
  email: z.string().trim().toLowerCase().max(254).regex(/^\S+@\S+\.\S+$/, 'Enter a valid email'),
  password,
  role: z.enum(['MANAGER', 'STAFF'], { error: 'Choose Manager or Staff' }),
});

export const login = z.object({
  loginId: z.string().trim().min(1, 'Enter your Login ID').max(64),
  password: z.string().min(1, 'Enter your password').max(128),
});

export const identifier = z.object({ identifier: z.string().trim().min(1, 'Enter your email or Login ID').max(254) });
export const verify = identifier.extend({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') });
export const reset = z.object({ resetToken: z.string().min(20).max(200), password });

export const profile = z.object({ name: z.string().trim().min(1, 'Name is required').max(80) });
export const changePassword = z.object({ current: z.string().min(1, 'Enter your current password').max(128), next: password });

export const operation = z.object({
  type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL']),
  contact: z.string().trim().max(200).default(''),
  deliveryAddress: z.string().trim().max(500).default(''),
  scheduledDate: z.coerce.number().int().positive('Schedule date is required'),
  sourceLocId: id,
  destLocId: id,
  lines: z.array(z.object({ productId: z.coerce.number().int().positive('Select a product on every line'), quantity })).max(200),
  todo: z.boolean().default(false),
});

export const adjustment = z.object({
  productId: z.coerce.number().int().positive('Select a product'),
  locationId: id,
  counted: amount('Enter a valid counted quantity'),
  reason: z.string().trim().max(60).default('Count correction'),
});

export const product = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  sku: z.string().trim().min(1, 'SKU is required').max(12, 'SKU must be 3–12 characters'),
  category: z.string().trim().max(60).default(''),
  uom: z.enum(['Units', 'kg', 'm', 'L', 'Box']),
  unitCost: amount('Enter a valid cost'),
  reorderMin: amount('Enter a valid reorder min'),
  reorderMax: amount('Enter a valid reorder max'),
  initial: amount('Enter a valid initial stock').default(0),
  locationId: z.coerce.number().int().positive().optional(),
});

export const reorder = z.object({ min: amount('Enter a valid min'), max: amount('Enter a valid max') });

export const warehouse = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  shortCode: z.string().trim().min(1, 'Short code is required').max(5),
  address: z.string().trim().max(300).default(''),
});

export const location = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  shortCode: z.string().trim().min(1, 'Short code is required').max(12),
  warehouseId: id,
});
