"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";
import {
  DEFAULT_DEPARTMENTS,
  DepartmentOption,
  analyzeStudentId,
} from "@/lib/student-id";

// ---------------- Schemas ----------------
const loginSchema = z.object({
  studentId: z.string().min(1, "請輸入學號"),
  password: z
    .string()
    .min(6, "密碼至少需要 6 個字元")
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/, "請輸入英數字混合密碼"),
});

const registerStep1Schema = z
  .object({
    school: z.string().min(1, "請選擇就讀學校"),
    studentId: z.string().min(1, "請輸入學號"),
    name: z.string().min(1, "請輸入姓名"),
    identityCategory: z.string().min(1, "請選擇或輸入身份別"),
    department: z.string().min(1, "請選擇或輸入系所"),
    entryYear: z.string().min(1, "請輸入入學年份").regex(/^\d{2,3}$/, "請輸入民國年 (如 112)"),
    email: z.string().min(1, "請輸入電子郵件").email("請輸入有效的電子郵件格式"),
    password: z
      .string()
      .min(6, "密碼至少需要 6 個字元")
      .regex(/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/, "請輸入英數字混合密碼"),
    verifyCode: z.string().min(1, "請輸入社團驗證碼"),
  })
  .superRefine((data, ctx) => {
    if (data.school === "國立臺灣科技大學") {
      if (!/^([A-Za-z]+)(\d{3})(\d{2})(\d+)$/.test(data.studentId.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "本校學號格式需為英文字母開頭 (如 B11207123)",
          path: ["studentId"],
        });
      }
    }
  });

type RegisterStep1FormValues = z.infer<typeof registerStep1Schema>;

const registerStep2Schema = z.object({
  otpCode: z.string().length(6, "請輸入 6 位驗證碼").regex(/^\d+$/, "驗證碼須為數字"),
});

const forgotStep1Schema = z.object({
  studentId: z.string().min(1, "請輸入學號"),
  email: z.string().min(1, "請輸入註冊信箱").email("請輸入有效的電子郵件"),
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

type ModalView =
  | "login"
  | "register-step1"
  | "register-step2"
  | "forgot-step1"
  | "forgot-step2";

interface AuthModalProps {
  children?: React.ReactNode;
  defaultView?: "login" | "register";
}

export function AuthModal({ children, defaultView = "login" }: AuthModalProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ModalView>(defaultView === "register" ? "register-step1" : "login");
  const [departments, setDepartments] = useState<DepartmentOption[]>(DEFAULT_DEPARTMENTS);

  // 流程狀態暫存
  const [registeredStudentId, setRegisteredStudentId] = useState("");
  const [registerData, setRegisterData] = useState<RegisterStep1FormValues | null>(null);
  const [forgotData, setForgotData] = useState<{ studentId: string; email: string }>({
    studentId: "",
    email: "",
  });

  // 非同步抓取資料庫 Departments 表
  useEffect(() => {
    let isMounted = true;
    api
      .get("/system/departments")
      .then((res) => {
        if (isMounted && res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setDepartments(res.data.data);
        }
      })
      .catch(() => {
        // 抓取失敗時預設使用 DEFAULT_DEPARTMENTS
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      if (view === "forgot-step1" || view === "forgot-step2" || view === "register-step2") {
        const confirmClose = window.confirm(
          "確定要中斷目前的驗證流程嗎？\n若關閉視窗，需重新發送驗證碼。\n\nAre you sure you want to exit? You will need to request a new verification code."
        );
        if (!confirmClose) return;
      }
    }
    setOpen(isOpen);
    if (isOpen) {
      setView(defaultView === "register" ? "register-step1" : "login");
      setRegisterData(null);
      setForgotData({ studentId: "", email: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col items-center gap-2">
          <div className="relative w-full h-12 mb-1">
            <Image
              src="/image/Bar_Logo.png"
              alt="臺科大機器人研究社標誌"
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-contain dark:invert"
              priority
            />
          </div>
          <DialogTitle className="text-xl font-bold tracking-widest text-[#34313c] dark:text-white">
            {view === "login" && "資源管理系統登入"}
            {view === "register-step1" && "新成員註冊"}
            {view === "register-step2" && "驗證電子郵件"}
            {(view === "forgot-step1" || view === "forgot-step2") && "忘記密碼"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {view === "login"
              ? "請輸入學號與密碼進行登入"
              : view.startsWith("register")
              ? "請填寫新成員註冊資料並驗證電子郵件"
              : "請依照指示驗證並重設密碼"}
          </DialogDescription>
        </DialogHeader>

        {view === "login" && (
          <LoginForm
            initialStudentId={registeredStudentId}
            onSuccess={() => setOpen(false)}
            onSwitch={() => setView("register-step1")}
            onForgot={() => setView("forgot-step1")}
          />
        )}

        {view === "register-step1" && (
          <RegisterStep1Form
            initialValues={registerData}
            departments={departments}
            onSwitchToLogin={() => setView("login")}
            onNext={(values) => {
              setRegisterData(values);
              setView("register-step2");
            }}
          />
        )}

        {view === "register-step2" && registerData && (
          <RegisterStep2Form
            step1Data={registerData}
            onBack={() => setView("register-step1")}
            onSuccess={(sid) => {
              setRegisteredStudentId(sid);
              setRegisterData(null);
              if (typeof window !== "undefined") {
                sessionStorage.setItem("just_registered", "true");
              }
              toast({
                title: "註冊成功",
                description: "請使用剛註冊的帳號與密碼登入系統",
              });
              setView("login");
            }}
          />
        )}

        {view === "forgot-step1" && (
          <ForgotStep1Form
            initialData={forgotData}
            onBack={() => setView("login")}
            onNext={(data) => {
              setForgotData(data);
              setView("forgot-step2");
            }}
          />
        )}

        {view === "forgot-step2" && (
          <ForgotStep2Form
            studentId={forgotData.studentId}
            email={forgotData.email}
            onBack={() => setView("forgot-step1")}
            onSuccess={() => {
              setRegisteredStudentId(forgotData.studentId);
              toast({ title: "密碼重設成功", description: "請使用新密碼登入" });
              setView("login");
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Sub-components ----------------

interface LoginFormProps {
  initialStudentId?: string;
  onSuccess: () => void;
  onSwitch: () => void;
  onForgot: () => void;
}

function LoginForm({
  initialStudentId = "",
  onSuccess,
  onSwitch,
  onForgot,
}: LoginFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { studentId: initialStudentId, password: "" },
  });

  useEffect(() => {
    if (initialStudentId) {
      form.setValue("studentId", initialStudentId);
    }
  }, [initialStudentId, form]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    form.clearErrors();
    try {
      await login(values);
      onSuccess();
      toast({ title: "登入成功", description: "歡迎回到臺科大機器人研究社" });
      if (pathname.startsWith("/auth/")) {
        router.push("/dashboard/announcements");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
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
      } else if (msg.includes("喚醒中") || msg.includes("暫時無回應")) {
        form.setError("password", { message: msg });
      } else {
        form.setError("password", { message: "登入失敗，請稍後再試" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-3">
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
                  placeholder="請輸入學號 (如 B11207123)"
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
        <div className="flex justify-end">
          <Button
            variant="link"
            size="sm"
            className="text-xs text-muted-foreground hover:text-primary px-0 h-auto"
            type="button"
            onClick={onForgot}
          >
            忘記密碼？
          </Button>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#ffc000] text-[#34313c] hover:bg-yellow-500 font-bold"
          disabled={loading}
        >
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

// ---------------- Register Step 1 Form ----------------

interface RegisterStep1FormProps {
  initialValues: RegisterStep1FormValues | null;
  departments: DepartmentOption[];
  onSwitchToLogin: () => void;
  onNext: (values: RegisterStep1FormValues) => void;
}

function RegisterStep1Form({
  initialValues,
  departments,
  onSwitchToLogin,
  onNext,
}: RegisterStep1FormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterStep1FormValues>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: initialValues || {
      school: "國立臺灣科技大學",
      studentId: "",
      name: "",
      identityCategory: "大學部",
      department: "",
      entryYear: "",
      email: "",
      password: "",
      verifyCode: "",
    },
  });

  const watchedSchool = useWatch({ control: form.control, name: "school" });
  const isExternal = watchedSchool === "其他";
  const watchedStudentId = useWatch({ control: form.control, name: "studentId" });

  // 監聽學號輸入：即時自動解析學號並填入下方欄位，代碼若無對應則即時清空
  useEffect(() => {
    // 外校生不套用臺科大代碼映射
    if (isExternal) return;

    if (!watchedStudentId || watchedStudentId.trim().length === 0) {
      form.setValue("department", "");
      form.setValue("entryYear", "");
      return;
    }

    const cleanId = watchedStudentId.trim();
    if (cleanId.length >= 7) {
      const res = analyzeStudentId(cleanId, departments);
      if (res.isValidFormat) {
        if (res.degreeCategory) {
          form.setValue("identityCategory", res.degreeCategory, { shouldValidate: true });
        }
        form.setValue("entryYear", res.entryYear || "", { shouldValidate: true });
        // 關鍵：若能找到對應系所則自動填入；若代碼查無對應（例如原本有、改動後沒有），則即時清空！
        form.setValue("department", res.deptName || "", { shouldValidate: true });
      } else {
        // 格式無法解析時清空，避免殘留前次輸入的值
        form.setValue("department", "");
        form.setValue("entryYear", "");
      }
    } else {
      // 學號長度不足時清空
      form.setValue("department", "");
      form.setValue("entryYear", "");
    }
  }, [watchedStudentId, departments, form, isExternal]);

  async function onSubmit(values: RegisterStep1FormValues) {
    setLoading(true);
    form.clearErrors();
    try {
      // 呼叫後端發送 OTP 驗證信
      const res = await api.post("/auth/register/request-otp", {
        studentId: values.studentId,
        email: values.email,
        verifyCode: values.verifyCode,
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "發送驗證碼失敗");
      }

      toast({
        title: "驗證碼已寄出",
        description: `驗證碼已發送至 ${values.email}，請查收`,
      });
      onNext(values);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("已註冊") || msg.includes("ALREADY_EXISTS")) {
        form.setError("studentId", { message: "此學號已註冊" });
      } else if (
        msg.includes("驗證碼") ||
        msg.includes("VerifyCode") ||
        msg.includes("VERIFY_CODE") ||
        msg.includes("expired") ||
        msg.includes("valid") ||
        msg.includes("生效") ||
        msg.includes("失效") ||
        msg.includes("上限")
      ) {
        form.setError("verifyCode", { message: msg || "社團驗證碼無效或已過期" });
      } else if (msg.includes("電子郵件") || msg.includes("EMAIL")) {
        form.setError("email", { message: msg || "電子郵件格式不正確" });
      } else {
        form.setError("verifyCode", { message: msg || "註冊驗證發送失敗，請稍後再試" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-2">
        {/* 就讀學校下拉選單 */}
        <FormField
          control={form.control}
          name="school"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>就讀學校</FormLabel>
                {form.formState.errors.school && (
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.school.message}
                  </span>
                )}
              </div>
              <Select
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val);
                  form.clearErrors("studentId");
                  if (val === "其他") {
                    form.setValue("department", "");
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="請選擇就讀學校" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" side="bottom" sideOffset={4} className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="國立臺灣科技大學">國立臺灣科技大學</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* 外校成員提醒區塊 */}
        {isExternal && (
          <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-xs text-foreground/90 space-y-1">
            <p className="font-semibold text-yellow-600 dark:text-yellow-400">
              外校成員填寫提醒：
            </p>
            <p className="text-muted-foreground dark:text-slate-300 leading-relaxed">
              請填寫原就讀學校學號，並於下方【系所】欄位填入完整學校與系所名稱（例如：國立臺灣大學 機械工程學系）。
            </p>
          </div>
        )}

        {/* 學號 */}
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>{isExternal ? "原校學號" : "學號"}</FormLabel>
                {form.formState.errors.studentId && (
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.studentId.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="register-studentId"
                  placeholder={
                    isExternal
                      ? "請輸入原學校學號 (如 B10901000)"
                      : "請輸入學號 (如 B11207123)"
                  }
                  {...field}
                  autoComplete="username"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* 身份別、入學年份（雙欄並列） */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="identityCategory"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center h-5">
                  <FormLabel>身份別</FormLabel>
                  {form.formState.errors.identityCategory && (
                    <span className="text-destructive text-xs leading-none">
                      {form.formState.errors.identityCategory.message}
                    </span>
                  )}
                </div>
                <Select
                  value={field.value}
                  onValueChange={(val) => field.onChange(val)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="選擇身份別" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" side="bottom" sideOffset={4} className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="大學部">大學部</SelectItem>
                    <SelectItem value="碩士班">碩士班</SelectItem>
                    <SelectItem value="博士班">博士班</SelectItem>
                    <SelectItem value="二技">二技</SelectItem>
                    <SelectItem value="在職專班">在職專班</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entryYear"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center h-5">
                  <FormLabel>入學年份</FormLabel>
                  {form.formState.errors.entryYear && (
                    <span className="text-destructive text-xs leading-none">
                      {form.formState.errors.entryYear.message}
                    </span>
                  )}
                </div>
                <FormControl>
                  <Input
                    id="register-entryYear"
                    placeholder="民國年 (如 112)"
                    maxLength={3}
                    inputMode="numeric"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* 系所 */}
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>
                  {isExternal ? "就讀學校與系所 (須包含校名)" : "系所"}
                </FormLabel>
                {form.formState.errors.department && (
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.department.message}
                  </span>
                )}
              </div>
              <FormControl>
                <div>
                  <Input
                    id="register-department"
                    placeholder={
                      isExternal
                        ? "請輸入完整校名與系所 (例如：國立臺灣大學 機械工程學系)"
                        : "請選擇或輸入系所名稱 (如 機械工程系)"
                    }
                    list={!isExternal ? "department-datalist" : undefined}
                    {...field}
                  />
                  {!isExternal && (
                    <datalist id="department-datalist">
                      {departments.map((dept) => (
                        <option key={dept.code} value={dept.name} />
                      ))}
                    </datalist>
                  )}
                  {isExternal && (
                    <p className="text-[11px] text-yellow-600 dark:text-yellow-400 mt-1">
                      ※ 外校成員請務必填寫完整校名與系所（例如：國立臺灣大學 機械工程學系）
                    </p>
                  )}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {/* 姓名 */}
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
                  placeholder="請輸入真實姓名"
                  {...field}
                  autoComplete="name"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* 電子信箱 */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>電子郵件 (將寄送驗證碼)</FormLabel>
                {form.formState.errors.email && (
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.email.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="register-email"
                  type="email"
                  inputMode="email"
                  placeholder="請輸入常用信箱 (如 example@gmail.com)"
                  {...field}
                  autoComplete="email"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* 密碼 */}
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
                  placeholder="英數字混合，至少 6 碼"
                  {...field}
                  autoComplete="new-password"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* 社團驗證碼 */}
        <FormField
          control={form.control}
          name="verifyCode"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>社團驗證碼</FormLabel>
                {form.formState.errors.verifyCode && (
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.verifyCode.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="register-verifyCode"
                  placeholder="請輸入向社長/幹部取得的社團驗證碼"
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
          {loading ? "發送中..." : "發送信箱驗證碼"}
        </Button>

        <div className="text-center mt-2">
          <Button
            variant="link"
            className="text-slate-500"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToLogin();
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

// ---------------- Register Step 2 (OTP) Form ----------------

interface RegisterStep2FormProps {
  step1Data: RegisterStep1FormValues;
  onBack: () => void;
  onSuccess: (studentId: string) => void;
}

function RegisterStep2Form({
  step1Data,
  onBack,
  onSuccess,
}: RegisterStep2FormProps) {
  const register = useAuthStore((state) => state.register);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  const form = useForm<z.infer<typeof registerStep2Schema>>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: { otpCode: "" },
  });

  // 60 秒倒數計時
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 重新發送 OTP
  async function handleResend() {
    if (resendCooldown > 0) return;
    try {
      const res = await api.post("/auth/register/request-otp", {
        studentId: step1Data.studentId,
        email: step1Data.email,
        verifyCode: step1Data.verifyCode,
      });
      if (!res.data.success) throw new Error(res.data.message || "重新發送失敗");
      toast({ title: "已重新發送驗證碼", description: `請查收 ${step1Data.email}` });
      setResendCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "重新發送失敗，請稍後再試";
      toast({ variant: "destructive", title: "發送失敗", description: msg });
    }
  }

  async function onSubmit(values: z.infer<typeof registerStep2Schema>) {
    setLoading(true);
    form.clearErrors();
    try {
      // 計算年級：身份別 + 年份換算
      const now = new Date();
      const currentRocYear = now.getFullYear() - 1911;
      const currentMonth = now.getMonth() + 1;
      const currentAcademicYear = currentMonth >= 9 ? currentRocYear : currentRocYear - 1;
      const entryYearNum = parseInt(step1Data.entryYear, 10);
      const diff = currentAcademicYear - entryYearNum + 1;
      const gradeStr = diff > 0 ? String(diff) : "1";

      await register({
        studentId: step1Data.studentId,
        name: step1Data.name,
        password: step1Data.password,
        verifyCode: step1Data.verifyCode,
        email: step1Data.email,
        otpCode: values.otpCode,
        department: step1Data.department,
        dept: step1Data.department,
        grade: gradeStr,
        identityCategory: step1Data.identityCategory,
        entryYear: step1Data.entryYear,
      });

      onSuccess(step1Data.studentId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("驗證碼") || msg.includes("OTP")) {
        form.setError("otpCode", { message: msg || "驗證碼錯誤，請重新輸入" });
      } else {
        form.setError("otpCode", { message: msg || "註冊失敗，請稍後再試" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          驗證碼已發送至 <strong className="text-foreground">{step1Data.email}</strong>，有效期限 15 分鐘。請於下方輸入信件中的 6 位數字驗證碼。
        </p>

        <FormField
          control={form.control}
          name="otpCode"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>6 位電子郵件驗證碼</FormLabel>
                {form.formState.errors.otpCode && (
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.otpCode.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="register-otpCode"
                  placeholder="請輸入 6 位數字驗證碼"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={loading}
          >
            返回修改資料
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-[#ffc000] text-[#34313c] hover:bg-yellow-500 font-bold"
            disabled={loading}
          >
            {loading ? "註冊中..." : "確認註冊"}
          </Button>
        </div>

        <div className="text-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={handleResend}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `重新發送驗證碼 (${resendCooldown}s)` : "重新發送驗證碼"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ---------------- Forgot Password Step 1 ----------------

interface ForgotStep1FormProps {
  initialData: { studentId: string; email: string };
  onBack: () => void;
  onNext: (data: { studentId: string; email: string }) => void;
}

function ForgotStep1Form({
  initialData,
  onBack,
  onNext,
}: ForgotStep1FormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotStep1Schema>>({
    resolver: zodResolver(forgotStep1Schema),
    defaultValues: {
      studentId: initialData.studentId || "",
      email: initialData.email || "",
    },
  });

  async function onSubmit(values: z.infer<typeof forgotStep1Schema>) {
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/request", {
        studentId: values.studentId,
        email: values.email,
      });
      if (!res.data.success) throw new Error(res.data.message || "發送失敗");
      toast({ title: "驗證碼已寄出", description: `請查收 ${values.email}` });
      onNext(values);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "發送失敗，請稍後再試";
      if (msg.includes("學號") || msg.includes("找不到")) {
        form.setError("studentId", { message: msg });
      } else if (msg.includes("信箱") || msg.includes("不符")) {
        form.setError("email", { message: msg });
      } else {
        form.setError("email", { message: msg });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-3">
        <p className="text-sm text-muted-foreground">
          請輸入您的學號與當初註冊時填寫的電子郵件，驗證碼將寄送至該信箱。
        </p>

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
                  id="forgot-studentId"
                  placeholder="請輸入學號 (如 B11207123)"
                  autoComplete="username"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>註冊電子郵件</FormLabel>
                {form.formState.errors.email && (
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.email.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="forgot-email"
                  type="email"
                  inputMode="email"
                  placeholder="請輸入註冊時填寫的信箱"
                  autoComplete="email"
                  {...field}
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

// ---------------- Forgot Password Step 2 ----------------

interface ForgotStep2FormProps {
  studentId: string;
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

function ForgotStep2Form({
  studentId,
  email,
  onBack,
  onSuccess,
}: ForgotStep2FormProps) {
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
        email,
        code: values.code,
        newPassword: values.newPassword,
      });
      if (!res.data.success) throw new Error(res.data.message || "重設失敗");
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-3">
        <p className="text-sm text-muted-foreground">
          驗證碼已寄至 <strong className="text-foreground">{email}</strong>，有效期限 15 分鐘。
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
              <div className="flex justify-between items-center h-5">
                <FormLabel>6 位驗證碼</FormLabel>
                {form.formState.errors.code && (
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.code.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="forgot-code"
                  placeholder="請輸入信箱收到的 6 位驗證碼"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>新密碼</FormLabel>
                {form.formState.errors.newPassword && (
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.newPassword.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="forgot-newPassword"
                  type="password"
                  placeholder="英數字混合，至少 6 碼"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center h-5">
                <FormLabel>確認新密碼</FormLabel>
                {form.formState.errors.confirmPassword && (
                  <span className="text-destructive text-xs leading-none">
                    {form.formState.errors.confirmPassword.message}
                  </span>
                )}
              </div>
              <FormControl>
                <Input
                  id="forgot-confirmPassword"
                  type="password"
                  placeholder="請再次輸入新密碼"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
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
            返回重新發送
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
