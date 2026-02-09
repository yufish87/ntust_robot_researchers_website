"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  // FormMessage, // Removed FormMessage usage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/hooks/use-toast";

// Force re-evaluation - fixing hook error

// Schema Definitions
const loginSchema = z.object({
  studentId: z.string().min(1, "請輸入學號"),
  password: z.string().min(1, "請輸入密碼"),
});

const registerSchema = z.object({
  studentId: z.string().min(1, "請輸入學號"),
  password: z.string().min(6, "密碼至少需要 6 個字元"),
  name: z.string().min(1, "請輸入姓名"),
  dept: z.string().min(1, "請輸入系所"),
  grade: z.string().min(1, "請輸入年級"),
  verifyCode: z.string().min(1, "請輸入驗證碼"),
});

interface AuthModalProps {
  children?: React.ReactNode;
  defaultView?: "login" | "register";
}

export function AuthModal({ children, defaultView = "login" }: AuthModalProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"login" | "register">(defaultView);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      setView(defaultView);
    }
  };

  const switchView = (newView: "login" | "register") => {
    setView(newView);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col items-center gap-2">
           <div className="relative w-full h-12 mb-2">
            <Image 
             src="/image/Bar_Logo.png" 
              alt="RRC Logo" 
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-contain dark:invert"
              priority
            />
          </div>
          <DialogTitle className="text-xl font-bold tracking-widest text-[#34313c] dark:text-white">
            {view === "login" ? "資源管理系統登入" : "新成員註冊"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {view === "login" ? "請輸入學號與密碼進行登入" : "請填寫基本資料進行註冊"}
          </DialogDescription>
        </DialogHeader>

        {view === "login" ? (
          <LoginForm 
            onSuccess={() => setOpen(false)} 
            onSwitch={() => switchView("register")} 
          />
        ) : (
          <RegisterForm 
            onSuccess={() => setView("login")} 
            onSwitch={() => switchView("login")} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Sub-components
interface FormProps {
  onSuccess: () => void;
  onSwitch: () => void;
}

function LoginForm({ onSuccess, onSwitch }: FormProps) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { studentId: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    setError(null);
    try {
      await login(values);
      onSuccess();
      toast({ title: "登入成功", description: "歡迎回到機器人研究社" });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "學號或密碼錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>學號</FormLabel>
                {form.formState.errors.studentId && (
                  <span className="text-destructive text-xs leading-none">{form.formState.errors.studentId.message}</span>
                )}
              </div>
              <FormControl>
                <Input placeholder="請輸入學號" {...field} autoComplete="username" />
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
                  <span className="text-destructive text-xs leading-none">{form.formState.errors.password.message}</span>
                )}
              </div>
              <FormControl>
                <Input type="password" placeholder="請輸入密碼" {...field} autoComplete="current-password" />
              </FormControl>
            </FormItem>
          )}
        />
        
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md text-center font-medium">
            {error}
          </div>
        )}
        
        <Button type="submit" className="w-full bg-[#ffc000] text-[#34313c] hover:bg-yellow-500 font-bold" disabled={loading}>
          {loading ? "登入中..." : "登入"}
        </Button>

        <div className="text-center mt-2">
          <Button 
            variant="link" 
            className="text-slate-500"
            onClick={(e) => {
              e.preventDefault();
              onSwitch();
            }}
            type="button"
          >
            還沒有帳號？立即註冊
          </Button>
        </div>
      </form>
    </Form>
  );
}

function RegisterForm({ onSuccess, onSwitch }: FormProps) {
  const register = useAuthStore((state) => state.register);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      studentId: "",
      password: "",
      name: "",
      dept: "",
      grade: "",
      verifyCode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setLoading(true);
    setError(null);
    try {
      await register(values);
      toast({ title: "註冊成功", description: "請使用剛註冊的帳號登入" });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "註冊失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-2">
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>學號</FormLabel>
                {form.formState.errors.studentId && (
                  <span className="text-destructive text-xs leading-none">{form.formState.errors.studentId.message}</span>
                )}
              </div>
              <FormControl>
                <Input placeholder="請輸入學號" {...field} autoComplete="username" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>姓名</FormLabel>
                {form.formState.errors.name && (
                  <span className="text-destructive text-xs leading-none">{form.formState.errors.name.message}</span>
                )}
              </div>
              <FormControl>
                <Input placeholder="請輸入姓名" {...field} autoComplete="name" />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="dept"
            render={({ field }) => (
              <FormItem className="flex-1">
                <div className="flex justify-between items-center h-5">
                  <FormLabel>系所</FormLabel>
                  {form.formState.errors.dept && (
                    <span className="text-destructive text-xs leading-none">{form.formState.errors.dept.message}</span>
                  )}
                </div>
                <FormControl>
                  <Input placeholder="例如: 資工系" {...field} autoComplete="organization" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem className="flex-1">
                <div className="flex justify-between items-center h-5">
                  <FormLabel>年級</FormLabel>
                  {form.formState.errors.grade && (
                    <span className="text-destructive text-xs leading-none">{form.formState.errors.grade.message}</span>
                  )}
                </div>
                <FormControl>
                  <Input placeholder="例如: 大一" {...field} autoComplete="off" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>密碼</FormLabel>
                {form.formState.errors.password && (
                  <span className="text-destructive text-xs leading-none">{form.formState.errors.password.message}</span>
                )}
              </div>
              <FormControl>
                <Input type="password" placeholder="請設定密碼" {...field} autoComplete="new-password" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="verifyCode"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>驗證碼</FormLabel>
                {form.formState.errors.verifyCode && (
                  <span className="text-destructive text-xs leading-none">{form.formState.errors.verifyCode.message}</span>
                )}
              </div>
              <FormControl>
                <Input placeholder="請輸入社團驗證碼" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md text-center font-medium">
            {error}
          </div>
        )}
        
        <Button type="submit" className="w-full bg-[#ffc000] text-[#34313c] hover:bg-yellow-500 font-bold mt-2" disabled={loading}>
          {loading ? "註冊中..." : "註冊"}
        </Button>

        <div className="text-center mt-2">
          <Button 
            variant="link" 
            className="text-slate-500"
            onClick={(e) => {
              e.preventDefault();
              onSwitch();
            }}
            type="button"
          >
            已有帳號？登入
          </Button>
        </div>
      </form>
    </Form>
  );
}
