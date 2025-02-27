import { useQuery } from "@tanstack/react-query";
import { Product, Order, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Users, Package, TruckIcon } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (isLoadingProducts || isLoadingOrders) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    totalUsers: users?.length || 0,
    totalProducts: products?.length || 0,
    totalOrders: orders?.length || 0,
    totalRevenue: orders?.reduce((sum, order) => sum + Number(order.totalAmount), 0) || 0,
  };

  return (
    <div className="container py-8">
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-2xl">₹</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="w-full">
          <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">User Management</h2>
              <p className="text-muted-foreground">Monitor user and seller accounts</p>
            </div>
            <Separator />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.address}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Order Monitoring</h2>
              <p className="text-muted-foreground">Track all transactions</p>
            </div>
            <Separator />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {users?.find((u) => u.id === order.userId)?.name}
                    </TableCell>
                    <TableCell>
                      {users?.find((u) => u.id === order.sellerId)?.name}
                    </TableCell>
                    <TableCell>₹{order.totalAmount}</TableCell>
                    <TableCell className="capitalize">{order.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
