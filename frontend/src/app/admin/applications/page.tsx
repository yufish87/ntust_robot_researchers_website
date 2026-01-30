"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, ArrowRight } from "lucide-react"

interface Application {
  id: string
  studentId: string
  name: string
  summary: string
  status: string
  createdAt: string
  returnDate: string
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/applications/pending')
      if (res.data.success) {
        setApplications(res.data.data)
      } else {
        setError(res.data.message || "Failed to fetch applications")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  if (loading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">申請審核</h2>
            <p className="text-muted-foreground mt-1">管理與審核待處理的器材借用申請。</p>
        </div>
        <Button variant="outline" onClick={fetchApplications}>重新整理</Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-red-600">
                Error: {error}
            </CardContent>
        </Card>
      )}

      <Card>
          <CardHeader>
              <CardTitle>待審核清單 ({applications.length})</CardTitle>
              <CardDescription>以下是所有狀態為「待審核」的申請單。</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    目前沒有待審核的申請。
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">申請單號</TableHead>
                            <TableHead>申請人</TableHead>
                            <TableHead className="w-[300px]">借用摘要</TableHead>
                            <TableHead>預計歸還</TableHead>
                            <TableHead>申請時間</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.map((app) => (
                            <TableRow key={app.id}>
                                <TableCell className="font-mono font-medium">{app.id}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{app.name}</div>
                                    <div className="text-xs text-muted-foreground">{app.studentId}</div>
                                </TableCell>
                                <TableCell className="truncate max-w-[300px]" title={app.summary}>
                                    {app.summary}
                                </TableCell>
                                <TableCell>{new Date(app.returnDate).toLocaleDateString('zh-TW', {year: 'numeric', month: '2-digit', day: '2-digit'})}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {app.createdAt}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                                        {app.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/admin/applications/${app.id}`}>
                                        <Button size="sm">
                                            審核 <ArrowRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
          </CardContent>
      </Card>
    </div>
  )
}
