"use client";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Clock, Check, X } from "lucide-react";

export default function StatsBar({ stats }: { stats: { total: number; pending: number; accepted: number; rejected: number } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Stat title="Total Requests" value={stats.total} icon={<MessageSquare className="w-6 h-6 text-blue-600" />} bg="bg-blue-100" />
      <Stat title="Pending" value={stats.pending} icon={<Clock className="w-6 h-6 text-yellow-600" />} bg="bg-yellow-100" valueClass="text-yellow-600" />
      <Stat title="Accepted" value={stats.accepted} icon={<Check className="w-6 h-6 text-green-600" />} bg="bg-green-100" valueClass="text-green-600" />
      <Stat title="Rejected" value={stats.rejected} icon={<X className="w-6 h-6 text-red-600" />} bg="bg-red-100" valueClass="text-red-600" />
    </div>
  );
}

function Stat({ title, value, icon, bg, valueClass = "text-gray-900" }:{ title:string; value:number; icon:React.ReactNode; bg:string; valueClass?:string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
          </div>
          <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
