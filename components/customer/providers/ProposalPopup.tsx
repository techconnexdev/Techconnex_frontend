"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X, FileText } from "lucide-react";
import io from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ServiceRequest = {
  id: string;
  title: string;
  status: string;
};

type ProposalPopupProps = {
  providerId: string;
  providerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ProposalPopup({
  providerId,
  providerName,
  isOpen,
  onClose,
  onSuccess,
}: ProposalPopupProps) {
  const [projectRequests, setProjectRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ServiceRequest | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const getUserAndToken = () => {
    if (typeof window === "undefined") return { userId: "", token: "" };
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token") || "";
      return { userId: user?.id || "", token };
    } catch {
      return { userId: "", token: "" };
    }
  };

  const fetchProjectRequests = useCallback(async () => {
    const { token } = getUserAndToken();
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/company/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log("📋 Projects API response:", data);
      if (data.success) {
        const projects = data.items ?? data.data;
        console.log("📋 All projects:", projects);
        
        // Log first project structure to check field names
        if (projects.length > 0) {
          console.log("📋 First project structure:", projects[0]);
          console.log("📋 First project ID field:", projects[0].id);
          console.log("📋 First project all keys:", Object.keys(projects[0]));
        }
        
        const openProjects = projects.filter(
          (proj: Record<string, unknown>) => proj.status === "OPEN" && proj.projectId === null
        );
        console.log("📋 Open projects:", openProjects);
        setProjectRequests(openProjects as ServiceRequest[]);
      }
    } catch (error) {
      console.error("Error fetching project requests", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch open project requests
  useEffect(() => {
    if (isOpen) {
      fetchProjectRequests();
    }
  }, [isOpen, fetchProjectRequests]);

  const handleSendProposal = async () => {
    const { userId, token } = getUserAndToken();
    if (!userId || !token || !selectedProject) return;

    try {
      setSending(true);

      console.log("🔧 API_URL:", API_URL);
      console.log("🔧 User ID:", userId);
      console.log("🔧 Provider ID:", providerId);
      console.log("🔧 Selected Project:", selectedProject);
      console.log("🔧 Selected Project ID:", selectedProject.id);
      console.log("🔧 Selected Project ID type:", typeof selectedProject.id);

      if (!API_URL) {
        throw new Error("API_URL is not defined");
      }

      // Create a new socket connection
      const socket = io(API_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      // Wait for socket connection
      await new Promise((resolve, reject) => {
        console.log("🔄 Waiting for socket connection...");

        if (socket.connected) {
          console.log("✅ Socket already connected");
          resolve(true);
        } else {
          socket.once("connect", () => {
            console.log("✅ Socket connected successfully");
            resolve(true);
          });
          socket.once("connect_error", (error) => {
            console.error("❌ Socket connection error:", error);
            reject(error);
          });
          setTimeout(() => {
            console.error("❌ Socket connection timeout");
            reject(new Error("Connection timeout"));
          }, 5000);
        }
      });

      const messageData = {
        senderId: userId,
        receiverId: providerId,
        content: message.trim() || selectedProject.title,
        messageType: "proposal" as const,
        attachments: [selectedProject.id],
      };

      console.log("📤 Final message data:", messageData);
      console.log("📤 Attachment ID:", selectedProject.id);
      console.log("📤 Is attachment ID valid UUID?", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedProject.id));

      console.log("📤 Sending proposal data:", messageData);

      // Send via socket with callback and timeout
      const emitTimeout = setTimeout(() => {
        console.error("❌ Socket emit timeout");
        socket.close();
        setSending(false);
        alert("Failed to send proposal: Timeout");
      }, 10000);

      socket.emit("send_message", messageData, (response: { success?: boolean; error?: string }) => {
        clearTimeout(emitTimeout);
        console.log("📨 Socket callback response:", response);

        // Close socket connection after sending
        socket.close();

        if (response?.success) {
          console.log("✅ Proposal sent successfully");
          onSuccess();
          onClose();
          // Reset form
          setSelectedProject(null);
          setMessage("");
        } else {
          console.error("❌ Failed to send proposal:", response?.error);
          alert(
            "Failed to send proposal: " + (response?.error || "Unknown error")
          );
        }
        setSending(false);
      });
    } catch (error) {
      console.error("❌ Error sending proposal via socket:", error);

      // Fallback: Try using HTTP API
      console.log("🔄 Trying fallback HTTP method...");
      try {
        const response = await fetch(`${API_URL}/messages/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            senderId: userId,
            receiverId: providerId,
            content: message.trim() || selectedProject.title,
            messageType: "proposal",
            attachments: [selectedProject.id],
          }),
        });

        const data = await response.json();
        if (data.success) {
          console.log("✅ Proposal sent successfully via HTTP fallback");
          onSuccess();
          onClose();
          setSelectedProject(null);
          setMessage("");
        } else {
          console.error("❌ Failed to send proposal via HTTP:", data.message);
          alert(
            "Failed to send proposal: " + (data.message || "Unknown error")
          );
        }
      } catch (httpError) {
        console.error(
          "❌ Error sending proposal via HTTP fallback:",
          httpError
        );
        alert("Failed to send proposal. Please try again.");
      }
      setSending(false);
    }
  };

  const handleClose = () => {
    setSelectedProject(null);
    setMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Request Proposal from {providerName}</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto">
          {/* Project Selection */}
          <div>
            <h3 className="font-medium mb-3">Select a Project</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : projectRequests.length === 0 ? (
              <div className="text-center py-6 border rounded-lg">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">No open projects available</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create a project first to request a proposal
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={handleClose}
                >
                  Close
                </Button>
              </div>
            ) : (
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {projectRequests.map((project) => (
                  <div
                    key={project.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProject?.id === project.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      console.log("🎯 Selected project:", project);
                      console.log("🎯 Project ID:", project.id);
                      setSelectedProject(project);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{project.title}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {project.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {project.id}
                        </p>
                      </div>
                      {selectedProject?.id === project.id && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          {selectedProject && (
            <div>
              <h3 className="font-medium mb-3">
                Message to {providerName}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Optional)
                </span>
              </h3>
              <Textarea
                placeholder={`Hi ${providerName}, I'd like to request a proposal for my project "${selectedProject.title}". Please let me know your availability and estimated timeline.`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                If left empty, the project title will be used as the message.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {projectRequests.length > 0 && (
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendProposal}
                disabled={!selectedProject || sending}
                className="flex-1"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Proposal"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
