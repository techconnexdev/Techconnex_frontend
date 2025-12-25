// app/provider/companies/page.tsx
import { ProviderLayout } from "@/components/provider-layout";
import FindCompaniesClient from "@/components/provider/companies/FindCompaniesClient";

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  let locations = [
    { value: "all", label: "All Locations" },
    { value: "kuala lumpur", label: "Kuala Lumpur" },
    { value: "selangor", label: "Selangor" },
  ];

  let ratings = [
    { value: "all", label: "All Ratings" },
    { value: "5.0+", label: "5.0 Stars" },
    { value: "4.8+", label: "4.8+ Stars" },
    { value: "4.5+", label: "4.5+ Stars" },
    { value: "4.0+", label: "4.0+ Stars" },
    { value: "3.5+", label: "3.5+ Stars" },
    { value: "3.0+", label: "3.0+ Stars" },
    { value: "2.5+", label: "2.5+ Stars" },
    { value: "2.0+", label: "2.0+ Stars" },
    { value: "1.5+", label: "1.5+ Stars" },
    { value: "1.0+", label: "1.0+ Stars" },
  ];

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/companies/filters`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        locations = data.locations || locations;
        ratings = data.ratings || ratings;
      }
    }
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    // Use default options if API fails
  }

  return (
    <ProviderLayout>
      <FindCompaniesClient
        industries={[]}
        locations={locations}
        companySizes={[]}
        ratings={ratings}
      />
    </ProviderLayout>
  );
}

