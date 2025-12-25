"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, FileText, CheckCircle, XCircle, Clock, Eye, Trash2, Upload, Calendar, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DocumentDetail } from "./types";



export default function DocumentDetailClient({ document }: { document: DocumentDetail }) {
  const router = useRouter();
  const { toast } = useToast();

  const getStatusColor = (s: string) =>
    s === "approved" ? "bg-green-100 text-green-800"
    : s === "pending" || s === "under_review" ? "bg-yellow-100 text-yellow-800"
    : s === "rejected" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800";

  const getStatusIcon = (s: string) =>
    s === "approved" ? <CheckCircle className="w-4 h-4" />
    : s === "pending" || s === "under_review" ? <Clock className="w-4 h-4" />
    : s === "rejected" ? <XCircle className="w-4 h-4" />
    : <FileText className="w-4 h-4" />;

  const handleDownload = () => toast({ title: "Downloading Document", description: "Your document is being downloaded." });
  const handleDelete = () => { toast({ title: "Document Deleted", description: "The document has been removed." }); router.back(); };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Details</h1>
            <p className="text-gray-600">{document.name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownload}><Download className="w-4 h-4 mr-2" />Download</Button>
          <Button variant="outline"><Eye className="w-4 h-4 mr-2" />View Document</Button>
          {document.status === "rejected" && <Button><Upload className="w-4 h-4 mr-2" />Reupload</Button>}
        </div>
      </div>

      {/* Status */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Document Status</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{document.status.replace("_"," ")}</p>
                <p className="text-sm text-gray-500 mt-1">Last updated: {new Date(document.uploadDate).toLocaleString()}</p>
              </div>
            </div>
            <Badge className={`${getStatusColor(document.status)} text-lg px-4 py-2`}>
              {getStatusIcon(document.status)}
              <span className="ml-2 capitalize">{document.status.replace("_"," ")}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Document Overview</CardTitle>
              <CardDescription>Basic information about this document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <KV k="Document Type" v={document.type} />
                <KV k="Document Number" v={document.documentNumber} />
                <KV k="File Size" v={document.size} />
                <KV k="Version" v={document.version} />
                <KV k="Upload Date" v={new Date(document.uploadDate).toLocaleDateString()} icon={<Calendar className="w-4 h-4 text-gray-400" />} />
                <KV k="Reviewed Date" v={document.reviewDate ? new Date(document.reviewDate).toLocaleDateString() : "-"} icon={<Calendar className="w-4 h-4 text-gray-400" />} />
              </div>
              <Separator />
              {document.description && <p className="text-gray-700">{document.description}</p>}
            </CardContent>
          </Card>

          {/* Verification details */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Details</CardTitle>
              <CardDescription>Official document information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <KV k="Document Type" v={document.verificationDetails.documentType} />
                <KV k="Registration Number" v={document.verificationDetails.registrationNumber} />
                <KV k="Issue Date" v={new Date(document.verificationDetails.issueDate).toLocaleDateString()} />
                <KV k="Expiry Date" v={new Date(document.verificationDetails.expiryDate).toLocaleDateString()} />
                <div className="col-span-2">
                  <KV k="Issuing Authority" v={document.verificationDetails.issuingAuthority} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Document Timeline</CardTitle>
              <CardDescription>History of document status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {document.timeline.map((e, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        e.status === "approved" ? "bg-green-100" :
                        e.status === "under_review" ? "bg-blue-100" : "bg-gray-100"}`}>
                        {e.status === "approved" ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                         e.status === "under_review" ? <Clock className="w-4 h-4 text-blue-600" /> :
                         <Upload className="w-4 h-4 text-gray-600" />}
                      </div>
                      {i < document.timeline.length - 1 && <div className="w-0.5 h-12 bg-gray-200 my-1" />}
                    </div>
                    <div className="flex-1 pb-8">
                      <p className="font-medium">{e.description}</p>
                      <p className="text-sm text-gray-500">{new Date(e.timestamp).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">By: {e.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {document.notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Notes</CardTitle>
                <CardDescription>Comments from the verification team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {document.notes.map((n, i) => (
                  <div key={i} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <UserIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-blue-900">{n.user}</p>
                          <p className="text-sm text-blue-600">{new Date(n.timestamp).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-blue-800">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Metadata</CardTitle>
              <CardDescription>Technical information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <KV k="Uploaded By" v={document.metadata.uploadedBy} />
              <Separator />
              <KV k="IP Address" v={document.metadata.ipAddress} />
              <Separator />
              <KV k="MIME Type" v={document.metadata.mimeType} />
              <Separator />
              <div>
                <p className="text-sm text-gray-500">File Hash</p>
                <p className="text-xs font-mono text-gray-600 break-all">{document.metadata.fileHash}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />Download Document
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Eye className="w-4 h-4 mr-2" />View Document
              </Button>
              {document.status === "rejected" && (
                <Button className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />Reupload Document
                </Button>
              )}
              <Separator className="my-2" />
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />Delete Document
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Document Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Preview not available</p>
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent">View Full Document</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KV({ k, v, icon }: { k: string; v?: string | number; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{k}</p>
      <div className="flex items-center gap-2">
        {icon}{icon ? <span className="font-medium">{v ?? "-"}</span> : <p className="font-medium">{v ?? "-"}</p>}
      </div>
    </div>
  );
}
