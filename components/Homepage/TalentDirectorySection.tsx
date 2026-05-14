import ShowcaseDirectory from "@/components/Homepage/ShowcaseDirectory";
import type { HomepageCompany, HomepageFreelancer } from "@/lib/homepage-api";

export default function TalentDirectorySection({
  topFreelancers,
  topCompanies,
}: {
  topFreelancers: HomepageFreelancer[];
  topCompanies: HomepageCompany[];
}) {
  return (
    <ShowcaseDirectory
      variant="talent"
      latestJobs={[]}
      topFreelancers={topFreelancers}
      topCompanies={topCompanies}
    />
  );
}
