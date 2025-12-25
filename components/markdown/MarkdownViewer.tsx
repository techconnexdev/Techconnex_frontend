"use client";

import React from "react";
import "./markdown-viewer.css";

interface MarkdownViewerProps {
  content: string;
  className?: string;
  emptyMessage?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className = "",
  emptyMessage = "No content available",
}) => {
  // If no content, show empty message
  if (!content || content.trim() === "" || content === "<p></p>") {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>{emptyMessage}</div>
    );
  }

  // If content is HTML from RichEditor, display it directly
  if (content && content.includes("<")) {
    return (
      <div
        className={`markdown-viewer ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // If it's plain text, wrap in p tag
  return (
    <div className={`markdown-viewer ${className}`}>
      <p>{content}</p>
    </div>
  );
};
