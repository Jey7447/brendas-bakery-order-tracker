import { Order } from "./types";

export const demoOrders: Order[] = [
  {
    id: "BR-001",
    createdAt: "2026-09-10T07:20:00+01:00",
    customerName: "Sarah Wanjiku",
    phone: "+254 700 000 001",
    email: "sarah@example.com",
    items: [{ name: "Chocolate Celebration Cake", quantity: 1, unitPrice: 3500 }],
    deliveryDate: "2026-09-10",
    deliveryTime: "09:00",
    address: "Westlands, Nairobi",
    total: 3500,
    paymentStatus: "PAID",
    orderStatus: "CONFIRMED",
    notes: "Please write Happy Birthday Sarah."
  },
  {
    id: "BR-002",
    createdAt: "2026-09-10T08:05:00+01:00",
    customerName: "David Mwangi",
    phone: "+254 700 000 002",
    email: "david@example.com",
    items: [{ name: "Cupcake Box", quantity: 2, unitPrice: 1800 }],
    deliveryDate: "2026-09-10",
    deliveryTime: "11:30",
    address: "Kilimani, Nairobi",
    total: 3600,
    paymentStatus: "UNPAID",
    orderStatus: "PREPARING"
  },
  {
    id: "BR-003",
    createdAt: "2026-09-10T08:30:00+01:00",
    customerName: "Mary Achieng",
    phone: "+254 700 000 003",
    email: "mary@example.com",
    items: [{ name: "Vanilla Celebration Cake", quantity: 1, unitPrice: 4200 }],
    deliveryDate: "2026-09-10",
    deliveryTime: "14:00",
    address: "Lavington, Nairobi",
    total: 4200,
    paymentStatus: "UNPAID",
    orderStatus: "CONFIRMED"
  },
  {
    id: "BR-004",
    createdAt: "2026-09-10T09:10:00+01:00",
    customerName: "James Kariuki",
    phone: "+254 700 000 004",
    email: "james@example.com",
    items: [{ name: "Butter Croissant Box", quantity: 1, unitPrice: 2200 }],
    deliveryDate: "2026-09-11",
    deliveryTime: "10:00",
    address: "Karen, Nairobi",
    total: 2200,
    paymentStatus: "PAID",
    orderStatus: "PENDING"
  }
];

export const products = [
  {
    id: "p1",
    name: "Chocolate Celebration Cake",
    category: "Cakes",
    price: 3500,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
    description: "A rich, chocolate-forward celebration cake with a soft crumb and a smooth, indulgent finish.",
    details: "Ideal for birthdays, anniversaries and those moments that deserve a proper centrepiece.",
    serving: "Serves approximately 8–10 people",
    note: "Made to order. Decoration and message requests can be added at checkout."
  },
  {
    id: "p2",
    name: "Vanilla Celebration Cake",
    category: "Cakes",
    price: 4200,
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80",
    description: "A light, buttery vanilla cake with a delicate sweetness and a classic celebration feel.",
    details: "A versatile choice for birthdays, family gatherings, showers and simple celebrations.",
    serving: "Serves approximately 8–10 people",
    note: "Made to order. Decoration and message requests can be added at checkout."
  },
  {
    id: "p3",
    name: "Cupcake Box",
    category: "Cupcakes",
    price: 1800,
    image: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=900&q=80",
    description: "A cheerful box of soft, freshly baked cupcakes — easy to share and even easier to love.",
    details: "Great for office treats, small celebrations, gifts or a sweet addition to a larger order.",
    serving: "Box contains 6 cupcakes",
    note: "Flavours and decoration can be confirmed with the bakery when ordering."
  },
  {
    id: "p4",
    name: "Butter Croissant Box",
    category: "Pastries",
    price: 2200,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80",
    description: "Golden, buttery croissants with crisp layers and a soft, tender centre.",
    details: "Perfect for breakfast tables, brunches, meetings or a box of something lovely to share.",
    serving: "Box contains 6 croissants",
    note: "Best enjoyed fresh. Availability may depend on the day's baking schedule."
  }
];
