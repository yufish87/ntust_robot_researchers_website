'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/hooks/use-toast';

// Define schema validation
const formSchema = z.object({
  studentId: z.string().min(1, '請輸入學號'),
  password: z.string().min(1, '請輸入密碼'),
});

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setLoading(true);
    try {
      await login(values);
      toast({
        title: "登入成功",
        description: "歡迎回到機器人研究社",
      });
      router.push('/dashboard'); 
    } catch (err: any) {
      const errorMessage = err.message || '學號或密碼錯誤';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "登入失敗",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4 relative">
      <Button 
        variant="ghost" 
        className="absolute top-4 left-4 text-slate-500 hover:text-slate-900"
        onClick={() => router.push('/')}
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
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
                {loading ? '登入中...' : '登入'}
              </Button>

              <div className="text-center mt-2">
                <Button 
                  variant="link" 
                  className="text-slate-500"
                  onClick={() => router.push('/auth/register')}
                  type="button"
                >
                  還沒有帳號？立即註冊
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
