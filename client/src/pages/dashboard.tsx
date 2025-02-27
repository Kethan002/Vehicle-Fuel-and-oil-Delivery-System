import { useQuery } from "@tanstack/react-query";
import { Product, Order } from "@shared/schema";
import ProductCard from "@/components/products/product-card";
import OrderList from "@/components/orders/order-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
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
      <Tabs defaultValue="products">
        <TabsList className="w-full">
          <TabsTrigger value="products" className="flex-1">Browse Products</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1">My Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Available Fuel Products</h2>
              <p className="text-muted-foreground">Browse and order from our verified sellers</p>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
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
