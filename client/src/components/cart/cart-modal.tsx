import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart, Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function CartModal() {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      // Create an order for each item in the cart
      const orders = await Promise.all(
        items.map(async (item) => {
          const res = await apiRequest("POST", "/api/orders", {
            productId: item.product.id,
            quantity: Number(item.quantity),
            deliveryLatitude: Number(item.product.deliveryLatitude),
            deliveryLongitude: Number(item.product.deliveryLongitude),
            deliveryAddress: item.product.deliveryAddress,
          });
          return res.json();
        })
      );
      return orders;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      clearCart();
      setIsOpen(false);
      toast({
        title: "Orders placed successfully",
        description: "Your orders have been placed and will be delivered soon",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place orders",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 py-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between space-x-4"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      ₹{item.product.price}/{item.product.unit}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                      className="w-16 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>₹{getTotalPrice().toFixed(2)}</span>
              </div>
              <Button
                className="w-full"
                onClick={() => placeOrderMutation.mutate()}
                disabled={placeOrderMutation.isPending}
              >
                {placeOrderMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Place Order
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}