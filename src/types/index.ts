export type Role = "admin" | "cashier";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  catId: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  qty: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  customerId: string | null;
  subtotal: number;
  discountAmt: number;
  total: number;
  createdBy: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  maxQty: number;
}
