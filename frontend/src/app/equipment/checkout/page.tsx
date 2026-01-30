'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getGoogleDriveImageUrl } from '@/lib/utils';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, removeItem, itemCount, clearCart } = useCartStore();
    const { user } = useAuthStore();
    
    // Form State
    const [reason, setReason] = useState('');
    const [pickupDate, setPickupDate] = useState(''); // Allow string input or use DatePicker later
    const [returnDate, setReturnDate] = useState('');
    
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if empty cart?
    useEffect(() => {
        // Hydration check effectively handled by store persistence delay, 
        // but normally we might want to wait. 
        // For now, if user lands here with empty cart, show message.
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            if (items.length === 0) {
                throw new Error("購物車是空的");
            }

            // Construct payload matching GAS Check
            // Application: { applicantId, name, reason, items (JSON), pickupDate, returnDate }
            const payload = {
                items: JSON.stringify(items.map(i => ({
                    code: i.code,
                    name: i.name,
                    qty: i.quantity
                }))),
                summary: items.map(i => `${i.quantity}x ${i.name}`).join('\n'), // For human readability in sheet
                reason,
                pickupDate,
                returnDate,
            };

            const res = await api.post('/equipment/submit_application', payload);

            if (res.data.success) {
                clearCart();
                alert(`申請成功！單號: ${res.data.data.applicationId}`); // Assuming backend returns ID
                router.push('/dashboard/applications'); // Redirect to my applications
            } else {
                throw new Error(res.data.message || "提交失敗");
            }
        } catch (err: any) {
            setError(err.message || "發生未知錯誤");
        } finally {
            setSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="container mx-auto p-10 text-center">
                <h1 className="text-2xl font-bold mb-4">購物車是空的</h1>
                <Button onClick={() => router.push('/equipment')}>
                    返回器材目錄
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
             <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:underline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> 返回
            </Button>
            
            <h1 className="text-3xl font-bold mb-8">借用申請確認</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Form */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>申請資料</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label>申請人</Label>
                                    <Input value={`${user?.name} (${user?.studentId})`} disabled className="bg-gray-50" />
                                </div>

                                <div>
                                    <Label htmlFor="reason">借用原因 <span className="text-red-500">*</span></Label>
                                    <Textarea 
                                        id="reason" 
                                        placeholder="請說明借用用途 (例如: 期末專題展示)" 
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        required 
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="pickupDate">預計領取時間</Label>
                                        <Input 
                                            id="pickupDate" 
                                            type="datetime-local" 
                                            value={pickupDate}
                                            onChange={(e) => setPickupDate(e.target.value)}
                                            // required? Optional in spec, but good to have
                                        />
                                        <p className="text-xs text-gray-500 mt-1">留空則預設為最近一次社課時間</p>
                                    </div>
                                    <div>
                                        <Label htmlFor="returnDate">預計歸還日期 <span className="text-red-500">*</span></Label>
                                        <Input 
                                            id="returnDate" 
                                            type="date" 
                                            value={returnDate}
                                            onChange={(e) => setReturnDate(e.target.value)}
                                            required 
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={submitting}>
                                    {submitting ? '提交中...' : '確認提交申請'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Summary */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>器材清單 ({itemCount()})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {items.map((item) => (
                                <div key={item.code} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                                    <div className="h-12 w-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                        {item.image ? (
                                            <img 
                                                src={getGoogleDriveImageUrl(item.image)} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400">No Img</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-gray-500">x {item.quantity}</div>
                                    </div>
                                    <div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 text-red-400 hover:text-red-600"
                                            onClick={() => removeItem(item.code)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
