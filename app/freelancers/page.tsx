import Image from "next/image";
import Link from "next/link";
import PublicDirectoryShell from "@/components/Homepage/PublicDirectoryShell";
import { fetchHomepageData } from "@/lib/homepage-api";
import { getProfileImageUrl } from "@/lib/api";
import { Star, CheckCircle, Award, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Top Freelancers | TechConnex",
  description: "Hire elite freelance tech professionals.",
};

const PLACEHOLDER_AVATAR = "/placeholders/avatar-default.svg";

export default async function FreelancersPage() {
  const homepageData = await fetchHomepageData({ limit: 12 });
  const freelancers = homepageData?.topFreelancers ?? [];

  return (
    <PublicDirectoryShell
      eyebrow="Elite Talent"
      title="Featured Freelancers"
      description="Connect with pre-vetted professionals ready to bring your visionary projects to life with unparalleled expertise."
      count={freelancers.length}
      countLabel="verified pros"
      links={[
        { href: "/projects", label: "Projects" },
        { href: "/freelancers", label: "Freelancers", active: true },
      ]}
    >
      {freelancers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 text-indigo-500 shadow-sm ring-1 ring-indigo-100">
            <Award className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">No profiles found</h3>
          <p className="text-slate-500 max-w-md text-base leading-relaxed">We are currently updating our exclusive talent directory. Please check back shortly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          {freelancers.map((person) => {
            const avatarSrc = person.profileImageUrl
              ? getProfileImageUrl(person.profileImageUrl)
              : PLACEHOLDER_AVATAR;

            return (
              <article
                key={person.id}
                className="group relative flex flex-col bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 z-0"
              >
                {/* Background decorative blob */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 pointer-events-none"></div>

                <div className="relative flex items-center gap-5 mb-8">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-blue-600 rounded-2xl rotate-6 scale-95 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-[3px] border-white shadow-md bg-slate-100 transform group-hover:-translate-y-1 transition-transform duration-300">
                      <Image
                        src={avatarSrc}
                        alt={person.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5 shadow-sm">
                      <CheckCircle className="w-6 h-6 text-blue-500" fill="white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 py-1">
                    <h2 className="text-xl font-extrabold text-slate-900 truncate mb-1">
                      {person.name}
                    </h2>
                    <p className="text-sm font-bold text-blue-600 truncate bg-blue-50 inline-block px-2.5 py-1 rounded-lg">
                      Top Rated
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50/80 rounded-2xl p-4 border border-slate-100/80">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">Rating</span>
                    <div className="flex items-center gap-2 text-slate-800 font-extrabold text-lg">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-sm" />
                      {person.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex flex-col border-l border-slate-200/80 pl-4">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">Success</span>
                    <div className="flex items-center gap-2 text-slate-800 font-extrabold text-lg">
                      <Award className="w-5 h-5 text-blue-500 drop-shadow-sm" />
                      {person.totalProjects} Proj.
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <Link
                    href="/auth/register?role=customer"
                    className="w-full inline-flex items-center justify-between px-6 py-4 rounded-xl bg-slate-50 hover:bg-slate-900 text-slate-700 hover:text-white text-sm font-bold transition-colors duration-300 group/btn ring-1 ring-slate-200/60 hover:ring-slate-900"
                  >
                    View Profile
                    <div className="bg-white rounded-full p-1.5 shadow-sm group-hover/btn:bg-slate-800 group-hover/btn:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PublicDirectoryShell>
  );
}
