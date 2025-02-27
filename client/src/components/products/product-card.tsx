import { useState, useEffect } from "react";
import { Product } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Loader2, Navigation } from "lucide-react";

interface ProductCardProps {
  product: Product;
  sellerLocation: {
    lat: number;
    lng: number;
  };
}

export default function ProductCard({ product, sellerLocation }: ProductCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState("1");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        // Get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          setUserLocation({
            lat: latitude,
            lng: longitude,
            address: data.display_name
          });
        } catch (error) {
          console.error("Error getting address:", error);
        }
      });
    }
  }, []);

  const orderMutation = useMutation({
    mutationFn: async (data: {
      productId: number;
      quantity: number;
      deliveryLatitude: number;
      deliveryLongitude: number;
      deliveryAddress: string;
    }) => {
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

    if (!userLocation) {
      toast({
        title: "Location required",
        description: "Please enable location services to place an order",
        variant: "destructive",
      });
      return;
    }

    orderMutation.mutate({
      productId: product.id,
      quantity: Number(quantity),
      deliveryLatitude: userLocation.lat,
      deliveryLongitude: userLocation.lng,
      deliveryAddress: userLocation.address
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
        <div className="flex items-center text-sm text-muted-foreground">
          <span className="capitalize mr-2">{product.productType}</span>
          {product.description && <span>• {product.description}</span>}
        </div>
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
              <p className="text-sm text-muted-foreground">
                Total: ₹{(Number(quantity) * Number(product.price)).toFixed(2)}
              </p>
              {userLocation && (
                <div className="text-sm text-muted-foreground flex items-center">
                  <Navigation className="h-4 w-4 mr-1" />
                  Delivery to: {userLocation.address}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}