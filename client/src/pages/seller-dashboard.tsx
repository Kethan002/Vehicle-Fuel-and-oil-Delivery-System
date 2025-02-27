import { useQuery } from "@tanstack/react-query";
import { Product, Order } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import OrderList from "@/components/orders/order-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertProductSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Package, TruckIcon, StarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SellerDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const myProducts = products?.filter((p) => p.sellerId === user?.id) || [];
  
  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      unit: "liter",
      available: true,
      productType: "fuel" //Added default value
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      form.reset();
      toast({
        title: "Product created",
        description: "Your product has been added successfully",
      });
    },
  });

  if (isLoadingProducts || isLoadingOrders) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    products: myProducts.length,
    orders: orders?.filter((o) => o.sellerId === user?.id).length || 0,
    revenue: orders
      ?.filter((o) => o.sellerId === user?.id)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0),
  };

  return (
    <div className="container py-8">
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <StarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="w-full">
          <TabsTrigger value="products" className="flex-1">Manage Products</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1">Manage Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Add New Product</h3>
              <p className="text-sm text-muted-foreground">
                Create a new fuel or oil product listing
              </p>
            </div>
            <Separator />
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => createProductMutation.mutate(data))}
                className="space-y-4 max-w-md"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                        >
                          <option value="fuel">Fuel</option>
                          <option value="oil">Vehicle Oil</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                          >
                            <option value="liter">Liter</option>
                            <option value="kg">Kilogram</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Product
                </Button>
              </form>
            </Form>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Your Products</h3>
              <div className="grid gap-4">
                {myProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ₹{product.price}/{product.unit}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          queryClient.setQueryData(["/api/products"], (old: Product[]) =>
                            old.map((p) =>
                              p.id === product.id
                                ? { ...p, available: !p.available }
                                : p
                            )
                          )
                        }
                      >
                        {product.available ? "Mark Unavailable" : "Mark Available"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Manage Orders</h2>
              <p className="text-muted-foreground">View and update order status</p>
            </div>
            <Separator />
            <OrderList orders={orders || []} userType="seller" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}