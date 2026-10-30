import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, TrendingUp } from "lucide-react";

import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Template Gallery",
  description: "Browse and use professional card templates.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// CANVA-STYLE TEMPLATES - Show design styles, users upload their own photos
const TEMPLATES = [
  {
    id: "business-pro",
    name: "Business Professional",
    category: "Business",
    theme: "professional",
    preview: {
      name: "Sarah Johnson",
      designation: "Senior Marketing Director",
      company: "Tech Solutions Inc",
      accent: "#84cc16",
      photo: "/demo/photo.svg", // Demo placeholder - user uploads their own
      cover: null // User can add cover photo
    },
    tags: ["Corporate", "Professional", "Clean"],
    description: "Perfect for corporate professionals and executives"
  },
  {
    id: "creative-designer",
    name: "Creative Designer",
    category: "Creative",
    theme: "creative",
    preview: {
      name: "Alex Chen",
      designation: "UI/UX Designer",
      company: "Design Studio",
      accent: "#f59e0b",
      photo: "/demo/photo.svg",
      cover: "/demo/cover.svg" // Demo cover
    },
    tags: ["Creative", "Portfolio", "Modern"],
    description: "Showcase your creative work and portfolio"
  },
  {
    id: "minimal-founder",
    name: "Minimal Founder",
    category: "Startup",
    theme: "minimal",
    preview: {
      name: "Michael Brown",
      designation: "Founder & CEO",
      company: "StartupXYZ",
      accent: "#3b82f6",
      photo: "/demo/photo.svg",
      cover: null
    },
    tags: ["Minimal", "Startup", "Clean"],
    description: "Clean and minimal design for startup founders"
  },
  {
    id: "luxury-consultant",
    name: "Luxury Consultant",
    category: "Business",
    theme: "luxury",
    preview: {
      name: "Jennifer Lee",
      designation: "Business Consultant",
      company: "Elite Consulting",
      accent: "#eab308",
      photo: "/demo/photo.svg",
      cover: "/demo/cover.svg"
    },
    tags: ["Luxury", "Premium", "Elegant"],
    description: "Premium design for high-end consultants"
  },
  {
    id: "tech-developer",
    name: "Tech Developer",
    category: "Technology",
    theme: "dark",
    preview: {
      name: "David Kim",
      designation: "Full Stack Developer",
      company: "CodeCraft Labs",
      accent: "#8b5cf6",
      photo: "/demo/photo.svg",
      cover: "/demo/cover.svg"
    },
    tags: ["Tech", "Developer", "Modern"],
    description: "Dark theme perfect for developers and tech professionals"
  },
  {
    id: "restaurant-owner",
    name: "Restaurant Owner",
    category: "Food & Beverage",
    theme: "restaurant",
    preview: {
      name: "Maria Garcia",
      designation: "Owner & Chef",
      company: "La Cuisine Restaurant",
      accent: "#ef4444",
      photo: "/demo/photo.svg",
      cover: "/demo/cover.svg"
    },
    tags: ["Restaurant", "Food", "Business"],
    description: "Showcase your restaurant and culinary expertise"
  },
  {
    id: "realtor-agent",
    name: "Real Estate Agent",
    category: "Real Estate",
    theme: "real-estate",
    preview: {
      name: "Robert Taylor",
      designation: "Senior Real Estate Agent",
      company: "Premium Properties",
      accent: "#0891b2",
      photo: "/demo/photo.svg",
      cover: "/demo/cover.svg"
    },
    tags: ["Real Estate", "Sales", "Professional"],
    description: "Professional design for real estate agents"
  },
  {
    id: "medical-doctor",
    name: "Medical Professional",
    category: "Healthcare",
    theme: "medical",
    preview: {
      name: "Dr. Emily White",
      designation: "General Physician",
      company: "City Medical Center",
      accent: "#059669",
      photo: "/demo/photo.svg",
      cover: null
    },
    tags: ["Medical", "Healthcare", "Professional"],
    description: "Clean and trustworthy design for medical professionals"
  },
  {
    id: "photographer-portfolio",
    name: "Photographer Portfolio",
    category: "Creative",
    theme: "portfolio",
    preview: {
      name: "James Wilson",
      designation: "Professional Photographer",
      company: "Wilson Photography",
      accent: "#dc2626",
      photo: "/demo/photo.svg",
      cover: "/demo/cover.svg"
    },
    tags: ["Photography", "Portfolio", "Creative"],
    description: "Portfolio-focused design for photographers"
  },
  {
    id: "entrepreneur",
    name: "Entrepreneur",
    category: "Business",
    theme: "business",
    preview: {
      name: "Lisa Anderson",
      designation: "Business Owner",
      company: "Anderson Enterprises",
      accent: "#84cc16",
      photo: "/demo/photo.svg",
      cover: "/demo/cover.svg"
    },
    tags: ["Entrepreneur", "Business", "Professional"],
    description: "Versatile design for business owners and entrepreneurs"
  },
  {
    id: "freelancer",
    name: "Freelancer",
    category: "Freelance",
    theme: "minimal",
    preview: {
      name: "Tom Harris",
      designation: "Freelance Consultant",
      company: "Independent",
      accent: "#6366f1",
      photo: "/demo/photo.svg",
      cover: null
    },
    tags: ["Freelance", "Consultant", "Minimal"],
    description: "Flexible design for freelancers and consultants"
  },
  {
    id: "influencer",
    name: "Social Media Influencer",
    category: "Social Media",
    theme: "spotlight",
    preview: {
      name: "Sophie Martin",
      designation: "Content Creator",
      company: "@sophiemartin",
      accent: "#ec4899",
      photo: "/demo/photo.svg",
      cover: "/demo/cover.svg"
    },
    tags: ["Influencer", "Social Media", "Creative"],
    description: "Eye-catching design for content creators and influencers"
  },
];

const CATEGORIES = ["All", "Business", "Creative", "Startup", "Technology", "Healthcare", "Real Estate", "Food & Beverage", "Freelance", "Social Media"];

export default async function TemplatesPage() {
  await requireUser();

  return (
    <div style={{ minHeight: "100dvh", background: "var(--dv-off-white)" }}>
      {/* Header */}
      <header style={{ background: "var(--dv-white)", borderBottom: "1px solid var(--dv-border)", padding: "2.5rem 1.5rem 2rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1.5rem" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--dv-gray-light)", marginBottom: "0.5rem" }}>
                Dashboard
              </p>
              <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.04em", textTransform: "uppercase", color: "var(--dv-black)", lineHeight: 1 }}>
                Template Gallery
              </h1>
              <p style={{ margin: "0.625rem 0 0", fontSize: "0.9375rem", color: "var(--dv-gray)", lineHeight: 1.5 }}>
                Start with a professional template. Customize it to match your brand.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Sparkles style={{ width: "1.25rem", height: "1.25rem", color: "var(--dv-lime)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{TEMPLATES.length} Templates</span>
            </div>
          </div>
        </div>
      </header>

      {/* Category Filters */}
      <div style={{ background: "var(--dv-white)", borderBottom: "1px solid var(--dv-border)", padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "999px",
                border: "1px solid var(--dv-border)",
                background: cat === "All" ? "var(--dv-lime)" : "var(--dv-white)",
                color: cat === "All" ? "var(--dv-black)" : "var(--dv-gray)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid - CANVA STYLE */}
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
          gap: "1.5rem" 
        }}>
          {TEMPLATES.map((template) => (
            <Link
              key={template.id}
              href={`/dashboard/templates/select?template=${template.id}`}
              style={{
                display: "block",
                background: "var(--dv-white)",
                borderRadius: "16px",
                border: "1px solid var(--dv-border)",
                overflow: "hidden",
                textDecoration: "none",
                transition: "all 0.3s",
                cursor: "pointer"
              }}
              className="template-card"
            >
              {/* Preview Card - WITH REAL IMAGES */}
              <div style={{ 
                padding: "0", 
                background: `linear-gradient(135deg, ${template.preview.accent}15 0%, ${template.preview.accent}05 100%)`,
                borderBottom: "1px solid var(--dv-border)",
                minHeight: "280px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                position: "relative",
                overflow: "hidden"
              }}>
                {/* Cover Image */}
                {template.preview.cover && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "120px",
                    backgroundImage: `url(${template.preview.cover})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.3
                  }} />
                )}

                {/* Card content */}
                <div style={{
                  padding: "1.5rem",
                  background: "white",
                  margin: "1rem",
                  borderRadius: "12px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  border: "1px solid #e5e5e5",
                  position: "relative",
                  zIndex: 1
                }}>
                  {/* Photo */}
                  {template.preview.photo ? (
                    <div style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      backgroundImage: `url(${template.preview.photo})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: `3px solid ${template.preview.accent}`,
                      marginBottom: "1rem"
                    }} />
                  ) : (
                    <div style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: template.preview.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "white",
                      marginBottom: "1rem"
                    }}>
                      {template.preview.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: "1.25rem", 
                    fontWeight: 700, 
                    color: "#000",
                    marginBottom: "0.375rem"
                  }}>
                    {template.preview.name}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: "0.9375rem", 
                    color: "#666",
                    marginBottom: "0.25rem"
                  }}>
                    {template.preview.designation}
                  </p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: "0.875rem", 
                    color: "#999"
                  }}>
                    {template.preview.company}
                  </p>
                </div>

                {/* Trending badge */}
                {template.id === "business-pro" && (
                  <div style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    background: "var(--dv-lime)",
                    color: "#000",
                    padding: "0.375rem 0.75rem",
                    borderRadius: "999px",
                    fontSize: "0.6875rem",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    zIndex: 2
                  }}>
                    <TrendingUp style={{ width: "0.875rem", height: "0.875rem" }} />
                    Popular
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <h4 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "#000" }}>
                    {template.name}
                  </h4>
                  <ArrowRight style={{ width: "1.125rem", height: "1.125rem", color: "var(--dv-gray)" }} />
                </div>
                <p style={{ 
                  margin: "0 0 0.75rem 0", 
                  fontSize: "0.8125rem", 
                  color: "var(--dv-gray)",
                  lineHeight: 1.5
                }}>
                  {template.description}
                </p>
                <p style={{ 
                  margin: "0 0 0.75rem 0", 
                  fontSize: "0.75rem", 
                  color: "var(--dv-gray-light)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem"
                }}>
                  <Zap style={{ width: "0.875rem", height: "0.875rem" }} />
                  {template.category} • {template.theme}
                </p>
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "0.6875rem",
                        padding: "0.25rem 0.625rem",
                        background: "var(--dv-off-white)",
                        borderRadius: "999px",
                        color: "var(--dv-gray)",
                        fontWeight: 600
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .template-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.12);
          border-color: var(--dv-lime);
        }
      `}</style>
    </div>
  );
}
