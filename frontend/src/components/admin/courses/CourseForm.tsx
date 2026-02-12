'use client';

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Course } from "@/lib/types/course";
import { Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const linkSchema = z.object({
  title: z.string().min(1, "標題必填"),
  link: z.string().url("請輸入有效的網址")
});

const courseSchema = z.object({
  title: z.string().min(1, "課程名稱必填"),
  description: z.string().optional(),
  semester: z.string().min(1, "學期必填"), // e.g. 114-1
  permission: z.enum(["visitor", "member"]),
  handouts: z.array(linkSchema).optional(),
  videos: z.array(linkSchema).optional(),
  others: z.array(linkSchema).optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseFormProps {
  defaultValues?: Partial<CourseFormValues>;
  onSubmit: (data: CourseFormValues) => void;
  isLoading?: boolean;
}

export function CourseForm({ defaultValues, onSubmit, isLoading }: CourseFormProps) {
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      semester: "", // Default could be calculated
      permission: "member",
      handouts: [],
      videos: [],
      others: [],
      ...defaultValues,
    }
  });

  const { fields: handoutFields, append: appendHandout, remove: removeHandout } = useFieldArray({
    control: form.control,
    name: "handouts"
  });

  const { fields: videoFields, append: appendVideo, remove: removeVideo } = useFieldArray({
    control: form.control,
    name: "videos"
  });

  const { fields: otherFields, append: appendOther, remove: removeOther } = useFieldArray({
    control: form.control,
    name: "others"
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>課程名稱</FormLabel>
                <FormControl>
                  <Input placeholder="例如：113-1 社課 - Python入門" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="semester"
            render={({ field }) => (
              <FormItem>
                <FormLabel>學期 (格式: 113-1)</FormLabel>
                <FormControl>
                  <Input placeholder="113-1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="permission"
          render={({ field }) => (
            <FormItem>
              <FormLabel>權限設定</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇權限" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="visitor">Visitor (公開可見，隱藏錄影)</SelectItem>
                  <SelectItem value="member">Member (僅成員可見)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Visitor 權限將在首頁顯示，但不會顯示錄影連結。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>課程說明</FormLabel>
              <FormControl>
                <Textarea placeholder="課程簡介..." className="h-24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />
        
        {/* Handouts */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <FormLabel>講義連結</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={() => appendHandout({ title: "", link: "" })}>
              <Plus className="w-4 h-4 mr-1" /> 新增講義
            </Button>
          </div>
          <div className="space-y-2">
            {handoutFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <FormField
                  control={form.control}
                  name={`handouts.${index}.title`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="標題" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`handouts.${index}.link`}
                  render={({ field }) => (
                    <FormItem className="flex-[2]">
                      <FormControl>
                        <Input placeholder="URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeHandout(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Videos */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <FormLabel>錄影連結</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={() => appendVideo({ title: "", link: "" })}>
              <Plus className="w-4 h-4 mr-1" /> 新增錄影
            </Button>
          </div>
          <div className="space-y-2">
            {videoFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <FormField
                  control={form.control}
                  name={`videos.${index}.title`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="標題" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`videos.${index}.link`}
                  render={({ field }) => (
                    <FormItem className="flex-[2]">
                      <FormControl>
                        <Input placeholder="YouTube URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeVideo(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />
        
        {/* Others */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <FormLabel>其他資料</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={() => appendOther({ title: "", link: "" })}>
              <Plus className="w-4 h-4 mr-1" /> 新增資料
            </Button>
          </div>
          <div className="space-y-2">
            {otherFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <FormField
                  control={form.control}
                  name={`others.${index}.title`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="標題" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`others.${index}.link`}
                  render={({ field }) => (
                    <FormItem className="flex-[2]">
                      <FormControl>
                        <Input placeholder="URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOther(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "處理中..." : "送出"}
        </Button>
      </form>
    </Form>
  );
}
