import { useQuery } from "@tanstack/react-query";
import { Product, User, Order } from "@shared/schema";
import ProductCard from "@/components/products/product-card";
import OrderList from "@/components/orders/order-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Navigation } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(null);

  const { data: sellers } = useQuery<User[]>({
    queryKey: ["/api/sellers"],
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    }
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const nearbySellers = sellers?.filter(seller => {
    if (!coordinates || !seller.latitude || !seller.longitude) return false;
    const distance = calculateDistance(
      coordinates.lat,
      coordinates.lng,
      Number(seller.latitude),
      Number(seller.longitude)
    );
    return distance <= 10; // Show sellers within 10km radius
  });

  if (isLoadingProducts || isLoadingOrders) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Tabs defaultValue="bunks">
        <TabsList className="w-full">
          <TabsTrigger value="bunks" className="flex-1">Nearby Bunks</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1">My Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="bunks" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Nearby Fuel Bunks</h2>
              <p className="text-muted-foreground">Find fuel and oil products near you</p>
            </div>
            <Separator />
            <div className="grid gap-6">
              {nearbySellers?.map((seller) => (
                <Card key={seller.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{seller.bunkName}</h3>
                        <p className="text-muted-foreground">{seller.address}</p>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Navigation className="h-4 w-4 mr-1" />
                        {coordinates && seller.latitude && seller.longitude ? (
                          <span>{calculateDistance(
                            coordinates.lat,
                            coordinates.lng,
                            Number(seller.latitude),
                            Number(seller.longitude)
                          ).toFixed(1)} km</span>
                        ) : (
                          <span>Distance not available</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products
                        ?.filter(p => p.sellerId === seller.id)
                        .map((product) => (
                          <ProductCard 
                            key={product.id} 
                            product={product}
                            sellerLocation={{
                              lat: Number(seller.latitude),
                              lng: Number(seller.longitude)
                            }}
                          />
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Order History</h2>
              <p className="text-muted-foreground">Track your fuel orders and deliveries</p>
            </div>
            <Separator />
            <OrderList orders={orders || []} userType="user" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}