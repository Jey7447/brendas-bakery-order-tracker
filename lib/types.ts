export type PaymentStatus = "PAID" | "UNPAID";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type OrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  rowNumber?: number;
  createdAt: string;
  customerName: string;
  phone: string;
  email: string;
  items: OrderItem[];
  deliveryDate: string;
  deliveryTime: string;
  address: string;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string;
};
