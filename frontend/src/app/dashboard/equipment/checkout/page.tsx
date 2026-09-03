'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { getGoogleDriveImageUrl } from '@/lib/utils';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes';

// Schema Definition
const checkoutSchema = z.object({
  reason: z.string().min(1, "請輸入借用原因"),
  pickupDate: z.string().optional().transform(val => val?.trim() === "" ? undefined : val).refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    const year = date.getFullYear();
    if (year > 9999) return false;
    
    // Check if date >= today (ignore time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(val);
    selected.setHours(0, 0, 0, 0); // Compare date part only
    return selected >= today;
  }, "不可選擇過去時間"),
  returnDate: z.string().min(1, "請選擇歸還日期").refine((val) => {
    const date = new Date(val);
    const year = date.getFullYear();
    if (year > 9999) return false;

    // Check if date >= today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(val);
    return selected >= today;
  }, "歸還日期不可早於今日"),
});

type CheckoutFormValues = z.input<typeof checkoutSchema>;

export default function CheckoutPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { items, removeItem, itemCount, clearCart } = useCartStore();
    const { user } = useAuthStore();
    
    // Form Initialization
    const form = useForm<CheckoutFormValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            reason: '',
            pickupDate: '',
            returnDate: '', // Controlled by native date picker
        },
    });

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isDirty = (form.formState.isDirty || (items.length > 0 && !!form.watch("reason"))) && !submitting;
    const { confirmDiscard } = useUnsavedChangesWarning(isDirty, {
        message: "您有尚未提交的器材借用申請內容，確定要離開嗎？\n\nAre you sure you want to leave? Your application has not been submitted.",
    });

    const onSubmit = async (data: CheckoutFormValues) => {
        setSubmitError(null);
        setSubmitting(true);

        try {
            if (items.length === 0) {
                throw new Error("借用清單是空的");
            }

            // Construct payload
            const payload = {
                items: JSON.stringify(items.map(i => ({
                    code: i.code,
                    name: i.name,
                    qty: i.quantity
                }))),
                summary: items.map(i => `${i.quantity}x ${i.name}`).join('\n'),
                reason: data.reason,
                pickupDate: data.pickupDate || "",
                returnDate: data.returnDate,
            };

            const res = await api.post('/equipment/submit_application', payload);

            if (res.data.success) {
                clearCart();
                // alert(`申請成功！單號: ...`); // Moved to toast for better UX
                toast({
                    title: "申請提交成功",
                    description: `單號: ${res.data.data.applicationId}`,
                });
                router.push('/dashboard/equipment/applications');
            } else {
                throw new Error(res.data.message || "提交失敗");
            }
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "發生未知錯誤";
            setSubmitError(message);
            toast({
                variant: 'destructive',
                title: "提交失敗",
                description: message,
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto pb-12">
                <AdminPageHeader
                    title="器材借用申請"
                    description="確認借用器材清單、數量，填寫借用原因與預計歸還時間。"
                />
                <div className="bg-white dark:bg-[#201e26] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-12 text-center">
                    <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">借用清單是空的</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">請先至器材目錄挑選需要的元件或模組加入清單。</p>
                    <Button onClick={() => router.push('/dashboard/equipment')} className="bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold">
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        返回器材目錄
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <AdminPageHeader
                title="器材借用申請"
                description="確認借用器材清單、數量，填寫借用原因與預計歸還時間。"
            >
                <Button
                    variant="outline"
                    onClick={() => {
                        if (!confirmDiscard()) return;
                        router.push('/dashboard/equipment');
                    }}
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                >
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    返回器材目錄
                </Button>
            </AdminPageHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Form */}
                <div className="md:col-span-2">
                    <Card className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
                        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/5">
                            <CardTitle className="text-lg font-bold">申請資料填寫</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                                    {/* Applicant Info (Read-only) */}
                                    <div>
                                        <div className="flex justify-between items-center h-5 mb-2">
                                            <FormLabel className="text-sm font-medium">申請人資訊</FormLabel>
                                        </div>
                                        <Input value={`${user?.name} (${user?.studentId})`} disabled className="bg-slate-50 dark:bg-white/5" />
                                    </div>

                                    {/* Reason */}
                                    <FormField
                                        control={form.control}
                                        name="reason"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex justify-between items-center h-5">
                                                    <FormLabel>
                                                        借用原因 <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    {form.formState.errors.reason && (
                                                        <span className="text-destructive text-xs leading-none">
                                                            {form.formState.errors.reason.message}
                                                        </span>
                                                    )}
                                                </div>
                                                <FormControl>
                                                    <Textarea 
                                                        placeholder="請說明借用用途 (例如: 期末專題展示、競賽製作)" 
                                                        {...field} 
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                                        {/* Pickup Date */}
                                        <FormField
                                            control={form.control}
                                            name="pickupDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <div className="flex justify-between items-center h-5">
                                                        <FormLabel>預計領取時間</FormLabel>
                                                        {form.formState.errors.pickupDate && (
                                                            <span className="text-destructive text-xs leading-none">
                                                                {form.formState.errors.pickupDate.message}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <FormControl>
                                                        <Input 
                                                            type="datetime-local" 
                                                            {...field} 
                                                            max="9999-12-31T23:59"
                                                        />
                                                    </FormControl>
                                                    <div className="h-5 flex items-center">
                                                        <p className="text-xs text-muted-foreground">留空則預設為最近一次社課時間</p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />

                                        {/* Return Date */}
                                        <FormField
                                            control={form.control}
                                            name="returnDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <div className="flex justify-between items-center h-5">
                                                        <FormLabel>
                                                            預計歸還日期 <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        {form.formState.errors.returnDate && (
                                                            <span className="text-destructive text-xs leading-none">
                                                                {form.formState.errors.returnDate.message}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <FormControl>
                                                        <Input 
                                                            type="date" 
                                                            {...field} 
                                                            max="9999-12-31"
                                                        />
                                                    </FormControl>
                                                    <div className="h-5"></div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {submitError && (
                                        <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-sm">
                                            {submitError}
                                        </div>
                                    )}

                                    <Button type="submit" className="w-full bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold h-10 mt-2" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                提交中...
                                            </>
                                        ) : '確認提交借用申請'}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Summary */}
                <div>
                    <Card className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
                        <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/5">
                            <CardTitle className="text-base font-bold">借用清單 ({itemCount()})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {items.map((item) => (
                                <div key={item.code} className="flex gap-3 text-sm border-b border-slate-100 dark:border-white/5 pb-3 last:border-0 last:pb-0">
                                    <div className="h-12 w-12 bg-slate-100 dark:bg-white/5 rounded-lg overflow-hidden shrink-0 border border-slate-200/50 dark:border-white/5">
                                        {item.image ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img 
                                                src={getGoogleDriveImageUrl(item.image)} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-[10px] text-slate-400">無圖</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</div>
                                        <div className="text-slate-500 dark:text-slate-400 text-xs">數量: {item.quantity}</div>
                                    </div>
                                    <div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            onClick={() => removeItem(item.code)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
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
