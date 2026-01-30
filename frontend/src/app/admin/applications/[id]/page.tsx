"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, ArrowLeft, Calendar, User, Package } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Wait, I don't recall seeing use-toast. I'll stick to simple alerts or just error state for now to be safe, or check for toast component.
// Re-checking components list... I didn't see toast. I'll use simple state.

interface ApplicationDetail {
  id: string
  studentId: string
  name: string
  reason: string
  items: any[]
  summary: string
  pickupDate: string
  returnDate: string
  status: string
  createdAt: string
  // ... other fields
}

export default function ApplicationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15+ params is a Promise
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const router = useRouter()
  const [application, setApplication] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)

  // Reject Dialog State
  const [rejectReason, setRejectReason] = useState("")
  const [isRejectOpen, setIsRejectOpen] = useState(false)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/admin/applications/details?id=${id}`)
        if (res.data.success) {
          setApplication(res.data.data)
        } else {
          setError(res.data.message || "Failed to fetch details")
        }
      } catch (err: any) {
        setError(err.message || "Error fetching details")
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  const handleReview = async (action: 'approve' | 'reject') => {
      try {
          setProcessing(true)
          const payload = {
              applicationId: id,
              action: action,
              rejectReason: action === 'reject' ? rejectReason : undefined,
              allocatedItems: [] // Optional: Implement allocation logic later
          }

          const res = await api.post('/admin/applications/review', payload)
          
          if (res.data.success) {
              // Success
              router.push('/admin/applications')
              router.refresh()
          } else {
              alert("Operation failed: " + res.data.message)
          }
      } catch (err: any) {
          alert("Error: " + err.message)
      } finally {
          setProcessing(false)
      }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
  if (error) return <div className="p-12 text-red-500">Error: {error}</div>
  if (!application) return <div className="p-12">Application not found</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/applications">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
            </Button>
        </Link>
        <div>
            <h1 className="text-2xl font-bold">申請審核</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span className="font-mono">{application.id}</span>
                <span>•</span>
                <span>{application.createdAt}</span>
            </div>
        </div>
        <div className="ml-auto">
            <Badge className="text-base px-3 py-1" variant={application.status === '待審核' ? 'secondary' : 'default'}>
                {application.status}
            </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" /> 借用器材清單
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <ul className="space-y-4">
                          {application.items?.map((item: any, idx: number) => (
                              <li key={idx} className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0">
                                  <div>
                                      <div className="font-medium">{item.name}</div>
                                      <div className="text-sm text-muted-foreground font-mono">{item.code}</div>
                                  </div>
                                  <div className="font-bold">x {item.qty}</div>
                              </li>
                          ))}
                      </ul>
                  </CardContent>
              </Card>

              <Card>
                  <CardHeader>
                      <CardTitle>借用理由</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="whitespace-pre-wrap">{application.reason}</p>
                  </CardContent>
              </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                          <User className="h-4 w-4" /> 申請人資訊
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      <div>
                          <Label className="text-xs text-muted-foreground">姓名</Label>
                          <div className="font-medium">{application.name}</div>
                      </div>
                      <div>
                          <Label className="text-xs text-muted-foreground">學號</Label>
                          <div className="font-mono">{application.studentId}</div>
                      </div>
                  </CardContent>
              </Card>

              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                          <Calendar className="h-4 w-4" /> 時間安排
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      <div>
                          <Label className="text-xs text-muted-foreground">預計領取</Label>
                          <div>{application.pickupDate || "社課時間"}</div>
                      </div>
                      <div>
                          <Label className="text-xs text-muted-foreground">預計歸還</Label>
                          <div className="text-blue-600 font-medium">{new Date(application.returnDate).toLocaleDateString('zh-TW', {year: 'numeric', month: '2-digit', day: '2-digit'})}</div>
                      </div>
                  </CardContent>
              </Card>

              {/* Actions */}
              {application.status === '待審核' && (
                  <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader>
                          <CardTitle className="text-base text-blue-900">審核操作</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => handleReview('approve')}
                            disabled={processing}
                          >
                              {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                              通過申請
                          </Button>
                          
                          <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                    variant="destructive" 
                                    className="w-full"
                                    disabled={processing}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    拒絕申請
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                  <DialogHeader>
                                      <DialogTitle>拒絕申請</DialogTitle>
                                      <DialogDescription>
                                          請輸入拒絕原因，此原因將會通知申請人。
                                      </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                      <Label htmlFor="reason" className="text-right">拒絕原因</Label>
                                      <Textarea 
                                        id="reason" 
                                        value={rejectReason} 
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="例如：庫存不足、理由不充分..."
                                        className="mt-2"
                                      />
                                  </div>
                                  <DialogFooter>
                                      <Button variant="outline" onClick={() => setIsRejectOpen(false)}>取消</Button>
                                      <Button 
                                        variant="destructive" 
                                        onClick={() => handleReview('reject')}
                                        disabled={!rejectReason.trim() || processing}
                                      >
                                          確認拒絕
                                      </Button>
                                  </DialogFooter>
                              </DialogContent>
                          </Dialog>
                      </CardContent>
                  </Card>
              )}
          </div>
      </div>
    </div>
  )
}
