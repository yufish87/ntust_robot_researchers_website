"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

// Define schema validation
const formSchema = z.object({
  studentId: z
    .string()
    .min(1, "請輸入學號")
    .regex(/^([A-Za-z]+)(\d{3})(\d{2})(\d+)$/, "請輸入有效學號"),
  password: z
    .string()
    .min(6, "密碼至少需要 6 個字元")
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/, "請輸入英數字混合密碼"),
});

const resetStep1Schema = z.object({
  studentId: z
    .string()
    .min(1, "請輸入學號")
    .regex(/^([A-Za-z]+)(\d{3})(\d{2})(\d+)$/, "請輸入有效學號"),
});

const resetStep2Schema = z
  .object({
    code: z.string().length(6, "請輸入 6 位驗證碼").regex(/^\d+$/, "驗證碼須為數字"),
    newPassword: z
      .string()
      .min(6, "密碼至少需要 6 個字元")
      .regex(/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/, "請輸入英數字混合密碼"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "兩次密碼不一致",
    path: ["confirmPassword"],
  });

export default function LoginPage() {
  const router = useRouter();
  const { login, user, authChecked, syncSession } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Forgot password dialog state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetStudentId, setResetStudentId] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (!authChecked) {
      void syncSession();
      return;
    }

    if (user) {
      router.replace("/dashboard");
    }
  }, [authChecked, syncSession, user, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "",
      password: "",
    },
  });

  const step1Form = useForm<z.infer<typeof resetStep1Schema>>({
    resolver: zodResolver(resetStep1Schema),
    defaultValues: { studentId: "" },
  });

  const step2Form = useForm<z.infer<typeof resetStep2Schema>>({
    resolver: zodResolver(resetStep2Schema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    form.clearErrors();
    try {
      await login(values);
      toast({
        title: "登入成功",
        description: "歡迎回到機器人研究社",
      });
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("找不到") || msg.includes("USER_NOT_FOUND")) {
        form.setError("studentId", { message: "找不到此學號" });
      } else if (
        msg.includes("密碼錯誤") ||
        msg.includes("WRONG_PASSWORD") ||
        msg.includes("Wrong password")
      ) {
        form.setError("password", { message: "密碼錯誤" });
      } else if (msg.includes("inactive") || msg.includes("deleted")) {
        form.setError("studentId", { message: "此帳號已停用" });
      } else {
        form.setError("password", { message: "登入失敗，請稍後再試" });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleForgotOpen() {
    setForgotOpen(true);
    setResetStep(1);
    step1Form.reset();
    step2Form.reset();
    setResetStudentId("");
  }

  async function onStep1Submit(values: z.infer<typeof resetStep1Schema>) {
    setResetLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/request", {
        studentId: values.studentId,
      });
      if (!res.data.success) {
        throw new Error(res.data.message || "發送失敗");
      }
      setResetStudentId(values.studentId);
      setResetStep(2);
      toast({ title: "驗證碼已寄出", description: "請查收學校信箱" });
    } catch (err: any) {
      step1Form.setError("studentId", {
        message: err.message || "發送失敗，請稍後再試",
      });
    } finally {
      setResetLoading(false);
    }
  }

  async function onStep2Submit(values: z.infer<typeof resetStep2Schema>) {
    setResetLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/confirm", {
        studentId: resetStudentId,
        code: values.code,
        newPassword: values.newPassword,
      });
      if (!res.data.success) {
        throw new Error(res.data.message || "重設失敗");
      }
      toast({ title: "密碼重設成功", description: "請用新密碼登入" });
      setForgotOpen(false);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("驗證碼")) {
        step2Form.setError("code", { message: msg });
      } else {
        step2Form.setError("confirmPassword", {
          message: msg || "重設失敗，請稍後再試",
        });
      }
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4 relative">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-slate-500 hover:text-slate-900"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="mr-2 w-5 h-5" />
        回首頁
      </Button>
      <Card className="w-full max-w-[425px] shadow-lg">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="relative w-full h-12 mb-2">
            <Image
              src="/image/Bar_Logo.png"
              alt="RRC Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-xl font-bold tracking-widest text-[#34313c]">
            資源管理系統登入
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pt-2"
            >
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center h-5">
                      <FormLabel>學號</FormLabel>
                      {form.formState.errors.studentId && (
                        <span className="text-destructive text-xs leading-none">
                          {form.formState.errors.studentId.message}
                        </span>
                      )}
                    </div>
                    <FormControl>
                      <Input
                        id="studentId"
                        placeholder="請輸入學號"
                        {...field}
                        autoComplete="username"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center h-5">
                      <FormLabel>密碼</FormLabel>
                      {form.formState.errors.password && (
                        <span className="text-destructive text-xs leading-none">
                          {form.formState.errors.password.message}
                        </span>
                      )}
                    </div>
                    <FormControl>
                      <Input
                        id="password"
                        type="password"
                        placeholder="請輸入密碼"
                        {...field}
                        autoComplete="current-password"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-[#ffc000] text-[#34313c] hover:bg-yellow-500 font-bold"
                disabled={loading}
              >
                {loading ? "登入中..." : "登入"}
              </Button>

              <div className="flex justify-between items-center mt-2">
                <Button
                  variant="link"
                  className="text-slate-500 px-0"
                  onClick={handleForgotOpen}
                  type="button"
                >
                  忘記密碼？
                </Button>
                <Button
                  variant="link"
                  className="text-slate-500 px-0"
                  onClick={() => router.push("/auth/register")}
                  type="button"
                >
                  還沒有帳號？立即註冊
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>忘記密碼</DialogTitle>
            <DialogDescription>
              {resetStep === 1
                ? "輸入學號，驗證碼將寄送至你的學校信箱"
                : `驗證碼已寄至 ${resetStudentId}@mail.ntust.edu.tw`}
            </DialogDescription>
          </DialogHeader>

          {resetStep === 1 ? (
            <Form {...step1Form}>
              <form
                onSubmit={step1Form.handleSubmit(onStep1Submit)}
                className="space-y-4"
              >
                <FormField
                  control={step1Form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>學號</FormLabel>
                      <FormControl>
                        <Input
                          id="reset-studentId"
                          placeholder="請輸入學號"
                          autoComplete="username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full bg-[#ffc000] text-[#34313c] hover:bg-yellow-500 font-bold"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "寄送中..." : "發送驗證碼"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <Form {...step2Form}>
              <form
                onSubmit={step2Form.handleSubmit(onStep2Submit)}
                className="space-y-4"
              >
                <FormField
                  control={step2Form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>6 位驗證碼</FormLabel>
                      <FormControl>
                        <Input
                          id="reset-code"
                          placeholder="請輸入信箱收到的驗證碼"
                          maxLength={6}
                          inputMode="numeric"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={step2Form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>新密碼</FormLabel>
                      <FormControl>
                        <Input
                          id="reset-newPassword"
                          type="password"
                          placeholder="請輸入英數字混合密碼（至少 6 碼）"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={step2Form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>確認新密碼</FormLabel>
                      <FormControl>
                        <Input
                          id="reset-confirmPassword"
                          type="password"
                          placeholder="請再次輸入新密碼"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setResetStep(1)}
                    disabled={resetLoading}
                  >
                    重新發送
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#ffc000] text-[#34313c] hover:bg-yellow-500 font-bold"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "重設中..." : "確認重設密碼"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
