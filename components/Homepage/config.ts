// =============================================================================
// Techconnex Site Configuration
// Edit ONLY this file to customize all content across the site.
// All animations, layouts, and styles are controlled by the components.
// =============================================================================

// -- Site-wide settings -------------------------------------------------------
export interface SiteConfig {
  title: string;
  description: string;
  language: string;
}

export const siteConfig: SiteConfig = {
  title: "Techconnex - Connect with Top Tech Freelancers",
  description: "Techconnex is the premier platform connecting businesses with elite tech freelancers. Find developers, designers, and digital experts for your next project.",
  language: "en",
};

// -- Hero Section -------------------------------------------------------------
export interface HeroNavItem {
  label: string;
  sectionId: string;
  icon: "disc" | "play" | "calendar" | "music";
}

export interface HeroConfig {
  backgroundImage: string;
  brandName: string;
  decodeText: string;
  decodeChars: string;
  subtitle: string;
  ctaPrimary: string;
  ctaPrimaryTarget: string;
  ctaSecondary: string;
  ctaSecondaryTarget: string;
  cornerLabel: string;
  cornerDetail: string;
  navItems: HeroNavItem[];
}

export const heroConfig: HeroConfig = {
  backgroundImage: "/hero-bg.jpg",
  brandName: "TECHCONNEX",
  decodeText: "CONNECT. CREATE. CONQUER.",
  decodeChars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*",
  subtitle: "The premier platform connecting businesses with elite tech freelancers. Find the perfect talent for your next big project.",
  ctaPrimary: "Find Talent",
  ctaPrimaryTarget: "features",
  ctaSecondary: "Watch Demo",
  ctaSecondaryTarget: "video",
  cornerLabel: "TRUSTED BY",
  cornerDetail: "500+ Companies",
  navItems: [
    { label: "Features", sectionId: "features", icon: "disc" },
    { label: "Showcase", sectionId: "showcase", icon: "play" },
    { label: "Talent", sectionId: "talent", icon: "music" },
    { label: "Contact", sectionId: "contact", icon: "calendar" },
  ],
};

// -- Features Cube Section (replaces Album Cube) -------------------------------------------------------
export interface Feature {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

export interface FeatureCubeConfig {
  features: Feature[];
  cubeTextures: string[];
  scrollHint: string;
}

export const featureCubeConfig: FeatureCubeConfig = {
  features: [
    { id: 1, title: "AI MATCHING", subtitle: "Smart Talent Discovery", image: "/feature-ai.jpg" },
    { id: 2, title: "SECURE PAYMENTS", subtitle: "Protected Transactions", image: "/feature-secure.jpg" },
    { id: 3, title: "REAL-TIME CHAT", subtitle: "Instant Communication", image: "/feature-chat.jpg" },
    { id: 4, title: "PROJECT TOOLS", subtitle: "Complete Management", image: "/feature-tools.jpg" },
  ],
  cubeTextures: [
    "/cube-1.jpg",
    "/cube-2.jpg",
    "/cube-3.jpg",
    "/cube-4.jpg",
    "/cube-5.jpg",
    "/cube-6.jpg",
  ],
  scrollHint: "Scroll to explore features",
};

// -- Parallax Gallery Section -------------------------------------------------
export interface ParallaxImage {
  id: number;
  src: string;
  alt: string;
}

export interface GalleryImage {
  id: number;
  src: string;
  title: string;
  date: string;
}

export interface ParallaxGalleryConfig {
  sectionLabel: string;
  sectionTitle: string;
  galleryLabel: string;
  galleryTitle: string;
  marqueeTexts: string[];
  endCtaText: string;
  parallaxImagesTop: ParallaxImage[];
  parallaxImagesBottom: ParallaxImage[];
  galleryImages: GalleryImage[];
}

export const parallaxGalleryConfig: ParallaxGalleryConfig = {
  sectionLabel: "OUR COMMUNITY",
  sectionTitle: "TOP TALENT AT YOUR FINGERTIPS",
  galleryLabel: "DIVERSE PROJECTS",
  galleryTitle: "PROJECTS THAT INSPIRE",
  marqueeTexts: [
    "WEB DEVELOPMENT",
    "MOBILE APPS",
    "UI/UX DESIGN",
    "CLOUD SOLUTIONS",
    "AI & ML",
    "BLOCKCHAIN",
    "DEVOPS",
    "CYBERSECURITY",
  ],
  endCtaText: "Start Your Project Today",
  parallaxImagesTop: [
    { id: 1, src: "/homepage/talent-1.jpg", alt: "Developer working" },
    { id: 2, src: "/homepage/talent-2.jpg", alt: "Designer creating" },
    { id: 3, src: "/homepage/talent-3.jpg", alt: "Team collaboration" },
    { id: 4, src: "/homepage/talent-4.jpg", alt: "Code review" },
    { id: 5, src: "/homepage/talent-5.jpg", alt: "Project planning" },
    { id: 6, src: "/homepage/talent-6.jpg", alt: "Client meeting" },
  ],
  parallaxImagesBottom: [
    { id: 7, src: "/homepage/project-1.jpg", alt: "Website launch" },
    { id: 8, src: "/homepage/project-2.jpg", alt: "App deployment" },
    { id: 9, src: "/homepage/project-3.jpg", alt: "Design showcase" },
    { id: 10, src: "/homepage/project-4.jpg", alt: "Product demo" },
    { id: 11, src: "/homepage/project-5.jpg", alt: "Team celebration" },
    { id: 12, src: "/homepage/project-6.jpg", alt: "Success metrics" },
  ],
  galleryImages: [
    { id: 1, src: "/homepage/gallery-1.jpg", title: "E-Commerce Platform", date: "2026" },
    { id: 2, src: "/homepage/gallery-2.jpg", title: "Fintech Dashboard", date: "2026" },
    { id: 3, src: "/homepage/gallery-3.jpg", title: "HealthTech App", date: "2026" },
    { id: 4, src: "/homepage/gallery-4.jpg", title: "AI Analytics Tool", date: "2026" },
    { id: 5, src: "/homepage/gallery-5.jpg", title: "Social Platform", date: "2026" },
    { id: 6, src: "/homepage/gallery-6.jpg", title: "Enterprise SaaS", date: "2026" },
  ],
};

// -- Video Player Section (NEW) -----------------------------------------------
export interface VideoPlayerConfig {
  sectionLabel: string;
  sectionTitle: string;
  /** Local MP4 path (e.g. in public folder). Used when set; otherwise videoUrl (YouTube) is used. */
  videoSrc?: string;
  videoUrl: string;
  posterImage: string;
  description: string;
}

const HOMEPAGE_VIDEO_URL =
  "https://pub-1b42bf42946146b099454ebfefcf05bb.r2.dev/Homepage%20Video/TechconnexExplainerVideo.mp4";

export const videoPlayerConfig: VideoPlayerConfig = {
  sectionLabel: "SEE IT IN ACTION",
  sectionTitle: "DISCOVER TECHCONNEX",
  videoSrc: HOMEPAGE_VIDEO_URL,
  videoUrl: "",
  posterImage: "/homepage/video-poster.jpg",
  description: "Watch how Techconnex transforms the way businesses connect with world-class tech talent. From AI-powered matching to seamless project management, see why thousands of companies trust our platform.",
};

// -- Talent Pool Section (replaces Tour Schedule) -----------------------------
export interface TalentCategory {
  id: number;
  name: string;
  /** Optional; omit for new startups (no fake counts) */
  count?: string;
  skills: string[];
  image: string;
  /** Short AI insight shown under the category preview when hovered */
  aiInsight?: string;
}

export interface TalentPoolConfig {
  sectionLabel: string;
  sectionTitle: string;
  spinnerImage: string;
  hireButtonText: string;
  detailsButtonText: string;
  bottomNote: string;
  bottomCtaText: string;
  categories: TalentCategory[];
}

export const talentPoolConfig: TalentPoolConfig = {
  sectionLabel: "TALENT POOL",
  sectionTitle: "FIND YOUR PERFECT MATCH",
  spinnerImage: "/homepage/spinner-icon.png",
  hireButtonText: "Hire Now",
  detailsButtonText: "View Profile",
  bottomNote: "Join our growing community of tech talent.",
  bottomCtaText: "Become a Freelancer",
  categories: [
    {
      id: 1,
      name: "Full-Stack Developers",
      skills: ["React", "Node.js", "Python", "AWS"],
      image: "/homepage/talent-dev.jpg",
      aiInsight: "Top picks often combine React with Node.js—ideal for full product ownership and faster delivery.",
    },
    {
      id: 2,
      name: "UI/UX Designers",
      skills: ["Figma", "Adobe XD", "Prototyping", "Research"],
      image: "/homepage/talent-designer.jpg",
      aiInsight: "Designers with strong prototyping skills see 2x higher project completion and client satisfaction.",
    },
    {
      id: 3,
      name: "Mobile Developers",
      skills: ["iOS", "Android", "Flutter", "React Native"],
      image: "/homepage/talent-mobile.jpg",
      aiInsight: "Cross-platform (Flutter, React Native) talent reduces time-to-market for both iOS and Android.",
    },
    {
      id: 4,
      name: "Data Scientists",
      skills: ["Python", "TensorFlow", "SQL", "Visualization"],
      image: "/homepage/talent-data.jpg",
      aiInsight: "Profiles with SQL + visualization skills are best matched to analytics and reporting projects.",
    },
  ],
};

// -- Footer Section -----------------------------------------------------------
export interface FooterImage {
  id: number;
  src: string;
}

export interface SocialLink {
  icon: "instagram" | "twitter" | "youtube" | "music";
  label: string;
  href: string;
}

export interface FooterConfig {
  portraitImage: string;
  portraitAlt: string;
  heroTitle: string;
  heroSubtitle: string;
  brandLabel: string;
  brandName: string;
  brandSubtitle: string;
  brandDescription: string;
  quickLinksTitle: string;
  quickLinks: string[];
  contactTitle: string;
  emailLabel: string;
  email: string;
  phoneLabel: string;
  phone: string;
  addressLabel: string;
  address: string;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterButtonText: string;
  subscribeAlertMessage: string;
  copyrightText: string;
  bottomLinks: string[];
  socialLinks: SocialLink[];
  galleryImages: FooterImage[];
}

export const footerConfig: FooterConfig = {
  portraitImage: "/footer-hero.jpg",
  portraitAlt: "Techconnex community",
  heroTitle: "READY TO BUILD?",
  heroSubtitle: "Your next great project starts here",
  brandLabel: "PLATFORM",
  brandName: "TECHCONNEX",
  brandSubtitle: "Connect. Create. Conquer.",
  brandDescription: "The premier platform connecting businesses with elite tech freelancers. Find developers, designers, and digital experts for your next project.",
  quickLinksTitle: "Quick Links",
  quickLinks: ["How It Works", "Pricing", "Success Stories", "Blog", "Support"],
  contactTitle: "Contact Us",
  emailLabel: "Email",
  email: "hello@techconnex.vip",
  phoneLabel: "Phone",
  phone: "+1 (555) 123-4567",
  addressLabel: "Address",
  address: "123 Innovation Drive, San Francisco, CA 94105",
  newsletterTitle: "Stay Updated",
  newsletterDescription: "Get the latest news and updates from Techconnex",
  newsletterButtonText: "Subscribe",
  subscribeAlertMessage: "Thanks for subscribing!",
  copyrightText: "© 2026 CYBERNET CONSULTING SDN. BHD. All rights reserved.",
  bottomLinks: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
  socialLinks: [
    { icon: "twitter", label: "Twitter", href: "https://twitter.com/techconnex" },
    { icon: "instagram", label: "LinkedIn", href: "https://linkedin.com/company/techconnex" },
    { icon: "youtube", label: "YouTube", href: "https://youtube.com/techconnex" },
    { icon: "music", label: "GitHub", href: "https://github.com/techconnex" },
  ],
  galleryImages: [
    { id: 1, src: "/footer-1.jpg" },
    { id: 2, src: "/footer-2.jpg" },
    { id: 3, src: "/footer-3.jpg" },
    { id: 4, src: "/footer-4.jpg" },
  ],
};
