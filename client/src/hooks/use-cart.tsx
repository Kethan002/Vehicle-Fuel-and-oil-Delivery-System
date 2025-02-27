import { createContext, ReactNode, useContext, useState } from "react";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  product: Product & {
    deliveryLatitude: number;
    deliveryLongitude: number;
    deliveryAddress: string;
  };
  quantity: number;
  sellerId: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product & {
    deliveryLatitude: number;
    deliveryLongitude: number;
    deliveryAddress: string;
  }, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  updateQuantity: (productId: number, quantity: number) => void;
  getSellerName: () => string | undefined;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = (product: Product & {
    deliveryLatitude: number;
    deliveryLongitude: number;
    deliveryAddress: string;
  }, quantity: number) => {
    // Only allow products from the same seller
    if (items.length > 0 && items[0].sellerId !== product.sellerId) {
      toast({
        title: "Cannot add products from different sellers",
        description: "Please complete or clear your current order first",
        variant: "destructive",
      });
      return;
    }

    const existingItem = items.find(item => item.product.id === product.id);
    if (existingItem) {
      setItems(items.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setItems([...items, { product, quantity, sellerId: product.sellerId }]);
    }

    toast({
      title: "Added to cart",
      description: `${quantity} ${product.name} added to your cart`,
    });
  };

  const removeFromCart = (productId: number) => {
    setItems(items.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setItems(items.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => 
      total + (Number(item.product.price) * item.quantity), 0
    );
  };

  const getSellerName = () => {
    return items[0]?.product.bunkName;
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      clearCart,
      getTotalPrice,
      updateQuantity,
      getSellerName,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}