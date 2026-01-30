'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import api from '@/lib/api';
import { getGoogleDriveImageUrl } from '@/lib/utils';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
// I will just update the import first separately or assume I can do it in one go if lines are close? They are not.
// I will split this into 2 replacements? No, tool allows contiguous.
// I will use multi_replace for Detail page.
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';

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
        id: string; // e.g., CAM-01-01
        status: string; // 可借用, 已借出...
        note: string;
        returnDate?: string;
    }[];
}

export default function EquipmentDetailPage() {
    const params = useParams(); // params.code
    // params is a Promise in Next.js 15+, but in 14/15 client components usually it unwraps or use `use` hook. 
    // Shadcn template uses Next 16? 
    // In Next 15+, useParams returns the params object directly in Client Components (it's a hook).
    // So params.code should be string.
    
    const router = useRouter();
    const { addItem } = useCartStore();
    const [data, setData] = useState<EquipmentDetail | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params?.code) {
           fetchDetails(params.code as string);
        }
    }, [params]);

    const fetchDetails = async (code: string) => {
        try {
            setLoading(true);
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

    if (loading) return <div className="p-10 text-center">載入中...</div>;
    if (error) return <div className="p-10 text-center text-red-500">錯誤: {error}</div>;
    if (!data) return <div className="p-10 text-center">找不到資料</div>;

    const { info, items } = data;

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:underline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> 返回列表
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Left: Image */}
                <div className="md:col-span-1">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                         {info.image ? (
                            <img 
                                src={info.image} 
                                alt={info.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=No+Image';
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Info */}
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <Badge variant="outline" className="mb-2">{info.category}</Badge>
                        <h1 className="text-3xl font-bold">{info.name}</h1>
                        <p className="text-gray-500 text-sm">代碼: {info.code}</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <Card className="p-4 text-center w-24">
                            <div className="text-2xl font-bold">{info.total}</div>
                            <div className="text-xs text-gray-500">總數量</div>
                        </Card>
                         <Card className="p-4 text-center w-24 bg-green-50 border-green-200">
                            <div className="text-2xl font-bold text-green-700">{info.available}</div>
                            <div className="text-xs text-green-600">可借用</div>
                        </Card>
                    </div>
                    
                    {/* Cart Actions */}
                    <div className="flex items-center gap-4 py-4">
                        <div className="flex items-center border rounded-md">
                            <Button
                                variant="ghost" 
                                size="icon"
                                className="h-10 w-10 rounded-none"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={info.available <= 0}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <div className="w-12 text-center font-bold">
                                {quantity}
                            </div>
                            <Button
                                variant="ghost" 
                                size="icon"
                                className="h-10 w-10 rounded-none"
                                onClick={() => setQuantity(Math.min(info.available, quantity + 1))}
                                disabled={info.available <= 0 || quantity >= info.available}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <Button 
                            size="lg" 
                            className="flex-1"
                            disabled={info.available <= 0}
                            onClick={() => {
                                addItem({
                                    code: info.code,
                                    name: info.name,
                                    image: info.image,
                                    quantity: quantity,
                                    maxQuantity: info.available
                                });
                                alert(`已加入 ${quantity} 個 ${info.name} 到購物車`);
                                setQuantity(1);
                            }}
                        >
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            加入借用清單
                        </Button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-md text-sm text-gray-700">
                        <h3 className="font-semibold mb-2">器材說明</h3>
                        <p className="whitespace-pre-wrap">{info.description || "無說明"}</p>
                    </div>
                </div>
            </div>

            {/* Item List */}
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">庫存狀態明細</h2>
                <div className="bg-white rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>器材編號 (ID)</TableHead>
                                <TableHead>狀態</TableHead>
                                <TableHead>備註</TableHead>
                                <TableHead>預計歸還</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-mono font-medium">{item.id}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            item.status === '可借用' ? 'default' : 
                                            item.status === '已借出' ? 'secondary' : 'destructive'
                                        } className={
                                            item.status === '可借用' ? 'bg-green-500 hover:bg-green-600' : ''
                                        }>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.note}</TableCell>
                                    <TableCell>{item.returnDate}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
