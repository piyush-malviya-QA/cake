"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { snakeToCamel, camelToSnake, uid, now } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { enqueue } from "@/lib/sync/queue";
import { useAuthContext } from "@/features/auth/AuthProvider";
import type { Product, Category, Order, OrderItem, Customer, CartItem } from "@/types";

interface CreateOrderInput {
  items: CartItem[];
  subtotal: number;
  discountAmt: number;
  deliveryCharge: number;
  total: number;
  customerId: string | null;
}

interface DataContextValue {
  products: Product[];
  productsLoading: boolean;
  categories: Category[];
  categoriesLoading: boolean;
  orders: Order[];
  ordersLoading: boolean;
  customers: Customer[];
  customersLoading: boolean;
  // Product mutations
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  decrementStock: (productId: string, amount: number) => Promise<boolean>;
  refetchProducts: () => Promise<void>;
  // Category mutations
  addCategory: (category: Omit<Category, "sortOrder">) => Promise<boolean>;
  updateCategory: (category: Category) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  refetchCategories: () => Promise<void>;
  // Order mutations
  createOrder: (input: CreateOrderInput) => Promise<Order | null>;
  deleteOrder: (id: string) => Promise<boolean>;
  refetchOrders: () => Promise<void>;
  // Customer mutations
  addCustomer: (customer: Pick<Customer, "name" | "phone" | "address">) => Promise<string | null>;
  updateCustomer: (customer: Customer) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
  refetchCustomers: () => Promise<void>;
}

const defaultContext: DataContextValue = {
  products: [],
  productsLoading: true,
  categories: [],
  categoriesLoading: true,
  orders: [],
  ordersLoading: true,
  customers: [],
  customersLoading: true,
  addProduct: async () => false,
  updateProduct: async () => false,
  deleteProduct: async () => false,
  decrementStock: async () => false,
  refetchProducts: async () => {},
  addCategory: async () => false,
  updateCategory: async () => false,
  deleteCategory: async () => false,
  refetchCategories: async () => {},
  createOrder: async () => null,
  deleteOrder: async () => false,
  refetchOrders: async () => {},
  addCustomer: async () => null,
  updateCustomer: async () => false,
  deleteCustomer: async () => false,
  refetchCustomers: async () => {},
};

const DataContext = createContext<DataContextValue>(defaultContext);

export function useDataContext() {
  return useContext(DataContext);
}

export default function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  const supabase = createClient();
  const { userId, userName, shopId } = useAuthContext();

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  async function saveWithSync(table: string, operation: "insert" | "update" | "delete", payload: Record<string, unknown>) {
    if (!isOnline) {
      await enqueue({ table, operation, payload, createdAt: now() });
      return { error: null };
    }
    
    switch (operation) {
      case "insert":
        return await supabase.from(table).insert(payload);
      case "update": {
        const { id, ...rest } = payload;
        return await supabase.from(table).update(rest).eq("id", id);
      }
      case "delete":
        return await supabase.from(table).delete().eq("id", payload.id);
      default:
        return { error: { message: "Unknown operation" } };
    }
  }

  function audit(action: string, entity: string, entityId?: string, details?: Record<string, unknown>) {
    if (!userId || !userName || !shopId) return;
    logAudit(supabase, userId, userName, shopId, { action, entity, entityId, details });
  }

  // --- Fetch functions ---

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    if (!error && data) {
      setProducts(data.map((d) => snakeToCamel<Product>(d)));
    }
    setProductsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (!error && data) {
      setCategories(data.map((d) => snakeToCamel<Category>(d)));
    }
    setCategoriesLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = useCallback(async () => {
    const [ordersRes, productsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("products").select("id, buy_price"),
    ]);
    const { data, error } = ordersRes;
    const buyPriceMap = new Map<string, number>(
      (productsRes.data || []).map((p: { id: string; buy_price: number }) => [p.id, p.buy_price])
    );
    if (!error && data) {
      setOrders(
        data.map((d) => {
          const { order_items, ...rest } = d;
          const order = snakeToCamel<Order>(rest as Record<string, unknown>);
          order.items = (order_items || []).map((oi: Record<string, unknown>) => {
            const item = snakeToCamel<OrderItem>(oi);
            item.buyPrice = item.productId ? (buyPriceMap.get(item.productId) ?? 0) : 0;
            return item;
          });
          return order;
        })
      );
    }
    setOrdersLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = useCallback(async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name");
    if (!error && data) {
      setCustomers(data.map((d) => snakeToCamel<Customer>(d)));
    }
    setCustomersLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all on mount
  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories(), fetchOrders(), fetchCustomers()]);
  }, [fetchProducts, fetchCategories, fetchOrders, fetchCustomers]);

  // --- Product mutations ---

  async function addProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">) {
    const newProduct = {
      ...product,
      id: uid(),
      createdAt: now(),
      updatedAt: now(),
    };
    
    if (!isOnline) {
      await enqueue({ table: "products", operation: "insert", payload: camelToSnake(newProduct as unknown as Record<string, unknown>), createdAt: now() });
      setProducts((prev) => [...prev, newProduct as Product]);
      return true;
    }

    const { error } = await supabase
      .from("products")
      .insert(camelToSnake(newProduct as unknown as Record<string, unknown>));
    if (!error) {
      setProducts((prev) => [...prev, newProduct as Product]);
      audit("created", "product", newProduct.id, { name: product.name });
    }
    return !error;
  }

  async function updateProduct(product: Product) {
    const old = products.find((p) => p.id === product.id);
    const updated = { ...product, updatedAt: now() };
    
    if (!isOnline) {
      await enqueue({ table: "products", operation: "update", payload: camelToSnake(updated as unknown as Record<string, unknown>), createdAt: now() });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      return true;
    }

    const { error } = await supabase
      .from("products")
      .update(camelToSnake(updated as unknown as Record<string, unknown>))
      .eq("id", product.id);
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updated : p))
      );
      const changes: Record<string, unknown> = { name: product.name };
      if (old) {
        if (old.sellPrice !== product.sellPrice) changes.sellPrice = `${old.sellPrice} → ${product.sellPrice}`;
        if (old.buyPrice !== product.buyPrice) changes.buyPrice = `${old.buyPrice} → ${product.buyPrice}`;
        if (old.qty !== product.qty) changes.qty = `${old.qty} → ${product.qty}`;
      }
      audit("updated", "product", product.id, changes);
    }
    return !error;
  }

  async function deleteProduct(id: string) {
    const product = products.find((p) => p.id === id);
    
    if (!isOnline) {
      await enqueue({ table: "products", operation: "delete", payload: { id }, createdAt: now() });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      return true;
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      audit("deleted", "product", id, { name: product?.name });
    }
    return !error;
  }

  async function decrementStock(productId: string, amount: number) {
    const { data, error } = await supabase.rpc("decrement_stock", {
      p_id: productId,
      amount,
    });
    if (!error && data > 0) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, qty: p.qty - amount } : p
        )
      );
      return true;
    }
    return false;
  }

  // --- Category mutations ---

  async function addCategory(category: Omit<Category, "sortOrder">) {
    const maxSort = categories.reduce((m, c) => Math.max(m, c.sortOrder), -1);
    
    // Ensure id is present
    if (!category.id) {
      console.error("Category ID is missing!");
      return false;
    }
    
    const payload = {
      id: category.id,
      name: category.name,
      icon: category.icon,
      sort_order: maxSort + 1,
    };
    console.log("addCategory payload:", payload);
    
    if (!isOnline) {
      await enqueue({ table: "categories", operation: "insert", payload, createdAt: now() });
      await fetchCategories();
      return true;
    }

    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select();
    
    if (error) {
      console.error("Failed to add category:", error);
      return false;
    }
    
    await fetchCategories();
    if (data && data[0]) {
      audit("created", "category", data[0].id, { name: category.name });
    }
    return true;
  }

  async function updateCategory(category: Category) {
    if (!isOnline) {
      await enqueue({ table: "categories", operation: "update", payload: camelToSnake(category as unknown as Record<string, unknown>), createdAt: now() });
      await fetchCategories();
      return true;
    }

    const { error } = await supabase
      .from("categories")
      .update(camelToSnake(category as unknown as Record<string, unknown>))
      .eq("id", category.id);
    if (!error) {
      await fetchCategories();
      audit("updated", "category", category.id, { name: category.name });
    }
    return !error;
  }

  async function deleteCategory(id: string) {
    const cat = categories.find((c) => c.id === id);
    
    if (!isOnline) {
      await enqueue({ table: "categories", operation: "delete", payload: { id }, createdAt: now() });
      await fetchCategories();
      return true;
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) {
      await fetchCategories();
      audit("deleted", "category", id, { name: cat?.name });
    }
    return !error;
  }

  // --- Order mutations ---

  async function createOrder(input: CreateOrderInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const orderId = uid();
    const orderData = {
      id: orderId,
      customer_id: input.customerId,
      subtotal: input.subtotal,
      discount_amt: input.discountAmt,
      delivery_charge: input.deliveryCharge,
      total: input.total,
      created_by: user.id,
      created_at: now(),
    };

    const { error: orderError } = await supabase
      .from("orders")
      .insert(orderData);
    if (orderError) return null;

    const itemsData = input.items.map((item) => ({
      id: uid(),
      order_id: orderId,
      product_id: item.productId,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsData);
    if (itemsError) return null;

    const newOrder: Order = {
      id: orderId,
      customerId: input.customerId,
      subtotal: input.subtotal,
      discountAmt: input.discountAmt,
      deliveryCharge: input.deliveryCharge,
      total: input.total,
      createdBy: user.id,
      createdAt: orderData.created_at,
      items: itemsData.map((i) => ({
        ...snakeToCamel<OrderItem>(i as unknown as Record<string, unknown>),
        buyPrice: 0,
      })),
    };

    setOrders((prev) => [newOrder, ...prev]);
    audit("created", "order", orderId, { total: input.total, items: input.items.length });
    return newOrder;
  }

  async function deleteOrder(id: string) {
    const order = orders.find((o) => o.id === id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      audit("deleted", "order", id, { total: order?.total });
    }
    return !error;
  }

  // --- Customer mutations ---

  async function addCustomer(
    customer: Pick<Customer, "name" | "phone" | "address">
  ): Promise<string | null> {
    const newCustomer = {
      ...customer,
      id: uid(),
      createdAt: now(),
      updatedAt: now(),
    };
    
    if (!isOnline) {
      await enqueue({ table: "customers", operation: "insert", payload: camelToSnake(newCustomer as unknown as Record<string, unknown>), createdAt: now() });
      setCustomers((prev) => [...prev, newCustomer as Customer]);
      return newCustomer.id;
    }

    const { error } = await supabase
      .from("customers")
      .insert(camelToSnake(newCustomer as unknown as Record<string, unknown>));
    if (!error) {
      setCustomers((prev) => [...prev, newCustomer as Customer]);
      audit("created", "customer", newCustomer.id, { name: customer.name });
      return newCustomer.id;
    }
    return null;
  }

  async function updateCustomer(customer: Customer) {
    const updated = { ...customer, updatedAt: now() };
    
    if (!isOnline) {
      await enqueue({ table: "customers", operation: "update", payload: camelToSnake(updated as unknown as Record<string, unknown>), createdAt: now() });
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? updated : c)));
      return true;
    }

    const { error } = await supabase
      .from("customers")
      .update(camelToSnake(updated as unknown as Record<string, unknown>))
      .eq("id", customer.id);
    if (!error) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? updated : c))
      );
      audit("updated", "customer", customer.id, { name: customer.name });
    }
    return !error;
  }

  async function deleteCustomer(id: string) {
    const customer = customers.find((c) => c.id === id);
    
    if (!isOnline) {
      await enqueue({ table: "customers", operation: "delete", payload: { id }, createdAt: now() });
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      return true;
    }

    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (!error) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      audit("deleted", "customer", id, { name: customer?.name });
    }
    return !error;
  }

  const value: DataContextValue = {
    products,
    productsLoading,
    categories,
    categoriesLoading,
    orders,
    ordersLoading,
    customers,
    customersLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    decrementStock,
    refetchProducts: fetchProducts,
    addCategory,
    updateCategory,
    deleteCategory,
    refetchCategories: fetchCategories,
    createOrder,
    deleteOrder,
    refetchOrders: fetchOrders,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetchCustomers: fetchCustomers,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
