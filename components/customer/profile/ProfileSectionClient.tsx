"use client";

import ProfileClient from "./ProfileClient";

type Section = "profile" | "company" | "verification";

type Props = {
  section: Section;
};

export default function ProfileSectionClient({ section }: Props) {
  return <ProfileClient defaultTab={section} />;
}
