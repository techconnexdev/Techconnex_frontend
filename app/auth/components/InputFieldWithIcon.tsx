"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";

interface InputFieldProps {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  icon: LucideIcon;
  required?: boolean;
}

export function InputFieldWithIcon({ id, type, label, placeholder, icon: Icon, required = true }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          required={required}
        />
      </div>
    </div>
  );
}
