"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, usePathname } from "next/navigation";

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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

// Schema Definitions
const loginSchema = z.object({
  studentId: z
    .string()
    .min(1, "請輸入學號")
    .regex(/^([A-Za-z]+)(\d{3})(\d{2})(\d+)$/, "請輸入有效學號"),
  password: z
    .string()
    .min(6, "密碼至少需要 6 個字元")
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/, "請輸入英數字混合密碼"),
});

const registerSchema = z.object({
  studentId: z
    .string()
    .min(1, "請輸入學號")
    .regex(/^([A-Za-z]+)(\d{3})(\d{2})(\d+)$/, "請輸入有效學號"),
  password: z
    .string()
    .min(6, "密碼至少需要 6 個字元")
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/, "請輸入英數字混合密碼"),
  name: z.string().min(1, "請輸入姓名"),
  verifyCode: z.string().min(1, "請輸入驗證碼"),
});

const forgotStep1Schema = z.object({
  studentId: z
    .string()
    .min(1, "請輸入學號")
    .regex(/^([A-Za-z]+)(\d{3})(\d{2})(\d+)$/, "請輸入有效學號"),
});

const forgotStep2Schema = z
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

type ModalView = "login" | "register" | "forgot-step1" | "forgot-step2";

interface AuthModalProps {
  children?: React.ReactNode;
  defaultView?: "login" | "register";
}

export function AuthModal({ children, defaultView = "login" }: AuthModalProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ModalView>(defaultView);
  const [forgotStudentId, setForgotStudentId] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (view === "forgot-step1" || view === "forgot-step2") {
        const confirmClose = window.confirm(
          "確定要中斷重設密碼流程嗎？\n若關閉，需重新發送驗證碼。\n\nAre you sure you want to cancel the password reset process?\nIf you close this, you will need to request a new verification code."
        );
        if (!confirmClose) return;
      }
    }
    setOpen(open);
    if (open) {
      setView(defaultView);
      setForgotStudentId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
            {view === "login" && "資源管理系統登入"}
            {view === "register" && "新成員註冊"}
            {(view === "forgot-step1" || view === "forgot-step2") && "忘記密碼"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {view === "login" ? "請輸入學號與密碼進行登入" : "請填寫資料"}
          </DialogDescription>
        </DialogHeader>

        {view === "login" && (
          <LoginForm
            onSuccess={() => setOpen(false)}
            onSwitch={() => setView("register")}
            onForgot={() => setView("forgot-step1")}
          />
        )}
        {view === "register" && (
          <RegisterForm
            onSuccess={() => setView("login")}
            onSwitch={() => setView("login")}
          />
        )}
        {view === "forgot-step1" && (
          <ForgotStep1Form
            onBack={() => setView("login")}
            onNext={(sid) => {
              setForgotStudentId(sid);
              setView("forgot-step2");
            }}
          />
        )}
        {view === "forgot-step2" && (
          <ForgotStep2Form
            studentId={forgotStudentId}
            onBack={() => setView("forgot-step1")}
            onSuccess={() => {
              toast({ title: "密碼重設成功", description: "請用新密碼登入" });
              setView("login");
            }}
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

function LoginForm({
  onSuccess,
  onSwitch,
  onForgot,
}: FormProps & { onForgot: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { studentId: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    form.clearErrors();
    try {
      await login(values);
      onSuccess();
      toast({ title: "登入成功", description: "歡迎回到機器人研究社" });
      if (pathname.startsWith("/auth/")) {
        router.push("/dashboard/announcements");
      }
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
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.studentId.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="login-studentId"
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
                  id="login-password"
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
            className="text-slate-500 px-0 text-sm"
            onClick={(e) => {
              e.preventDefault();
              onForgot();
            }}
            type="button"
          >
            忘記密碼？
          </Button>
          <Button
            variant="link"
            className="text-slate-500 px-0 text-sm"
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

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      studentId: "",
      password: "",
      name: "",
      verifyCode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setLoading(true);
    form.clearErrors();
    try {
      await register(values);
      toast({ title: "註冊成功", description: "請使用剛註冊的帳號登入" });
      onSuccess();
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("Invalid verification code")) {
        form.setError("verifyCode", { message: "驗證碼不存在" });
      } else if (msg.includes("inactive")) {
        form.setError("verifyCode", { message: "此驗證碼已停用" });
      } else if (msg.includes("expired or not yet valid")) {
        form.setError("verifyCode", { message: "驗證碼已過期或尚未生效" });
      } else if (msg.includes("usage limit")) {
        form.setError("verifyCode", { message: "驗證碼已達使用次數上限" });
      } else if (
        msg.includes("already exists") ||
        msg.includes("ALREADY_EXISTS")
      ) {
        form.setError("studentId", { message: "此學號已註冊" });
      } else {
        form.setError("verifyCode", { message: msg || "註冊失敗" });
      }
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
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.studentId.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="register-studentId"
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>姓名</FormLabel>
                {form.formState.errors.name && (
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.name.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="register-name"
                  placeholder="請輸入姓名"
                  {...field}
                  autoComplete="name"
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
                  id="register-password"
                  type="password"
                  placeholder="請設定密碼"
                  {...field}
                  autoComplete="new-password"
                />
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
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.verifyCode.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="register-verifyCode"
                  placeholder="請輸入社團驗證碼"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-[#ffc000] text-[#34313c] hover:bg-yellow-500 font-bold mt-2"
          disabled={loading}
        >
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

// ---- Forgot Password Step 1 ----
function ForgotStep1Form({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: (studentId: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotStep1Schema>>({
    resolver: zodResolver(forgotStep1Schema),
    defaultValues: { studentId: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotStep1Schema>) {
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/request", {
        studentId: values.studentId,
      });
      if (!res.data.success) throw new Error(res.data.message || "發送失敗");
      toast({ title: "驗證碼已寄出", description: "請查收學校信箱" });
      onNext(values.studentId);
    } catch (err: any) {
      form.setError("studentId", {
        message: err.message || "發送失敗，請稍後再試",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <p className="text-sm text-muted-foreground">
          輸入你的學號，驗證碼將寄送至 <strong>{"{學號}"}@mail.ntust.edu.tw</strong>
        </p>
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>學號</FormLabel>
              <FormControl>
                <Input
                  id="forgot-studentId"
                  placeholder="請輸入學號"
                  autoComplete="username"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full bg-[#ffc000] text-[#34313c] hover:bg-yellow-500 font-bold"
          disabled={loading}
        >
          {loading ? "寄送中..." : "發送驗證碼"}
        </Button>
        <div className="text-center">
          <Button
            variant="link"
            className="text-slate-500 text-sm"
            type="button"
            onClick={onBack}
          >
            返回登入
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ---- Forgot Password Step 2 ----
function ForgotStep2Form({
  studentId,
  onBack,
  onSuccess,
}: {
  studentId: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotStep2Schema>>({
    resolver: zodResolver(forgotStep2Schema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotStep2Schema>) {
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/confirm", {
        studentId,
        code: values.code,
        newPassword: values.newPassword,
      });
      if (!res.data.success) throw new Error(res.data.message || "重設失敗");
      onSuccess();
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("驗證碼")) {
        form.setError("code", { message: msg });
      } else {
        form.setError("confirmPassword", { message: msg || "重設失敗，請稍後再試" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <p className="text-sm text-muted-foreground">
          驗證碼已寄至 <strong>{studentId}@mail.ntust.edu.tw</strong>，有效期限 15 分鐘。
        </p>
        <input
          type="text"
          autoComplete="username"
          value={studentId}
          readOnly
          style={{ display: "none" }}
          aria-hidden="true"
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>6 位驗證碼</FormLabel>
              <FormControl>
                <Input
                  id="forgot-code"
                  placeholder="請輸入信箱收到的驗證碼"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>新密碼</FormLabel>
              <FormControl>
                <Input
                  id="forgot-newPassword"
                  type="password"
                  placeholder="英數字混合，至少 6 碼"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>確認新密碼</FormLabel>
              <FormControl>
                <Input
                  id="forgot-confirmPassword"
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
            onClick={onBack}
            disabled={loading}
          >
            重新發送
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-[#ffc000] text-[#34313c] hover:bg-yellow-500 font-bold"
            disabled={loading}
          >
            {loading ? "重設中..." : "確認重設"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
