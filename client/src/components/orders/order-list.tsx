import { Order } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, CheckCircle, TruckIcon, Clock } from "lucide-react";

interface OrderListProps {
  orders: Order[];
  userType: "user" | "seller";
}

export default function OrderList({ orders, userType }: OrderListProps) {
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: number;
      status: "accepted" | "delivered";
    }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, {
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order status updated",
        description: "The order status has been updated successfully",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "placed":
        return "Order Placed";
      case "accepted":
        return "Product is on the way";
      case "delivered":
        return "Delivered";
      default:
        return status;
    }
  };

  const formatDeliveryTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes > 0 ? `${remainingMinutes} minutes` : ''}`;
  };

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No orders found
          </CardContent>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order #{order.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusMessage(order.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-medium">₹{order.totalAmount}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {order.quantity}
                    </p>
                    {order.estimatedDeliveryTime && (order.status === "placed" || order.status === "accepted") && (
                      <p className="text-sm text-muted-foreground flex items-center mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        Estimated delivery in: {formatDeliveryTime(Math.ceil(order.estimatedDeliveryTime / 60))}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Delivery to: {order.deliveryAddress}
                    </p>
                  </div>

                  {userType === "seller" && order.status === "placed" && (
                    <Button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          orderId: order.id,
                          status: "accepted",
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Order
                    </Button>
                  )}

                  {userType === "seller" && order.status === "accepted" && (
                    <Button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          orderId: order.id,
                          status: "delivered",
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <TruckIcon className="mr-2 h-4 w-4" />
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}