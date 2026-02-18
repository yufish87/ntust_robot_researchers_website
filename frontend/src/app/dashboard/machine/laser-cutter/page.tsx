"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { FileUpload, FileUploadRef } from "@/components/ui/file-upload";
import { MachineAPI } from "@/lib/api/machine";

// --- Schema Definitions ---
const formSchema = z.object({
  purpose: z.string().min(5, "請輸入詳細用途 (至少 5 字)"),
  needAssist: z.enum(["是", "否"]),
  quantity: z.coerce.number().min(1, "數量至少為 1"),
  materialSource: z.string().min(1, "請輸入材料來源"),
  materialType: z.string().min(1, "請輸入材質 (例如: 壓克力, 木板)"),
  thickness: z.string().min(1, "請輸入厚度 (例如: 3mm, 5mm)"),
  estimateTime: z.string().min(1, "請輸入預估時間"),
  useTime: z.string().optional(),
  note: z.string().optional(),
  fileId: z.string().min(1, "請上傳雷切圖檔"),
});

type FormInputValues = z.input<typeof formSchema>;

export default function LaserCutterApplicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileUploadRef = useRef<FileUploadRef>(null);

  const form = useForm<FormInputValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purpose: "",
      needAssist: "否",
      quantity: 1,
      materialSource: "",
      materialType: "",
      thickness: "",
      estimateTime: "0小時10分",
      useTime: "",
      note: "",
      fileId: "",
    },
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<FormInputValues> = async (data) => {
    setIsSubmitting(true);
    try {
      // 1. Submit Application
      const payload = {
        purpose: data.purpose,
        needAssist: data.needAssist,
        quantity: Number(data.quantity),
        materialSource: data.materialSource,
        materialType: data.materialType,
        thickness: data.thickness,
        estimateTime: data.estimateTime,
        useTime: data.useTime,
        note: data.note,
        fileId: (data.fileId === "pending" ? "" : data.fileId) || "",
      };

      const appResult = await MachineAPI.applyLaserCutter(payload);
      const appId = appResult.data?.id;

      if (!appId) throw new Error("提交成功但無單號回傳");

      // 2. Upload File
      if (fileUploadRef.current) {
         const fileId = await fileUploadRef.current.upload(appId);
         await MachineAPI.updateFile(appId, fileId, 'main');
      }

      toast({
        title: "申請提交成功",
        description: "您的雷射切割申請已送出，請等待審核。",
      });

      router.push("/dashboard/machine");
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
    <div className="container p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" type="button" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">雷射切割機借用申請</h1>
          <p className="text-muted-foreground">
            請詳細填寫切割參數並上傳相關檔案。
          </p>
        </div>
      </div>

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
              
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center h-5">
                      <FormLabel>
                        雷切用途 <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      {form.formState.errors.purpose && (
                        <span className="text-destructive text-xs leading-none">{form.formState.errors.purpose.message}</span>
                      )}
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="請說明雷切用途..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="needAssist"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>人員協助 <span className="text-red-500 ml-1">*</span></FormLabel>
                        {form.formState.errors.needAssist && (
                          <span className="text-destructive text-xs leading-none">{form.formState.errors.needAssist.message}</span>
                        )}
                      </div>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="選擇" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper">
                          <SelectItem value="是">需要協助</SelectItem>
                          <SelectItem value="否">不需協助 (可獨立操作)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>切割數量 <span className="text-red-500 ml-1">*</span></FormLabel>
                        {form.formState.errors.quantity && (
                          <span className="text-destructive text-xs leading-none">{form.formState.errors.quantity.message}</span>
                        )}
                      </div>
                      <FormControl>
                        <Input type="number" min={1} {...field} value={field.value as number} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="materialSource"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>材料來源 <span className="text-red-500 ml-1">*</span></FormLabel>
                        {form.formState.errors.materialSource && (
                          <span className="text-destructive text-xs leading-none">{form.formState.errors.materialSource.message}</span>
                        )}
                      </div>
                      <FormControl>
                        <Input placeholder="例: 自備/公共材料" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="estimateTime"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>預估時間 <span className="text-red-500 ml-1">*</span></FormLabel>
                        {form.formState.errors.estimateTime && (
                          <span className="text-destructive text-xs leading-none">{form.formState.errors.estimateTime.message}</span>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <Input 
                            type="number" 
                            min={0} 
                            placeholder="0"
                            className="pr-12"
                            value={(() => {
                               const match = field.value?.match(/(\d+)小時/);
                               return match ? match[1] : "";
                            })()}
                            onChange={(e) => {
                               const h = e.target.value;
                               const mBox = field.value?.match(/(\d+)分/);
                               const m = mBox ? mBox[1] : "0";
                               field.onChange(`${h || 0}小時${m}分`);
                            }}
                          />
                          <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">小時</span>
                        </div>
                        <div className="relative flex-1">
                           <Input 
                            type="number" 
                            min={0} 
                            max={59}
                            placeholder="0"
                            className="pr-12"
                            value={(() => {
                               const match = field.value?.match(/(\d+)分/);
                               return match ? match[1] : "";
                            })()}
                            onChange={(e) => {
                               const m = e.target.value;
                               const hBox = field.value?.match(/(\d+)小時/);
                               const h = hBox ? hBox[1] : "0";
                               field.onChange(`${h}小時${m || 0}分`);
                            }}
                          />
                          <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">分鐘</span>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="materialType"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>材質 <span className="text-red-500 ml-1">*</span></FormLabel>
                        {form.formState.errors.materialType && (
                          <span className="text-destructive text-xs leading-none">{form.formState.errors.materialType.message}</span>
                        )}
                      </div>
                      <FormControl>
                        <Input placeholder="例: 密集版" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thickness"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>厚度 <span className="text-red-500 ml-1">*</span></FormLabel>
                        {form.formState.errors.thickness && (
                          <span className="text-destructive text-xs leading-none">{form.formState.errors.thickness.message}</span>
                        )}
                      </div>
                      <FormControl>
                        <Input placeholder="例: 3mm" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                  control={form.control}
                  name="useTime"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>希望使用時間</FormLabel>
                      </div>
                      <FormControl>
                        <Input placeholder="例如: 週三下午、10/25 14:00" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center h-5">
                        <FormLabel>備註</FormLabel>
                      </div>
                      <FormControl>
                        <Textarea placeholder="其他需求或說明..." className="resize-none h-20" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle>檔案上傳</CardTitle>
               <CardDescription>請上傳雷射切割檔案 (ai, dxf, svg, pdf)。</CardDescription>
            </CardHeader>
            <CardContent>
               <FormField
                control={form.control}
                name="fileId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-2">
                        <FormLabel className="text-base font-semibold">
                            雷切圖檔 <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                         {form.formState.errors.fileId && (
                            <div className="text-destructive text-sm font-medium flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1.5" />
                                {form.formState.errors.fileId.message?.toString()}
                            </div>
                         )}
                    </div>
                   
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
                        accept="image/*,.pdf,.dxf,.ai,.svg"
                        folderType="machine_lsc"
                        formatHint="支援格式: .pdf, .dxf, .ai, .svg, .png, .jpg (Max 10MB)"
                        className={form.formState.errors.fileId ? "border-red-500 bg-red-50" : ""}
                      />
                    </FormControl>
                    {field.value && (
                       <p className="text-sm text-green-600 mt-2 flex items-center">
                         <span className="mr-2">✓</span> {field.value === "pending" ? "檔案已選擇" : "檔案已上傳"}
                       </p>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              "送出申請"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
