export type Timeline = {
  status: "uploaded" | "under_review" | "approved" | "rejected";
  timestamp: string;
  description: string;
  user: string;
};

export type Note = { timestamp: string; user: string; message: string };

export type DocumentDetail = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: "approved" | "pending" | "rejected" | "under_review";
  reviewDate?: string;
  reviewer?: string;
  version?: string;
  documentNumber?: string;
  description?: string;
  metadata: {
    uploadedBy: string;
    ipAddress: string;
    fileHash: string;
    mimeType: string;
  };
  verificationDetails: {
    documentType: string;
    issueDate: string;
    expiryDate: string;
    registrationNumber: string;
    issuingAuthority: string;
  };
  timeline: Timeline[];
  notes: Note[];
};
