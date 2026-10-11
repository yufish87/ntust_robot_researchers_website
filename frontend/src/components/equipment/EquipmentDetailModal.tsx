"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import api from "@/lib/api";
import { getGoogleDriveImageUrl } from "@/lib/utils";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EquipmentDetail {
  info: {
    code: string;
    name: string;
    category: string;
    description: string;
    total: number;
    available: number;
    borrowed: number;
    image: string;
  };
  items: {
    id: string;
    status: string;
    usage: string;
    note: string;
    returnDate?: string;
  }[];
}

interface EquipmentDetailModalProps {
  data: EquipmentDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentDetailModal({
  data,
  open,
  onOpenChange,
}: EquipmentDetailModalProps) {
  const { items: cartItems, addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const isConsumable = data?.info?.category === "耗材";

  const availableItems = data?.items?.filter((item) => item.usage === "可借用") || [];

  useEffect(() => {
    if (open && data?.info) {
      const existingInCart = cartItems.find((i) => i.code === data.info.code);
      if (existingInCart?.selectedItemIds && existingInCart.selectedItemIds.length > 0) {
        setSelectedItemIds(existingInCart.selectedItemIds);
        setQuantity(existingInCart.selectedItemIds.length);
      } else {
        setSelectedItemIds([]);
        setQuantity(1);
      }
    }
  }, [open, data, cartItems]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      setQuantity(next.length > 0 ? next.length : 1);
      return next;
    });
  };

  const handleSelectAllAvailable = () => {
    if (availableItems.length === 0) return;
    const allIds = availableItems.map((i) => i.id);
    setSelectedItemIds(allIds);
    setQuantity(allIds.length > 0 ? allIds.length : 1);
  };

  const handleClearSelection = () => {
    setSelectedItemIds([]);
    setQuantity(1);
  };

  const handleIncreaseQuantity = () => {
    const nextAvailable = availableItems.find((i) => !selectedItemIds.includes(i.id));
    if (nextAvailable) {
      const next = [...selectedItemIds, nextAvailable.id];
      setSelectedItemIds(next);
      setQuantity(next.length);
    } else if (quantity < (data?.info?.available || 0)) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (selectedItemIds.length > 0) {
      const next = selectedItemIds.slice(0, -1);
      setSelectedItemIds(next);
      setQuantity(next.length > 0 ? next.length : 1);
    } else if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader className="mb-2">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {data?.info?.name || "器材詳情"}
              </DialogTitle>
              <DialogDescription className="text-base mt-1 font-mono">
                {data?.info?.code || ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!data ? (
          <div className="py-20 text-center text-gray-500">載入中...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8">
            {/* 左側：圖片與數據 */}
            <div className="space-y-6">
              <div className="aspect-[4/3] w-full bg-gray-100 rounded-xl overflow-hidden border relative shadow-sm">
                {data.info.image ? (
                  <img
                    src={getGoogleDriveImageUrl(data.info.image)}
                    alt={data.info.name}
                    className="w-full h-full object-contain bg-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/600x400?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Image
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge
                    className={`px-3 py-1 text-sm shadow-sm ${
                      data.info.available > 0
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {data.info.available > 0
                      ? `剩餘: ${data.info.available}`
                      : "已借完"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-4 text-center bg-slate-50 border-slate-200">
                  <div className="text-3xl font-bold text-slate-700">
                    {data.info.total}
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    總數量
                  </div>
                </Card>
                <Card className="p-4 text-center bg-green-50 border-green-200">
                  <div className="text-3xl font-bold text-green-700">
                    {data.info.available}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    可借用
                  </div>
                </Card>
              </div>
            </div>

            {/* 右側：詳細資訊與操作 */}
            <div className="flex flex-col h-full space-y-6">
              {/* 購物車操作 */}
              <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
                {isConsumable ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    此分類為耗材，可直接向社團取用，不需加入借用清單與送出審核。
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">
                        借用數量 {selectedItemIds.length > 0 && `(已勾選 ${selectedItemIds.length} 台)`}
                      </span>
                      <div className="flex items-center border rounded-lg overflow-hidden">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="減少借用數量"
                          className="h-10 w-12 rounded-none hover:bg-slate-100"
                          onClick={handleDecreaseQuantity}
                          disabled={data.info.available <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="w-12 text-center font-bold text-lg">
                          {selectedItemIds.length > 0 ? selectedItemIds.length : quantity}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="增加借用數量"
                          className="h-10 w-12 rounded-none hover:bg-slate-100"
                          onClick={handleIncreaseQuantity}
                          disabled={
                            data.info.available <= 0 ||
                            (selectedItemIds.length > 0
                              ? selectedItemIds.length >= data.info.available
                              : quantity >= data.info.available)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="w-full text-lg h-12 shadow-md transition-all hover:scale-[1.01] bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold"
                      size="lg"
                      disabled={data.info.available <= 0}
                      onClick={() => {
                        const finalQty = selectedItemIds.length > 0 ? selectedItemIds.length : quantity;
                        addItem({
                          code: data.info.code,
                          name: data.info.name,
                          image: data.info.image,
                          quantity: finalQty,
                          maxQuantity: data.info.available,
                          category: data.info.category,
                          selectedItemIds: selectedItemIds.length > 0 ? selectedItemIds : undefined,
                        });
                        onOpenChange(false);
                      }}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      加入借用清單
                    </Button>
                  </>
                )}
              </div>

              {/* 庫存明細列表 */}
              <div className="flex-1 flex flex-col min-h-[300px] md:min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-lg">庫存明細</h4>
                  {availableItems.length > 0 && !isConsumable && (
                    <div className="flex items-center gap-1">
                      {selectedItemIds.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSelection}
                          className="text-xs text-slate-500 hover:text-slate-800 font-medium h-7 px-2"
                        >
                          清除選取
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAllAvailable}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium h-7 px-2"
                      >
                        全選
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden flex-1 relative">
                  <div className="absolute inset-0 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow>
                          {!isConsumable && (
                            <TableHead className="w-10 text-center">選取</TableHead>
                          )}
                          <TableHead className="w-[20%]">編號</TableHead>
                          <TableHead className="w-[20%]">使用情形</TableHead>
                          <TableHead className="w-[50%]">器材狀態</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.items.map((item) => {
                          const isAvailable = item.usage === "可借用";
                          const isSelected = selectedItemIds.includes(item.id);

                          return (
                            <TableRow
                              key={item.id}
                              className={`transition-colors ${
                                isAvailable
                                  ? isSelected
                                    ? "bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50"
                                    : "hover:bg-slate-50 cursor-pointer"
                                  : "opacity-60 bg-slate-50/30"
                              }`}
                              onClick={() => {
                                if (isAvailable && !isConsumable) {
                                  handleToggleItem(item.id);
                                }
                              }}
                            >
                              {!isConsumable && (
                                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    aria-label={`選取器材編號 ${item.id}`}
                                    checked={isSelected}
                                    disabled={!isAvailable}
                                    onChange={() => handleToggleItem(item.id)}
                                    className="h-4 w-4 rounded border-slate-300 accent-[#ffc000] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                  />
                                </TableCell>
                              )}
                              <TableCell className="font-mono font-medium">
                                {item.id}
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const s = item.usage;
                                  if (!s) return null;

                                  if (s === "可借用") {
                                    return (
                                      <Badge className="bg-green-500 hover:bg-green-600">
                                        {s}
                                      </Badge>
                                    );
                                  }
                                  if (s === "審核中") {
                                    return (
                                      <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                        {s}
                                      </Badge>
                                    );
                                  }
                                  if (s === "已借出" || s === "維修中") {
                                    return (
                                      <Badge variant="destructive">{s}</Badge>
                                    );
                                  }
                                  if (s === "已報廢") {
                                    return (
                                      <Badge className="bg-gray-800 hover:bg-gray-900">
                                        {s}
                                      </Badge>
                                    );
                                  }

                                  return <Badge variant="outline">{s}</Badge>;
                                })()}
                              </TableCell>
                              <TableCell className="text-slate-600 text-xs sm:text-sm">
                                {item.status || "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
