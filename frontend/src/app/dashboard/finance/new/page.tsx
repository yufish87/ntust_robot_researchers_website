"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Loader2, Plus, Trash2, ArrowLeft, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileUpload, FileUploadRef } from "@/components/ui/file-upload";
import { FinanceAPI } from "@/lib/api/finance";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes";

// --- Schema Definitions (Aligned with process.txt) ---

// Item Schema
// JSON Format: { itemName, itemSpec, expenseType, quantity, totalPrice }
// We add unitPrice for UI calculation convenience
const itemSchema = z.object({
  itemName: z.string().min(1, "請輸入品名"),
  itemSpec: z.string().min(1, "請輸入規格"),
  expenseType: z.enum(["文具費", "印刷費", "工具費", "器材費", "消耗性材料費"]),
  quantity: z.coerce.number().min(1, "數量至少為 1"),
  unitPrice: z.coerce.number().min(1, "單價必須大於 0"),
});

// App Schema
// App Schema
const formSchema = z.object({
  category: z.enum(["一般報銷", "社團內部競賽報銷", "上銀競賽報銷", "暑期營隊報銷"]),
  description: z.string().min(5, "請輸入詳細說明 (至少 5 字)"),
  invoiceType: z.enum([
    "電子發票",
    "紙本長條發票",
    "二聯式發票",
    "三聯式發票",
    "免用統一發票收據",
    "其他證明文件"
  ]),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().min(1, "請選擇發票日期").refine((val) => {
    return val <= format(new Date(), "yyyy-MM-dd");
  }, "發票日期不可為未來日期"),
  items: z.array(itemSchema).min(1, "至少需要一項費用明細"),
  fileId: z.string().min(1, "請上傳發票畫面/單據"),
}).superRefine((data, ctx) => {
  // Conditional Validation for Invoice Number
  const exemptions = ["免用統一發票收據", "其他證明文件"];
  if (!exemptions.includes(data.invoiceType)) {
    if (!data.invoiceNumber || data.invoiceNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "此發票種類需填寫發票號碼",
        path: ["invoiceNumber"],
      });
    }
  }
});

type FormInputValues = z.input<typeof formSchema>;

export default function NewFinanceApplicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileUploadRef = useRef<FileUploadRef>(null);

  const form = useForm<FormInputValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "一般報銷",
      description: "",
      invoiceType: "電子發票",
      invoiceNumber: "",
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      items: [{ itemName: "", itemSpec: "", expenseType: "文具費", quantity: 1, unitPrice: 0 }],
      fileId: "",
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items" as never,
  });

  // Calculate Total Amount
  // totalPrice = quantity * unitPrice
  const items = form.watch("items");
  const totalAmount = (items || []).reduce((sum: number, item: any) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.unitPrice) || 0;
    return sum + (q * p);
  }, 0);

  const isDirty =
    (form.formState.isDirty ||
      Boolean(form.watch("description")?.trim()) ||
      Boolean(form.watch("fileId")) ||
      totalAmount > 0) &&
    !isSubmitting;

  const { confirmDiscard } = useUnsavedChangesWarning(isDirty, {
    message:
      "您有尚未提交的經費報帳申請資料，確定要離開嗎？\n\nAre you sure you want to leave? Your application has not been submitted.",
  });

  const onSubmit: SubmitHandler<FormInputValues> = async (data) => {
    setIsSubmitting(true);
    try {
      // 2. Submit Application (Phase 1)
      const transformedItems = data.items.map((item: any) => ({
        itemName: item.itemName,
        itemSpec: item.itemSpec,
        expenseType: item.expenseType,
        quantity: Number(item.quantity),
        totalPrice: Number(item.quantity) * Number(item.unitPrice) 
      }));

      const payload = {
        category: data.category,
        description: data.description,
        invoiceType: data.invoiceType,
        invoiceNumber: data.invoiceNumber || "",
        invoiceDate: data.invoiceDate,
        items: transformedItems, // Send the transformed array
        fileId: (data.fileId === "pending" ? "" : data.fileId) || "",
        totalAmount: totalAmount,
      };

      // 2. 提交申請資料 (取得 Application ID)
      const appResult = await FinanceAPI.submit(payload);
      
      const appId = appResult.data?.id;

      if (!appId) throw new Error("提交成功但無單號回傳");

      // 3. 上傳檔案 (Phase 2)
      // FileUpload.upload 已經處理了重新命名與取得 ID
      if (fileUploadRef.current) {
         const fileId = await fileUploadRef.current.upload(appId);
         
         // 4. 關聯檔案 (Phase 3)
         await FinanceAPI.updateFile(appId, fileId);
      }

      toast({
        title: "申請提交成功",
        description: "您的財務報帳申請已送出，請等待審核。",
      });

      router.push("/dashboard/finance");
      router.refresh(); 
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      toast({
        variant: "destructive",
        title: "提交失敗",
        description: error.response?.data?.error || "請稍後再試。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <AdminPageHeader
        title="新增財務報帳申請"
        description="請依照社團財務規範填寫各項支出明細、發票收據種類並上傳單據畫面。"
      >
        <Button
          variant="outline"
          onClick={() => {
            if (!confirmDiscard()) return;
            router.push('/dashboard/finance');
          }}
          className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white cursor-pointer text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          返回報帳清單
        </Button>
      </AdminPageHeader>

      <Form {...form}>
        <form 
          noValidate
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            toast({
              variant: "destructive",
              title: "表單驗證失敗",
              description: "請檢查欄位是否填寫正確 (必填欄位標示紅色錯誤)",
            });
          })} 
          className="space-y-8"
        >
          
          <Card>
            <CardHeader>
              <CardTitle>基本資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>
                          報帳類別 <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        {form.formState.errors.category && (
                          <span className="text-destructive text-xs leading-none">{form.formState.errors.category.message}</span>
                        )}
                      </div>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="選擇類別" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper">
                          <SelectItem value="一般報銷">一般報銷</SelectItem>
                          <SelectItem value="社團內部競賽報銷">社團內部競賽報銷</SelectItem>
                          <SelectItem value="上銀競賽報銷">上銀競賽報銷</SelectItem>
                          <SelectItem value="暑期營隊報銷">暑期營隊報銷</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceType"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>
                          發票種類 <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                         {form.formState.errors.invoiceType && (
                          <span className="text-destructive text-xs leading-none">{form.formState.errors.invoiceType.message}</span>
                        )}
                      </div>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="選擇發票種類" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper">
                          <SelectItem value="電子發票">電子發票</SelectItem>
                          <SelectItem value="紙本長條發票">紙本長條發票</SelectItem>
                          <SelectItem value="二聯式發票">二聯式發票</SelectItem>
                          <SelectItem value="三聯式發票">三聯式發票</SelectItem>
                          <SelectItem value="免用統一發票收據">免用統一發票收據</SelectItem>
                          <SelectItem value="其他證明文件">其他證明文件</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>
                          發票號碼
                          {!["免用統一發票收據", "其他證明文件"].includes(form.watch("invoiceType")) && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </FormLabel>
                        {form.formState.errors.invoiceNumber && (
                          <span className="text-destructive text-xs leading-none">{form.formState.errors.invoiceNumber.message}</span>
                        )}
                      </div>
                      <FormControl>
                        <Input placeholder="例如: AB12345678" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>
                          發票/單據日期 <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                         {form.formState.errors.invoiceDate && (
                          <span className="text-destructive text-xs leading-none">{form.formState.errors.invoiceDate.message}</span>
                        )}
                      </div>
                      <FormControl>
                        <Input type="date" {...field} max={format(new Date(), "yyyy-MM-dd")} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>
                          支出說明 <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        {form.formState.errors.description && (
                          <span className="text-destructive text-xs leading-none">{form.formState.errors.description.message}</span>
                        )}
                      </div>
                    <FormControl>
                      <Textarea 
                        placeholder="請詳細說明此筆支出的用途、活動名稱等..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-bold">費用明細</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ itemName: "", itemSpec: "", expenseType: "文具費", quantity: 1, unitPrice: 0 })}
                className="cursor-pointer text-xs h-8"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                新增項目
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border border-slate-200/80 dark:border-white/10 p-4 rounded-xl bg-slate-50/50 dark:bg-white/5">
                  
                  {/* Row 1: Item Name (3) + Spec (6) + Delete (3) */}
                  <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemName` as const}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center h-5">
                            <FormLabel>
                              品名 <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                             {form.formState.errors.items?.[index]?.itemName && (
                              <span className="text-destructive text-xs leading-none">{form.formState.errors.items[index]?.itemName?.message}</span>
                            )}
                          </div>
                          <FormControl>
                            <Input placeholder="例如: 投影機" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-6">
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemSpec` as const}
                      render={({ field }) => (
                        <FormItem>
                           <div className="flex justify-between items-center h-5">
                             <FormLabel>
                               規格/詳細說明 <span className="text-red-500 ml-1">*</span>
                             </FormLabel>
                              {form.formState.errors.items?.[index]?.itemSpec && (
                              <span className="text-destructive text-xs leading-none">{form.formState.errors.items[index]?.itemSpec?.message}</span>
                            )}
                           </div>
                          <FormControl>
                            <Input placeholder="例如: 1台/4小時" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                     {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                   {/* Row 2: Type (3) + Quantity (3) + Unit Price (3) + Subtotal (3) */}
                   <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.expenseType` as const}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center h-5">
                            <FormLabel>
                              費用類型 <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                             {form.formState.errors.items?.[index]?.expenseType && (
                              <span className="text-destructive text-xs leading-none">{form.formState.errors.items[index]?.expenseType?.message}</span>
                            )}
                          </div>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="類型" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent position="popper">
                              <SelectItem value="文具費">文具費</SelectItem>
                              <SelectItem value="印刷費">印刷費</SelectItem>
                              <SelectItem value="工具費">工具費</SelectItem>
                              <SelectItem value="器材費">器材費</SelectItem>
                              <SelectItem value="消耗性材料費">消耗性材料費</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                   <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity` as const}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center h-5">
                            <FormLabel>
                              數量 <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                             {form.formState.errors.items?.[index]?.quantity && (
                              <span className="text-destructive text-xs leading-none">{form.formState.errors.items[index]?.quantity?.message}</span>
                            )}
                          </div>
                          <FormControl>
                            <Input type="number" {...field} value={field.value as number} min={1} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                   <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice` as const}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center h-5">
                            <FormLabel>
                              單價 <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                             {form.formState.errors.items?.[index]?.unitPrice && (
                              <span className="text-destructive text-xs leading-none">{form.formState.errors.items[index]?.unitPrice?.message}</span>
                            )}
                          </div>
                          <FormControl>
                            <Input type="number" {...field} value={field.value as number} min={1} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-3 flex flex-col justify-center bg-slate-100 dark:bg-white/10 p-3 rounded-lg h-[4.5rem]">
                     <span className="text-xs text-muted-foreground">小計</span>
                     <span className="font-semibold text-slate-900 dark:text-white">
                       NT$ {((Number(form.watch(`items.${index}.quantity`)) || 0) * (Number(form.watch(`items.${index}.unitPrice`)) || 0)).toLocaleString()}
                     </span>
                  </div>

                </div>
              ))}
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center bg-amber-500/10 dark:bg-[#ffc000]/10 p-4 rounded-xl border border-amber-500/20 dark:border-[#ffc000]/20">
                <span className="font-semibold text-base sm:text-lg">總金額 (Total)</span>
                <span className="font-bold text-2xl sm:text-3xl text-amber-600 dark:text-[#ffc000]">
                  NT$ {totalAmount.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-[#201e26] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold">
                  發票畫面/單據上傳 <span className="text-red-500 ml-1">*</span>
                </CardTitle>
                {form.formState.errors.fileId && (
                  <div className="text-destructive text-sm font-medium flex items-center animate-in fade-in slide-in-from-left-1">
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    {form.formState.errors.fileId.message?.toString()}
                  </div>
                )}
              </div>
              <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                請上傳清晰的發票或收據照片 (支援 JPG, PNG, PDF)。檔案將儲存於社團雲端。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="fileId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUpload
                        ref={fileUploadRef}
                        onFileChange={(file) => {
                           if (file) {
                             field.onChange("pending");
                             form.clearErrors("fileId");
                           } else {
                             field.onChange("");
                           }
                        }}
                        onUploadComplete={(fileId: string) => {
                          field.onChange(fileId);
                        }}
                        accept="image/*,application/pdf"
                        className={form.formState.errors.fileId ? "border-red-500 bg-red-50" : ""}
                      />
                    </FormControl>
                    {field.value && (
                       <p className="text-sm text-emerald-600 mt-2 flex items-center">
                         <span className="mr-2">✓</span> 
                         文件已上傳 (File ID: {field.value.substring(0, 10)}...)
                       </p>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-[#ffc000] hover:bg-yellow-400 text-black font-semibold h-11 text-base cursor-pointer" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              "確認送出報帳申請"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
