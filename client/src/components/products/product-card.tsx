import { Product } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState("1");

  const orderMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number }) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order placed successfully",
        description: "Your order has been placed and will be delivered soon",
      });
      setQuantity("1");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOrder = () => {
    if (!product.available) {
      toast({
        title: "Product unavailable",
        description: "This product is currently out of stock",
        variant: "destructive",
      });
      return;
    }

    orderMutation.mutate({
      productId: product.id,
      quantity: Number(quantity),
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{product.name}</CardTitle>
          <span
            className={`text-sm px-2 py-1 rounded-full ${
              product.available
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {product.available ? "In Stock" : "Out of Stock"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{product.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              ₹{product.price}
              <span className="text-sm text-muted-foreground">/{product.unit}</span>
            </div>
          </div>

          {user?.role === "user" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-24"
                />
                <Button
                  className="flex-1"
                  onClick={handleOrder}
                  disabled={orderMutation.isPending || !product.available}
                >
                  {orderMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Order Now
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-right">
                Total: ₹{(Number(quantity) * Number(product.price)).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
