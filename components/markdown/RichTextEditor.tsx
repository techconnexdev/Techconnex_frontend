"use client";

import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import "./styles.css";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  initialHeight?: number;
}

export const RichEditor: React.FC<RichEditorProps> = ({
  content,
  onChange,
  placeholder = "Start typing…",
  className = "",
  style = {},
  initialHeight = 80,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // No height adjustment needed - using fixed height with scrollbar

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
        },
        orderedList: {
          keepMarks: true,
        },
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        className: "p-4 focus:outline-none rich-editor-content",
      },
    },
    immediatelyRender: false,
  });

  // Sync external content updates
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div
      ref={editorRef}
      className={`border border-gray-200 rounded-lg shadow-sm cursor-text ${className}`}
      style={{
        height: `${initialHeight}px`,
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
      onClick={() => {
        if (editor) {
          editor.view.focus();
        }
      }}
    >
      <Toolbar editor={editor} />
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <EditorContent editor={editor} className="rich-editor-content" />
      </div>
    </div>
  );
};

interface ToolbarProps {
  editor: Editor | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const buttonClasses = (active: boolean) =>
    `px-2 py-1 rounded-md text-sm font-medium transition-colors ${
      active
        ? "bg-purple-600 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClasses(editor.isActive("bold"))}
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClasses(editor.isActive("italic"))}
      >
        I
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonClasses(editor.isActive("strike"))}
      >
        S
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={buttonClasses(editor.isActive("code"))}
      >
        {"<>"}
      </button>
      <button
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        className={buttonClasses(false)}
      >
        Clear Marks
      </button>
      <button
        onClick={() => editor.chain().focus().clearNodes().run()}
        className={buttonClasses(false)}
      >
        Clear Nodes
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClasses(editor.isActive("heading", { level: 1 }))}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClasses(editor.isActive("heading", { level: 2 }))}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClasses(editor.isActive("bulletList"))}
      >
        • List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClasses(editor.isActive("orderedList"))}
      >
        1. List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={buttonClasses(editor.isActive("codeBlock"))}
      >
        Code Block
      </button>
      <button
        onClick={() => editor.chain().focus().undo().run()}
        className={buttonClasses(false)}
      >
        Undo
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        className={buttonClasses(false)}
      >
        Redo
      </button>
    </div>
  );
};
