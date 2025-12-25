// app/customer/profile/documents/[id]/page.tsx
import { CustomerLayout } from "@/components/customer-layout";
// ✅ import the type so the object is validated at compile time
import type { DocumentDetail } from "@/components/customer/profile/documents/types";
import DocumentDetailClient from "@/components/customer/profile/documents/DocumentDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function DocumentDetailPage({ params }: Props) {
  const { id } = await params;
  const document: DocumentDetail = {
    id: id,
    name: "Business_Registration_Certificate.pdf",
    type: "Business Registration",
    size: "2.4 MB",
    uploadDate: "2024-01-15T10:30:00",
    status: "approved", // ✅ one of: "approved" | "pending" | "rejected" | "under_review"
    reviewDate: "2024-01-16T14:20:00",
    reviewer: "Admin Team",
    version: "1.0",
    documentNumber: "DOC-2024-001",
    description: "Business registration certificate for Tech Innovations Sdn Bhd",
    metadata: {
      uploadedBy: "Ahmad Rahman",
      ipAddress: "103.xxx.xxx.xxx",
      fileHash: "sha256:abc123...",
      mimeType: "application/pdf",
    },
    verificationDetails: {
      documentType: "Business Registration (SSM)",
      issueDate: "2023-06-15",
      expiryDate: "2025-06-15",
      registrationNumber: "SSM-123456789",
      issuingAuthority: "Suruhanjaya Syarikat Malaysia (SSM)",
    },
    timeline: [
      {
        status: "uploaded",
        timestamp: "2024-01-15T10:30:00",
        description: "Document uploaded successfully",
        user: "Ahmad Rahman",
      },
      {
        status: "under_review", // ✅ fixed typo
        timestamp: "2024-01-15T11:00:00",
        description: "Document submitted for review",
        user: "System",
      },
      {
        status: "approved",
        timestamp: "2024-01-16T14:20:00",
        description: "Document verified and approved",
        user: "Admin Team",
      },
    ],
    notes: [
      {
        timestamp: "2024-01-16T14:20:00",
        user: "Admin Team",
        message: "Document verified successfully. All information matches our records.",
      },
    ],
  };

  return (
    <CustomerLayout>
      <DocumentDetailClient document={document} />
    </CustomerLayout>
  );
}
