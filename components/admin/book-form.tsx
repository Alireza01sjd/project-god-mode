// @/components/admin/book-form.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"; // Import Image
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Upload, X, Plus, Save, ArrowLeft, ImageIcon, Loader2 } from "lucide-react"
import { addBook, uploadBookCover, uploadBookFile, addBookTags } from "@/actions/books"
import { useToast } from "@/hooks/use-toast"
import { supabase } from '@/lib/supabase'
import type { Book } from '@/types/book'

// Define ReadingLevel type locally based on schema
type ReadingLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "عنوان کتاب الزامی است"),
  author: z.string().min(1, "نام نویسنده الزامی است"),
  category: z.string().min(1, "دسته‌بندی الزامی است"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  content: z.string().min(1, "محتوا الزامی است"),
  description: z.string().min(10, "توضیحات باید حداقل 10 کاراکتر باشد").optional().or(z.literal('')),
  publish_date: z.string().optional(),
  page_count: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().nonnegative().optional(),
  discount: z.coerce.number().int().min(0).max(100).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Author {
  id: string;
  name: string;
  bio?: string;
}

interface BookFormProps {
  initialData?: {
    title: string;
    author: string;
    category: string;
    content: string;
  };
}

const levels: Array<{ id: ReadingLevel; name: string }> = [
  { id: 'BEGINNER', name: 'مبتدی' },
  { id: 'INTERMEDIATE', name: 'متوسط' },
  { id: 'ADVANCED', name: 'پیشرفته' },
];

const availableTags = [
  'مدیریت زمان',
  'خودسازی',
  'برنامه‌ریزی',
  'روانشناسی',
  'موفقیت',
  'انگیزشی',
  'کارآفرینی',
  'مدیریت مالی',
  'رهبری',
  'ارتباطات',
];

export function BookForm({ initialData }: BookFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [bookCoverPreview, setBookCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      author: initialData?.author || '',
      category: initialData?.category || '',
      content: initialData?.content || '',
      level: 'BEGINNER',
      description: '',
      publish_date: '',
      page_count: undefined,
      price: undefined,
      discount: 0,
      meta_title: '',
      meta_description: '',
      tags: [],
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (categoriesError) throw categoriesError
        setCategories(categoriesData)

        const { data: authorsData, error: authorsError } = await supabase
          .from('authors')
          .select('*')
          .order('name')

        if (authorsError) throw authorsError
        setAuthors(authorsData)

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "خطا",
          description: "خطا در دریافت اطلاعات",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [toast])

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { toast({ title: "خطا", description: "حجم تصویر جلد نباید بیشتر از 2 مگابایت باشد.", variant: "destructive" }); return; }
      if (!file.type.startsWith("image/")) { toast({ title: "خطا", description: "فرمت فایل جلد نامعتبر است.", variant: "destructive" }); return; }
      setCoverFile(file);
      if (bookCoverPreview) URL.revokeObjectURL(bookCoverPreview);
      const imageUrl = URL.createObjectURL(file);
      setBookCoverPreview(imageUrl);
    }
  };

   useEffect(() => { return () => { if (bookCoverPreview) URL.revokeObjectURL(bookCoverPreview); }; }, [bookCoverPreview]);

  const handleBookFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
     if (file) {
        if (file.size > 50 * 1024 * 1024) { toast({ title: "خطا", description: "حجم فایل کتاب نباید بیشتر از 50 مگابایت باشد.", variant: "destructive" }); return; }
        setBookFile(file);
     }
  };

  const handleTagSelect = (tag: string) => {
    let updatedTags: string[];
    if (selectedTags.includes(tag)) updatedTags = selectedTags.filter((t) => t !== tag);
    else updatedTags = [...selectedTags, tag];
    setSelectedTags(updatedTags);
    form.setValue("tags", updatedTags);
  };

  const handleAddNewTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag) && !availableTags.includes(trimmedTag)) {
      const updatedTags = [...selectedTags, trimmedTag];
      setSelectedTags(updatedTags);
      form.setValue("tags", updatedTags);
      setNewTag("");
    } else if (!trimmedTag) toast({ title: "توجه", description: "لطفا نام تگ را وارد کنید.", variant: "default" });
    else toast({ title: "توجه", description: "این تگ قبلا اضافه شده است.", variant: "default" });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      let coverUrl = null
      let fileUrl = null

      if (coverFile) {
        coverUrl = await uploadBookCover(coverFile)
      }

      if (bookFile) {
        fileUrl = await uploadBookFile(bookFile)
      }

      // Ensure required fields are present
      const bookData = {
        title: values.title,
        author: values.author,
        category: values.category,
        level: values.level,
        content: values.content,
        description: values.description || undefined,
        publish_date: values.publish_date || undefined,
        page_count: values.page_count || undefined,
        price: values.price || undefined,
        discount: values.discount || undefined,
        meta_title: values.meta_title || undefined,
        meta_description: values.meta_description || undefined,
        cover_url: coverUrl || undefined,
        file_url: fileUrl || undefined,
      }

      const book = await addBook(bookData)

      if (selectedTags.length > 0) {
        await addBookTags(book.id, selectedTags)
      }

      toast({
        title: "موفق",
        description: "کتاب با موفقیت اضافه شد",
      })

      router.push('/admin/books')
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "خطا",
        description: "خطا در ذخیره اطلاعات",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="bg-muted p-1 rounded-lg h-auto mb-6 grid grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="basic">اطلاعات اصلی</TabsTrigger>
            <TabsTrigger value="content">محتوا و فایل‌ها</TabsTrigger>
            <TabsTrigger value="pricing">قیمت‌گذاری</TabsTrigger>
            <TabsTrigger value="metadata">متادیتا</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader><CardTitle>اطلاعات اصلی کتاب</CardTitle><CardDescription>اطلاعات پایه کتاب را وارد کنید.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    {/* Title & Author */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>عنوان کتاب</FormLabel><FormControl><Input placeholder="مثال: اتم‌های عادت" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="author" render={({ field }) => (<FormItem><FormLabel>نویسنده</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب نویسنده" /></SelectTrigger></FormControl><SelectContent>{authors.map((author) => ( <SelectItem key={author.id} value={author.id}>{author.name}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                    {/* Category & Level */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>دسته‌بندی</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب دسته‌بندی" /></SelectTrigger></FormControl><SelectContent>{categories.map((category) => ( <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem>)} />
                       <FormField control={form.control} name="level" render={({ field }) => (<FormItem><FormLabel>سطح</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="انتخاب سطح" /></SelectTrigger></FormControl><SelectContent>{levels.map((level) => ( <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                     {/* Publish Date & Page Count */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <FormField control={form.control} name="publish_date" render={({ field }) => (<FormItem><FormLabel>تاریخ انتشار (اختیاری)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                       <FormField control={form.control} name="page_count" render={({ field }) => (<FormItem><FormLabel>تعداد صفحات (اختیاری)</FormLabel><FormControl><Input type="number" placeholder="مثال: 320" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    {/* Description */}
                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>توضیحات کتاب</FormLabel><FormControl><Textarea placeholder="خلاصه‌ای از کتاب..." className="min-h-32" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </CardContent>
                </Card>
              </div>
              {/* Cover Upload */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader><CardTitle>تصویر جلد کتاب</CardTitle><CardDescription>تصویر جلد را آپلود کنید (حداکثر 2MB).</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center">
                      <Label htmlFor="cover-upload" className="cursor-pointer">
                        <div className="relative w-48 h-64 bg-muted rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                          {bookCoverPreview ? (<><Image src={bookCoverPreview} alt="Book cover preview" fill className="object-cover rounded-lg" /><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full z-10" onClick={(e) => { e.preventDefault(); setBookCoverPreview(null); setCoverFile(null); }}><X className="h-4 w-4" /></Button></>) : (<><ImageIcon className="h-10 w-10 mb-2" /><p className="text-sm text-center mb-2 px-2">تصویر جلد را اینجا رها کنید یا کلیک کنید</p><span className="text-xs">(JPG, PNG, WEBP)</span></>)}
                        </div>
                      </Label>
                      <Input id="cover-upload" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleCoverUpload} className="hidden" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-0">
            <Card>
              <CardHeader><CardTitle>محتوا و فایل‌های کتاب</CardTitle><CardDescription>فایل کتاب و تگ‌های مرتبط را وارد کنید.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                {/* Book File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="book-file-upload">فایل کتاب (PDF, EPUB)</Label>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <Button type="button" variant="outline" asChild><Label htmlFor="book-file-upload" className="cursor-pointer"><Upload className="h-4 w-4 ml-2" /> انتخاب فایل</Label></Button>
                    <Input id="book-file-display" placeholder="فایلی انتخاب نشده است" value={bookFile?.name || ""} readOnly />
                    <Input id="book-file-upload" type="file" accept=".pdf,.epub" onChange={handleBookFileUpload} className="hidden" />
                  </div>
                </div>
                 {/* Tags */}
                 <FormField control={form.control} name="tags" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between"><span>تگ‌ها</span><Badge variant="secondary">{selectedTags.length}</Badge></FormLabel>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[80px]">
                        {selectedTags.map((tag) => (<Badge key={tag} variant="outline" className="flex items-center gap-1 pr-2">{tag}<button type="button" onClick={() => handleTagSelect(tag)} className="mr-1 rounded-full hover:bg-destructive/20 p-0.5"><X className="h-3 w-3" /></button></Badge>))}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                         <Input placeholder="افزودن تگ جدید..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewTag(); } }}/>
                         <Button type="button" variant="outline" size="icon" onClick={handleAddNewTag}><Plus className="h-4 w-4"/></Button>
                      </div>
                       <p className="text-xs text-muted-foreground">تگ‌های موجود را انتخاب کنید یا تگ جدیدی وارد کرده و Enter بزنید یا + را کلیک کنید.</p>
                       <div className="flex flex-wrap gap-1 mt-1">
                           {availableTags.filter(t => !selectedTags.includes(t)).map((tag) => (<Badge key={tag} variant="secondary" onClick={() => handleTagSelect(tag)} className="cursor-pointer hover:bg-primary/20">{tag}</Badge>))}
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

           {/* Pricing Tab */}
          <TabsContent value="pricing" className="mt-0">
            <Card>
              <CardHeader><CardTitle>قیمت‌گذاری (اختیاری)</CardTitle><CardDescription>قیمت و تخفیف کتاب را مشخص کنید.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>قیمت (تومان)</FormLabel><FormControl><Input type="number" placeholder="مثال: 25000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="discount" render={({ field }) => (<FormItem><FormLabel>تخفیف (%)</FormLabel><FormControl><Input type="number" min="0" max="100" placeholder="مثال: 10" {...field} value={field.value ?? 0} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="mt-0">
            <Card>
              <CardHeader><CardTitle>متادیتا (اختیاری)</CardTitle><CardDescription>اطلاعات SEO برای بهبود دیده شدن در موتورهای جستجو.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="meta_title" render={({ field }) => (<FormItem><FormLabel>عنوان متا</FormLabel><FormControl><Input placeholder="عنوان صفحه در نتایج جستجو" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="meta_description" render={({ field }) => (<FormItem><FormLabel>توضیحات متا</FormLabel><FormControl><Textarea placeholder="توضیح کوتاه برای نتایج جستجو" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
            {isSubmitting ? (<><Loader2 className="ml-2 h-4 w-4 animate-spin" /> در حال ذخیره...</>) : (<><Save className="ml-2 h-4 w-4" /> ذخیره کتاب</>)}
          </Button>
        </div>
      </form>
    </Form>
  );
}