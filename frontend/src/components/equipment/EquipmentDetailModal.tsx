'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import api from '@/lib/api';
import { getGoogleDriveImageUrl } from '@/lib/utils';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
        note: string;
        returnDate?: string;
    }[];
}

interface EquipmentDetailModalProps {
    code: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EquipmentDetailModal({ code, open, onOpenChange }: EquipmentDetailModalProps) {
    const { addItem } = useCartStore();
    const [data, setData] = useState<EquipmentDetail | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && code) {
            fetchDetails(code);
            setQuantity(1);
        } else {
             // Reset state when closed
             setData(null);
             setError(null);
        }
    }, [open, code]);

    const fetchDetails = async (code: string) => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.post('/equipment/item', { code });
            if (res.data.success) {
                setData(res.data.data);
            } else {
                setError(res.data.message);
            }
        } catch (err: any) {
            setError(err.message || "載入失敗");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{data?.info?.name || '器材詳情'}</DialogTitle>
                    <DialogDescription>{data?.info?.code || ''}</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-20 text-center">載入中...</div>
                ) : error ? (
                    <div className="py-20 text-center text-red-500">錯誤: {error}</div>
                ) : data ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Image & Basic Info */}
                        <div className="space-y-4">
                            <div className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden border relative">
                                {data.info.image ? (
                                    <img 
                                        src={getGoogleDriveImageUrl(data.info.image)} 
                                        alt={data.info.name} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                )}
                                <Badge className={`absolute top-2 right-2 ${
                                    data.info.available > 0 ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                    {data.info.available > 0 ? `剩餘: ${data.info.available}` : '已借完'}
                                </Badge>
                            </div>

                            <div className="flex gap-4">
                                <Card className="p-3 text-center flex-1">
                                    <div className="text-xl font-bold">{data.info.total}</div>
                                    <div className="text-xs text-gray-500">總數量</div>
                                </Card>
                                <Card className="p-3 text-center flex-1 bg-green-50 border-green-200">
                                    <div className="text-xl font-bold text-green-700">{data.info.available}</div>
                                    <div className="text-xs text-green-600">可借用</div>
                                </Card>
                            </div>

                            {/* Cart Actions */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center border rounded-md">
                                    <Button
                                        variant="ghost" 
                                        size="icon"
                                        className="h-10 w-12 rounded-none"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={data.info.available <= 0}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <div className="flex-1 text-center font-bold">{quantity}</div>
                                    <Button
                                        variant="ghost" 
                                        size="icon"
                                        className="h-10 w-12 rounded-none"
                                        onClick={() => setQuantity(Math.min(data.info.available, quantity + 1))}
                                        disabled={data.info.available <= 0 || quantity >= data.info.available}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button 
                                    className="w-full"
                                    size="lg"
                                    disabled={data.info.available <= 0}
                                    onClick={() => {
                                        addItem({
                                            code: data.info.code,
                                            name: data.info.name,
                                            image: data.info.image,
                                            quantity: quantity,
                                            maxQuantity: data.info.available
                                        });
                                        onOpenChange(false); 
                                        // alert(`已加入 ${quantity} 個 ${data.info.name} 到購物車`);
                                    }}
                                >
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    加入購物車
                                </Button>
                            </div>
                        </div>

                        {/* Right Column: Description & List */}
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-md text-sm text-gray-700 max-h-40 overflow-y-auto">
                                <h4 className="font-semibold mb-1">器材說明</h4>
                                <p className="whitespace-pre-wrap">{data.info.description || "無說明"}</p>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2 text-sm">庫存明細</h4>
                                <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="py-2">編號</TableHead>
                                                <TableHead className="py-2">狀態</TableHead>
                                                <TableHead className="py-2">備註</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-mono text-xs py-2">{item.id}</TableCell>
                                                    <TableCell className="py-2">
                                                        <Badge variant={
                                                            item.status === '可借用' ? 'default' : 
                                                            item.status === '已借出' ? 'secondary' : 'destructive'
                                                        } className={`text-[10px] px-1 ${
                                                            item.status === '可借用' ? 'bg-green-500 hover:bg-green-600' : ''
                                                        }`}>
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs py-2 text-gray-500">{item.note}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
