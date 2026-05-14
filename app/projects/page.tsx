import Link from "next/link";
import PublicDirectoryShell from "@/components/Homepage/PublicDirectoryShell";
import { fetchHomepageData } from "@/lib/homepage-api";
import { Briefcase, DollarSign, Clock, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Project Opportunities | TechConnex",
  description: "Browse the latest premium tech projects and opportunities.",
};

export default async function ProjectsPage() {
  const homepageData = await fetchHomepageData({ limit: 12 });
  const projects = homepageData?.latestJobs ?? [];

  return (
    <PublicDirectoryShell
      eyebrow="Open Opportunities"
      title="Global Projects"
      description="Discover high-impact projects from top companies worldwide. Apply directly and grow your professional portfolio."
      count={projects.length}
      countLabel="active projects"
      links={[
        { href: "/projects", label: "Projects", active: true },
        { href: "/freelancers", label: "Freelancers" },
      ]}
    >
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 text-blue-500 shadow-sm ring-1 ring-blue-100">
            <Briefcase className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">No active projects</h3>
          <p className="text-slate-500 max-w-md text-base leading-relaxed">We're currently sourcing new exclusive opportunities. Please check back later or update your preferences.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          {projects.map((job) => (
            <article
              key={job.id}
              className="group flex flex-col bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              {/* Decorative top border */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>

              <div className="flex items-start justify-between mb-5">
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                  {job.category || "General"}
                </span>
                <span className="flex items-center text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl ring-1 ring-slate-100">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  New
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                {job.title}
              </h2>

              <div className="flex items-center text-slate-600 mb-8 font-semibold">
                <div className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl ring-1 ring-emerald-100/50">
                  <DollarSign className="w-4 h-4 mr-0.5" />
                  <span>{job.budgetMin.toLocaleString()} - {job.budgetMax.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-auto pt-5 border-t border-slate-100/80">
                <div className="flex flex-wrap gap-2 mb-6">
                  {(job.skills || []).slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/60 rounded-lg hover:bg-slate-100 transition-colors cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                  {(job.skills?.length > 4) && (
                    <span className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200/60 rounded-lg cursor-default">
                      +{job.skills.length - 4}
                    </span>
                  )}
                </div>

                <Link
                  href="/auth/register?role=provider"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Apply Now
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </PublicDirectoryShell>
  );
}
