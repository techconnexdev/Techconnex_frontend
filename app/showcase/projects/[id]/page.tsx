import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShowcasePublicProjectDetailClient from "@/components/Homepage/ShowcasePublicProjectDetailClient";
import { fetchPublicJobById } from "@/lib/homepage-api";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchPublicJobById(id);
  const title = data?.opportunity?.title;
  return {
    title: title ? `${title} | Techconnex` : "Project | Techconnex",
    description: data?.opportunity?.description?.slice(0, 160) || undefined,
  };
}

export default async function ShowcaseProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await fetchPublicJobById(id);
  if (!data?.success || !data.opportunity) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-8 md:pt-28">
      <ShowcasePublicProjectDetailClient opportunity={data.opportunity} />
    </div>
  );
}
