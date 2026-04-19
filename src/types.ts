export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  createdAt: any;
}

export interface Setting {
  storeName: string;
  whatsappNumber: string;
  currencySymbol: string;
  paymentInfo?: string; // e.g. "BCA: 1234567890 a/n TokoWA"
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
}
