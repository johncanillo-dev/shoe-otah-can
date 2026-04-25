"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { createSupabaseBrowserClient } from "./supabase/client";

export type PaymentMethod = "cash" | "gcash" | "paymaya" | "bankTransfer" | "cod";

export type CustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type Address = {
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
};

export type OrderStatus = "pending" | "confirmed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";

export type StatusUpdate = {
  status: OrderStatus;
  timestamp: string;
  notes?: string;
};

export type Order = {
  id: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    quantity: number;
    sellerId?: string;
  }>;
  customerDetails: CustomerDetails;
  address: Address;
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  status: OrderStatus;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  statusHistory: StatusUpdate[];
  deliveryNotes?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
};

export type DatabaseOrder = {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  deliveryAddress: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  isDelivered: boolean;
};

export type AdminDashboardStats = {
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalProducts: number;
};

type OrderContextType = {
  currentOrder: Order | null;
  orders: Order[];
  createOrder: (order: Omit<Order, "id" | "createdAt" | "status" | "statusHistory">) => void;
  clearCurrentOrder: () => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, notes?: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
  // Database order functions
  databaseOrders: DatabaseOrder[];
  createDatabaseOrder: (order: Omit<DatabaseOrder, "id" | "createdAt" | "updatedAt">) => Promise<{ success: boolean; error?: string; orderId?: string }>;
  updateDatabaseOrderStatus: (orderId: string, status: string) => Promise<{ success: boolean; error?: string }>;
  getUserDatabaseOrders: (userId: string) => Promise<void>;
  getAllDatabaseOrders: () => Promise<void>;
  // Admin dashboard functions
  getAdminDashboardStats: () => Promise<AdminDashboardStats | null>;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const STORAGE_KEY = "orders";

export function OrderProvider({ children }: { children: ReactNode }) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [databaseOrders, setDatabaseOrders] = useState<DatabaseOrder[]>([]);
  const supabase = createSupabaseBrowserClient();

  React.useEffect(() => {
    // Load orders from localStorage on mount
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setOrders(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse orders:", e);
      }
    }
  }, []);

  const createOrder = (order: Omit<Order, "id" | "createdAt" | "status" | "statusHistory">) => {
    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date().toISOString(),
          notes: "Order created",
        },
      ],
    };

    setCurrentOrder(newOrder);
    addOrder(newOrder);
  };

  const clearCurrentOrder = () => {
    setCurrentOrder(null);
  };

  const addOrder = (order: Order) => {
    const updatedOrders = [...orders, order];
    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, notes?: string) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        const statusUpdate: StatusUpdate = {
          status: newStatus,
          timestamp: new Date().toISOString(),
          notes,
        };

        const updatedOrder: Order = {
          ...order,
          status: newStatus,
          statusHistory: [...order.statusHistory, statusUpdate],
          ...(newStatus === "delivered" && { actualDeliveryDate: new Date().toISOString() }),
        };

        if (order.id === currentOrder?.id) {
          setCurrentOrder(updatedOrder);
        }

        return updatedOrder;
      }
      return order;
    });

    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find((order) => order.id === orderId);
  };

  // Database order functions
  const createDatabaseOrder = async (
    order: Omit<DatabaseOrder, "id" | "createdAt" | "updatedAt">
  ): Promise<{ success: boolean; error?: string; orderId?: string }> => {
    try {
      const { data, error } = await (supabase
        .from("orders")
        .insert([
          {
            user_id: order.userId,
            product_id: order.productId,
            product_name: order.productName,
            quantity: order.quantity,
            price: order.price,
            total_amount: order.totalAmount,
            status: order.status,
            delivery_address: order.deliveryAddress,
            delivery_notes: order.deliveryNotes || null,
            estimated_delivery: order.estimatedDelivery || null,
            is_delivered: false,
          },
        ])
        .select("id") as any);

      if (error) {
        console.error("Error creating database order:", error);
        return { success: false, error: "Failed to create order" };
      }

      if (data && data.length > 0) {
        return { success: true, orderId: data[0].id };
      }

      return { success: false, error: "Order created but no ID returned" };
    } catch (error) {
      console.error("Database order creation error:", error);
      return { success: false, error: "Order creation failed" };
    }
  };

  const getUserDatabaseOrders = async (userId: string) => {
    try {
      const { data, error } = await (supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }) as any);

      if (error) {
        console.error("Error fetching user orders:", error);
        return;
      }

      const mappedOrders: DatabaseOrder[] = (data || []).map((order: any) => ({
        id: order.id,
        userId: order.user_id,
        productId: order.product_id,
        productName: order.product_name,
        quantity: order.quantity,
        price: order.price,
        totalAmount: order.total_amount,
        status: order.status,
        deliveryAddress: order.delivery_address,
        deliveryNotes: order.delivery_notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        estimatedDelivery: order.estimated_delivery,
        isDelivered: order.is_delivered,
      }));

      setDatabaseOrders(mappedOrders);
    } catch (error) {
      console.error("Error loading user orders:", error);
    }
  };

  const getAllDatabaseOrders = async () => {
    try {
      const { data, error } = await (supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false }) as any);

      if (error) {
        console.error("Error fetching all orders:", error);
        return;
      }

      const mappedOrders: DatabaseOrder[] = (data || []).map((order: any) => ({
        id: order.id,
        userId: order.user_id,
        productId: order.product_id,
        productName: order.product_name,
        quantity: order.quantity,
        price: order.price,
        totalAmount: order.total_amount,
        status: order.status,
        deliveryAddress: order.delivery_address,
        deliveryNotes: order.delivery_notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        estimatedDelivery: order.estimated_delivery,
        isDelivered: order.is_delivered,
      }));

      setDatabaseOrders(mappedOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const updateDatabaseOrderStatus = async (
    orderId: string,
    status: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const isDelivered = status === "delivered";

      const { error } = await (supabase
        .from("orders")
        .update({
          status,
          is_delivered: isDelivered,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId) as any);

      if (error) {
        console.error("Error updating order:", error);
        return { success: false, error: "Failed to update order" };
      }

      // Update local state
      setDatabaseOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: status as any, isDelivered, updatedAt: new Date().toISOString() }
            : order
        )
      );

      return { success: true };
    } catch (error) {
      console.error("Order update error:", error);
      return { success: false, error: "Failed to update order" };
    }
  };

  // Admin Dashboard Statistics - ONLY queries Supabase
  const getAdminDashboardStats = async (): Promise<AdminDashboardStats | null> => {
    try {
      // Get all orders from Supabase
      const { data: ordersData, error: ordersError } = await (supabase
        .from("orders")
        .select("*") as any);

      if (ordersError) {
        console.error("Error fetching orders for stats:", ordersError);
        return null;
      }

      // Get all users count from Supabase
      const { data: usersData, error: usersError } = await (supabase
        .from("users")
        .select("id") as any);

      if (usersError) {
        console.error("Error fetching users for stats:", usersError);
        return null;
      }

      // Get all products count from Supabase
      const { data: productsData, error: productsError } = await (supabase
        .from("shoe-otah")
        .select("id") as any);

      if (productsError) {
        console.error("Error fetching products for stats:", productsError);
        return null;
      }

      // Calculate stats from orders
      const orders = ordersData || [];
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
      const processingOrders = orders.filter((o: any) => o.status === "processing").length;
      const shippedOrders = orders.filter((o: any) => o.status === "shipped").length;
      const deliveredOrders = orders.filter((o: any) => o.status === "delivered").length;
      const cancelledOrders = orders.filter((o: any) => o.status === "cancelled").length;
      const totalRevenue = orders
        .filter((o: any) => o.status === "delivered")
        .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalUsers: usersData?.length || 0,
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue,
        totalProducts: productsData?.length || 0,
      };
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      return null;
    }
  };

  return (
    <OrderContext.Provider
      value={{ 
        currentOrder, 
        orders, 
        createOrder, 
        clearCurrentOrder, 
        addOrder, 
        updateOrderStatus, 
        getOrderById,
        databaseOrders,
        createDatabaseOrder,
        updateDatabaseOrderStatus,
        getUserDatabaseOrders,
        getAllDatabaseOrders,
        getAdminDashboardStats,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder must be used within OrderProvider");
  }
  return context;
}
