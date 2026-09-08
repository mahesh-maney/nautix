import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowUpRight, Check, FileText, Globe, Mail, MapPin, Menu, MoveRight, Phone, X, Shield, Zap, Anchor, Headphones, Package, Settings, Tag, Ruler, Briefcase } from "lucide-react";
import { apiPostForm } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ContactSubmission {
  id: string;
  name: string;
  company: string;
  email: string;
  requirement: string;
  requirement_type: string | null;
  attachment_name: string | null;
  status: "new" | "in_review" | "complete";
  created_at: string;
}

type RequirementTypeKey =
  | "part_reference"
  | "specification"
  | "drawing_datasheet"
  | "bom"
  | "equipment_requirement"
  | "project_package";

interface ContactFormState {
  name: string;
  company: string;
  email: string;
  requirement: string;
  requirement_type: RequirementTypeKey | null;
  attachment: File | null;
}

const initialForm: ContactFormState = {
  name: "",
  company: "",
  email: "",
  requirement: "",
  requirement_type: null,
  attachment: null,
};

const images = {
  hero: "https:" + "//static.prod-images.emergentagent.com/jobs/35ce120c-36ad-428b-959c-c3a892191cde/images/a0c930320c17a89d790e446a060ccc024810ded6f42c30c9aca8f63fbd707f7c.jpeg",
  engineRoom: "https:" + "//static.prod-images.emergentagent.com/jobs/35ce120c-36ad-428b-959c-c3a892191cde/images/07f48489a3f64b58f3bb9401b2aefeed199a5be0f03713e36ff8243970ea6586.jpeg",
  fabrication: "https:" + "//static.prod-images.emergentagent.com/jobs/35ce120c-36ad-428b-959c-c3a892191cde/images/3606d0d2f83dd0e754303d17e93099d3c60bb23e5b86f16dcfbf73f338053314.jpeg",
};

const requirementTypes: {
  key: RequirementTypeKey;
  label: string;
  requirementPlaceholder: string;
  attachmentLabel: string;
}[] = [
  {
    key: "part_reference",
    label: "PART REFERENCE",
    requirementPlaceholder: "Include manufacturer, OEM, or part / model reference if you have it.",
    attachmentLabel: "Attach a reference document",
  },
  {
    key: "specification",
    label: "SPECIFICATION",
    requirementPlaceholder: "Share your specification, standard, or technical requirement.",
    attachmentLabel: "Attach a specification document",
  },
  {
    key: "drawing_datasheet",
    label: "DRAWING / DATASHEET",
    requirementPlaceholder: "Describe what you need — attach your drawing or datasheet below.",
    attachmentLabel: "Attach drawing / datasheet",
  },
  {
    key: "bom",
    label: "BOM",
    requirementPlaceholder: "Describe the scope of supply — attach your BOM below.",
    attachmentLabel: "Attach BOM",
  },
  {
    key: "equipment_requirement",
    label: "EQUIPMENT REQUIREMENT",
    requirementPlaceholder: "Describe the equipment, its application and any constraints.",
    attachmentLabel: "Attach a requirement document",
  },
  {
    key: "project_package",
    label: "PROJECT PACKAGE",
    requirementPlaceholder: "Describe the project and scope — attach any supporting documents below.",
    attachmentLabel: "Attach supporting documents",
  },
];

const requirementIcons: Record<RequirementTypeKey, React.ComponentType<{ className?: string }>> = {
  part_reference: Tag,
  specification: FileText,
  drawing_datasheet: Ruler,
  bom: Package,
  equipment_requirement: Settings,
  project_package: Briefcase,
};

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setVisible(true);
      observer.disconnect();
      window.removeEventListener("scroll", checkPosition);
    };
    const checkPosition = () => {
      const bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) reveal();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) reveal();
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
    observer.observe(element);
    window.addEventListener("scroll", checkPosition, { passive: true });
    checkPosition();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", checkPosition);
    };
  }, []);

  return { ref, visible };
}

function SectionMarker({ number, label, light = false }: { number: string; label: string; light?: boolean }) {
  return (
    <div className="flex items-center gap-2" data-testid={`section-marker-${number}`}>
      <span className={`h-0.5 w-5 ${light ? "bg-[#fca5a5]" : "bg-[#dc2626]"}`} data-testid={`section-marker-line-${number}`} />
      <span className={`text-[11px] font-bold uppercase tracking-[0.22em] ${light ? "text-[#fca5a5]" : "text-[#dc2626]"}`} data-testid={`section-marker-label-${number}`}>{label}</span>
      <span className="sr-only" data-testid={`section-marker-number-${number}`}>{number}</span>
    </div>
  );
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const selectedType = requirementTypes.find((t) => t.key === form.requirement_type) ?? null;
  const sourcingReveal = useReveal<HTMLImageElement>();
  const connectorReveal = useReveal<HTMLDivElement>();

  const selectRequirementType = (key: RequirementTypeKey) => {
    setSubmitted(false);
    setForm((current) => ({ ...current, requirement_type: key }));
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const mutation = useMutation<ContactSubmission, Error, ContactFormState>({
    mutationFn: (payload) => {
      const body = new FormData();
      body.append("name", payload.name);
      body.append("company", payload.company);
      body.append("email", payload.email);
      body.append("requirement", payload.requirement);
      if (payload.requirement_type) body.append("requirement_type", payload.requirement_type);
      if (payload.attachment) body.append("attachment", payload.attachment);
      return apiPostForm<ContactSubmission>("/contact", body);
    },
    onSuccess: () => {
      setForm(initialForm);
      setSubmitted(true);
    },
  });

  const updateField = (field: "name" | "company" | "email" | "requirement", value: string) => {
    setSubmitted(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateAttachment = (file: File | null) => {
    setSubmitted(false);
    if (file && file.size > 10 * 1024 * 1024) {
      setFileError("File exceeds 10 MB. Please choose a smaller file.");
      return;
    }
    setFileError(null);
    setForm((current) => ({ ...current, attachment: file }));
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-white text-[#0f172a]" data-testid="nautix-page">

      {/* ── HEADER ─────────────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white shadow-sm" data-testid="site-header">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#top" className="flex items-center gap-2.5" data-testid="header-logo">
            <img src="/images/nautix-logo.png" alt="Nautix" className="h-9 w-auto object-contain" />
            <span className="font-heading text-xl font-extrabold tracking-[-0.04em] text-[#0f172a]">NAUTI<span className="text-[#dc2626]">X</span></span>
          </a>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation" data-testid="desktop-navigation">
            <a href="#practices" className="relative text-[13px] font-semibold text-[#374151] transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[#dc2626] after:transition-all hover:text-[#dc2626] hover:after:w-full" data-testid="header-practices-link">Practices</a>
            <a href="#about" className="relative text-[13px] font-semibold text-[#374151] transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[#dc2626] after:transition-all hover:text-[#dc2626] hover:after:w-full" data-testid="header-about-link">About</a>
            <a href="#contact" className="relative text-[13px] font-semibold text-[#374151] transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[#dc2626] after:transition-all hover:text-[#dc2626] hover:after:w-full" data-testid="header-contact-link">Contact</a>
          </nav>
          <a href="#contact" className="hidden items-center gap-2 rounded bg-[#dc2626] px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[#b91c1c] sm:flex" data-testid="header-cta">
            Get In Touch <ArrowUpRight className="size-3.5" />
          </a>
          <button className="rounded border border-gray-200 p-2 md:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle navigation" data-testid="mobile-navigation-toggle">
            {mobileOpen ? <X className="size-5 text-[#0f172a]" /> : <Menu className="size-5 text-[#0f172a]" />}
          </button>
        </div>
        {mobileOpen && (
          <nav className="border-t border-gray-100 bg-white px-5 py-5 md:hidden" aria-label="Mobile navigation" data-testid="mobile-navigation">
            <div className="flex flex-col gap-5 text-sm font-semibold text-[#374151]">
              <a href="#practices" onClick={() => setMobileOpen(false)} data-testid="mobile-practices-link">Practices</a>
              <a href="#about" onClick={() => setMobileOpen(false)} data-testid="mobile-about-link">About</a>
              <a href="#contact" onClick={() => setMobileOpen(false)} data-testid="mobile-contact-link">Contact</a>
            </div>
          </nav>
        )}
      </header>

      <main id="top">

        {/* ── HERO ───────────────────────────────────────────────────────────────── */}
        <section className="relative flex min-h-[720px] items-center overflow-hidden bg-white pt-[72px] sm:min-h-[800px]" data-testid="hero-section">
          {/* Right image panel with geometric red overlay */}
          <div className="absolute right-0 top-0 hidden h-full w-[48%] overflow-hidden lg:block">
            <img src={images.hero} alt="Vessel under construction in a shipyard dry dock" className="h-full w-full object-cover" data-testid="hero-image" />
            <div className="absolute inset-0 bg-[#0f172a]/40" data-testid="hero-overlay" />
            {/* Red diagonal left edge */}
            <div className="absolute inset-0 bg-[#dc2626] [clip-path:polygon(0_0,20%_0,0_100%)]" />
            {/* Floating stats card */}
            <div className="absolute bottom-12 right-8 rounded-xl bg-white p-5 shadow-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dc2626]">Marine Specialists</p>
              <p className="mt-2 text-sm font-bold text-[#0f172a]">Requirement-Led</p>
              <p className="text-sm font-semibold text-[#374151]">Procurement &amp; Technology</p>
            </div>
          </div>

          {/* Dot grid decoration */}
          <div className="absolute bottom-10 right-[52%] mr-8 hidden lg:grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", gap: "7px" }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className="size-1 rounded-full bg-[#dc2626]/20" />
            ))}
          </div>

          {/* Left content */}
          <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12">
            <div className="max-w-xl" data-testid="hero-content">
              <p className="mb-6 flex items-center gap-2.5 font-mono text-[10px] font-bold tracking-[0.28em] text-[#dc2626]" data-testid="hero-eyebrow">
                <span className="h-px w-6 bg-[#dc2626]" />
                MARINE / MARITIME / SHIPBUILDING
              </p>
              <h1 className="font-heading text-[clamp(2.8rem,6.5vw,5.2rem)] font-extrabold leading-[.9] tracking-[-0.04em] text-[#0f172a]" data-testid="hero-title">
                We Solve<br />Marine Requirements
              </h1>
              <p className="font-heading text-[clamp(2.8rem,6.5vw,5.2rem)] font-extrabold leading-[.9] tracking-[-0.04em] text-[#dc2626]" data-testid="hero-headline">
                With Precision.
              </p>
              <p className="mt-7 max-w-md text-[15px] leading-7 text-[#6b7280]" data-testid="hero-copy">
                Equipment, systems and operations come with specifications, dependencies and constraints that demand more than a catalogue search.
              </p>
              <p className="mt-3 max-w-md text-[15px] font-semibold text-[#0f172a]" data-testid="hero-positioning">
                Nautix is built around understanding and solving those requirements.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4" data-testid="hero-cta-wrap">
                <a href="#practices" className="inline-flex items-center gap-2.5 rounded bg-[#dc2626] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#b91c1c]" data-testid="hero-explore-link">
                  Explore Practices <MoveRight className="size-4" />
                </a>
                <a href="#contact" className="inline-flex items-center gap-2 rounded border-2 border-[#0f172a] px-6 py-3.5 text-sm font-bold text-[#0f172a] transition hover:border-[#dc2626] hover:text-[#dc2626]">
                  Discuss a Requirement
                </a>
              </div>
            </div>
          </div>

          <div className="absolute bottom-7 right-5 hidden items-center gap-4 font-mono text-[9px] tracking-[0.22em] text-[#0f172a]/30 lg:flex" data-testid="hero-index">
            <span>01</span><span className="h-px w-14 bg-[#0f172a]/15" /><span>REQUIREMENTS, UNDERSTOOD</span>
          </div>
        </section>

        {/* ── STATS BAND ─────────────────────────────────────────────────────────── */}
        <section className="bg-[#dc2626] py-10 text-white">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-8 px-5 sm:px-8 md:grid-cols-4 lg:px-12">
            {[
              { Icon: Shield,     title: "Quality",         sub: "Marine-grade expertise"     },
              { Icon: Zap,        title: "Performance",     sub: "Requirement-led approach"   },
              { Icon: Anchor,     title: "Maritime Focus",  sub: "Shipbuilding & offshore"    },
              { Icon: Headphones, title: "Support",         sub: "Requirement to delivery"    },
            ].map(({ Icon, title, sub }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="mt-0.5 text-sm text-white/80">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ENVIRONMENT · SERVICES · SOURCING · SPECIFICATION ──────────────────── */}
        <section id="about" className="bg-[#f8fafc] py-6 sm:py-8 lg:py-10">
          <span id="practices" />
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">

            {/* Header */}
            <SectionMarker number="02" label="THE MARINE ENVIRONMENT" />
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="max-w-2xl font-heading text-[clamp(2.2rem,5vw,4rem)] font-extrabold leading-[.95] tracking-[-0.04em] text-[#0f172a]">
                Marine Requirements,<br /><span className="text-[#dc2626]">Solved with Precision.</span>
              </h2>
              <p className="max-w-xs text-sm text-[#6b7280] sm:text-right">Built around the requirements that define marine and maritime operations.</p>
            </div>

            {/* Row 1 — two equal cards */}
            <div className="mt-12 grid gap-5 lg:grid-cols-2">

              {/* Card: Marine Environment */}
              <div className="flex flex-col rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-md sm:p-10" data-testid="environment-section">
                <p className="font-mono text-[9px] font-bold tracking-[0.22em] text-[#dc2626]">THE MARINE ENVIRONMENT</p>
                <h3 className="mt-5 font-heading text-2xl font-extrabold leading-tight tracking-[-0.04em] text-[#0f172a] sm:text-3xl" data-testid="environment-headline">
                  Built Around the<br /><span className="text-[#dc2626]">Marine Environment.</span>
                </h3>
                <p className="mt-5 text-[15px] leading-7 text-[#6b7280]" data-testid="environment-audience">
                  Shipyards. Vessel owners and operators. Ports. Offshore businesses. Marine contractors. Ship-management companies.
                </p>
                <p className="mt-4 text-base font-bold text-[#0f172a]" data-testid="environment-support">
                  Different operations. Different requirements. One demanding environment.
                </p>
                <a href="#contact" className="mt-auto pt-8 inline-flex w-fit items-center gap-2 rounded bg-[#dc2626] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#b91c1c]">
                  Get In Touch <ArrowUpRight className="size-4" />
                </a>
              </div>

              {/* Card: Marine Sourcing & Procurement (image) */}
              <div className="relative min-h-[380px] overflow-hidden rounded-2xl shadow-sm" data-testid="sourcing-practice-section">
                <img
                  ref={sourcingReveal.ref}
                  src={images.fabrication}
                  alt="Shipyard fabrication zone with vessel hull and gantry crane"
                  className={`absolute inset-0 size-full object-cover transition duration-700 hover:scale-105 reveal-image ${sourcingReveal.visible ? "is-visible" : ""}`}
                  data-testid="sourcing-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/92 via-[#0f172a]/40 to-[#0f172a]/10" />
                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 font-mono text-[9px] tracking-[0.22em] text-white backdrop-blur-sm" data-testid="sourcing-image-label">
                  <span className="size-1.5 rounded-full bg-[#dc2626]" /> FABRICATION / INSPECTION
                </div>
                <div className="absolute inset-x-0 bottom-0 flex flex-col p-8 sm:p-10">
                  <p className="font-mono text-[9px] font-bold tracking-[0.22em] text-[#fca5a5]">PRACTICE 01</p>
                  <h3 className="mt-4 font-heading text-2xl font-extrabold leading-tight tracking-[-0.04em] text-white sm:text-3xl" data-testid="sourcing-headline">
                    Marine Sourcing<br />&amp; Procurement
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/75" data-testid="sourcing-support">
                    Requirement-led sourcing and procurement. We work from the requirement, not from a catalogue.
                  </p>
                  <a href="#contact" className="mt-6 inline-flex w-fit items-center gap-2 rounded border border-white/30 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:border-white hover:bg-white/10">
                    Discuss a Requirement <MoveRight className="size-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Row 2 — Requirements card */}
            <div className="mt-5 rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-md sm:p-10" data-testid="requirements-section">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[9px] font-bold tracking-[0.22em] text-[#dc2626]">OUR SERVICES</p>
                  <h3 className="mt-4 font-heading text-2xl font-extrabold leading-tight tracking-[-0.04em] text-[#0f172a] sm:text-3xl" data-testid="requirements-headline">
                    Requirements Arrive<br />in Different Forms.
                  </h3>
                </div>
                <p className="max-w-xs text-sm text-[#6b7280] sm:text-right" data-testid="requirements-support">Start with the requirement you have.</p>
              </div>
              <p className="mt-8 font-mono text-[9px] tracking-[0.22em] text-[#0f172a]/40" data-testid="requirements-instruction">SELECT HOW YOUR REQUIREMENT STARTS</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="requirements-diagram">
                {requirementTypes.map((item, index) => {
                  const isSelected = form.requirement_type === item.key;
                  const Icon = requirementIcons[item.key];
                  return (
                    <button
                      key={item.key}
                      onClick={() => selectRequirementType(item.key)}
                      className={`group flex flex-col gap-4 rounded-xl border-2 bg-white p-5 text-left shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                        isSelected ? "border-[#dc2626] shadow-[#dc2626]/10" : "border-transparent hover:border-[#dc2626]/25"
                      }`}
                      data-testid={`requirement-form-${index + 1}`}
                    >
                      <div className={`flex size-10 items-center justify-center rounded-lg transition-colors duration-300 ${isSelected ? "bg-[#dc2626]" : "bg-[#fef2f2] group-hover:bg-[#dc2626]"}`}>
                        <Icon className={`size-4 transition-colors duration-300 ${isSelected ? "text-white" : "text-[#dc2626] group-hover:text-white"}`} />
                      </div>
                      <div>
                        <p className={`text-[11px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 ${isSelected ? "text-[#dc2626]" : "text-[#0f172a] group-hover:text-[#dc2626]"}`} data-testid={`requirement-form-label-${index + 1}`}>{item.label}</p>
                        <p className="mt-1.5 text-xs leading-5 text-[#6b7280] line-clamp-2">{item.requirementPlaceholder}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3 — Specification matters card */}
            <div className="relative mt-5 overflow-hidden rounded-2xl bg-[#0f172a]" data-testid="visual-break-section">
              <img src={images.engineRoom} alt="Technical marine equipment and vessel systems" className="absolute inset-0 size-full object-cover opacity-[0.14]" data-testid="visual-break-image" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/90 to-[#0f172a]/55" />
              <div className="relative flex flex-col gap-8 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between" data-testid="visual-break-copy">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.28em] text-[#dc2626]" data-testid="visual-break-kicker">MARINE DETAIL</p>
                  <h3 className="mt-5 font-heading text-[clamp(2.8rem,7vw,6rem)] font-extrabold leading-[.86] tracking-[-0.07em] text-white" data-testid="visual-break-headline">
                    Specification<br /><span className="text-[#dc2626]">matters.</span>
                  </h3>
                </div>
                <div className="flex size-36 shrink-0 items-center justify-center rounded-full border border-[#dc2626]/25 bg-[#dc2626]/5 lg:mr-8">
                  <div className="flex size-24 items-center justify-center rounded-full border border-[#dc2626]/40 bg-[#dc2626]/15">
                    <Anchor className="size-10 text-[#dc2626]" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── TRANSITION ─────────────────────────────────────────────────────────── */}
        <section className="bg-white py-6 sm:py-8 lg:py-10" data-testid="transition-section">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="ml-auto max-w-3xl border-l-4 border-[#dc2626] pl-8 sm:pl-12" data-testid="transition-copy">
              <SectionMarker number="06" label="A WIDER REQUIREMENT" />
              <h2 className="mt-6 max-w-2xl font-heading text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[.95] tracking-[-0.04em] text-[#0f172a]" data-testid="transition-headline">
                Not every marine requirement ends with equipment.
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-7 text-[#6b7280]" data-testid="transition-support">Some requirements live in systems, workflows, information and software.</p>
            </div>
          </div>
        </section>

        {/* ── TECHNOLOGY PRACTICE ────────────────────────────────────────────────── */}
        <section className="bg-[#f8fafc] py-6 sm:py-8 lg:py-10" data-testid="technology-practice-section">
          <div className="mx-auto grid max-w-[1440px] gap-16 px-5 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:gap-24 lg:px-12">
            <div>
              <SectionMarker number="07" label="PRACTICE 02" />
              <h2 className="mt-6 max-w-xl font-heading text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[.95] tracking-[-0.04em] text-[#0f172a]" data-testid="technology-headline">Marine Technology &amp; Engineering</h2>
              <p className="mt-6 max-w-md text-[15px] leading-7 text-[#6b7280]" data-testid="technology-support">Purpose-built technology for marine and shipbuilding requirements.</p>
              <a href="#contact" className="mt-8 inline-flex items-center gap-2 rounded bg-[#0f172a] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1e293b]">
                Discuss a Requirement <ArrowUpRight className="size-4" />
              </a>
            </div>
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-sm" data-testid="technology-disciplines">
              <div className="grid">
                {["Custom Software", "Systems Integration", "Marine Stores", "Operational Equipment", "Accessories & Consumables"].map((item, index) => (
                  <div className="border-b border-[#f1f5f9] py-5 last:border-b-0" key={item} data-testid={`technology-discipline-${index + 1}`}>
                    <span className="text-base font-semibold text-[#0f172a]" data-testid={`technology-discipline-label-${index + 1}`}>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-4" data-testid="technology-diagram">
                <div className="flex size-14 items-center justify-center rounded-full border-2 border-[#dc2626] bg-[#7f1d1d] text-[10px] font-bold tracking-[0.1em] text-white" data-testid="technology-nautix-node">NX</div>
                <div className="h-0.5 flex-1 bg-[#dc2626]/50" data-testid="technology-connector" />
                <span className="rounded-full bg-[#fef2f2] px-3 py-1.5 font-mono text-[9px] font-bold tracking-[0.16em] text-[#dc2626]" data-testid="technology-domain-label">MARINE DOMAIN</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SUMMARY ────────────────────────────────────────────────────────────── */}
        <section className="bg-white py-6 sm:py-8 lg:py-10" data-testid="summary-section">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <SectionMarker number="08" label="TWO PRACTICES / ONE DOMAIN" />
            <h2 className="mt-6 max-w-3xl font-heading text-[clamp(2.4rem,6vw,5rem)] font-extrabold leading-[.92] tracking-[-0.04em] text-[#0f172a]" data-testid="summary-headline">
              One Domain.<br /><span className="text-[#dc2626]">Different Requirements.</span>
            </h2>
            <div ref={connectorReveal.ref} className="relative mt-14 grid gap-5 md:grid-cols-2" data-testid="summary-diagram">
              <div className={`absolute left-1/2 top-[calc(100%-76px)] hidden h-20 w-0.5 -translate-x-1/2 bg-[#dc2626] md:block reveal-connector ${connectorReveal.visible ? "is-visible" : ""}`} data-testid="summary-connector" />
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-sm sm:p-10" data-testid="summary-sourcing-card">
                <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#dc2626]" data-testid="summary-sourcing-label">PRACTICE 01</p>
                <h3 className="mt-5 font-heading text-2xl font-extrabold leading-tight tracking-[-0.04em] text-[#0f172a] sm:text-3xl" data-testid="summary-sourcing-title">Marine Sourcing<br />&amp; Procurement</h3>
                <p className="mt-4 text-sm leading-6 text-[#6b7280]">Requirement-led sourcing and procurement for the marine and maritime sector.</p>
              </div>
              <div className="rounded-xl bg-[#7f1d1d] p-8 text-white shadow-sm sm:p-10" data-testid="summary-technology-card">
                <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#fca5a5]" data-testid="summary-technology-label">PRACTICE 02</p>
                <h3 className="mt-5 font-heading text-2xl font-extrabold leading-tight tracking-[-0.04em] sm:text-3xl" data-testid="summary-technology-title">Marine Technology<br />&amp; Engineering</h3>
                <p className="mt-4 text-sm leading-6 text-white/65">Purpose-built technology for marine and shipbuilding requirements.</p>
              </div>
              <div className="relative z-10 col-span-full mx-auto mt-6 rounded bg-[#dc2626] px-8 py-4 font-mono text-[11px] font-bold tracking-[0.2em] text-white shadow-lg" data-testid="summary-domain-node">MARINE / MARITIME / SHIPBUILDING</div>
            </div>
          </div>
        </section>

        {/* ── CONTACT ────────────────────────────────────────────────────────────── */}
        <section id="contact" className="bg-[#7f1d1d] py-6 text-white sm:py-8 lg:py-10" data-testid="contact-section">
          <div className="mx-auto grid max-w-[1440px] gap-16 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-24 lg:px-12">
            <div data-testid="contact-intro">
              <SectionMarker number="09" label="START A CONVERSATION" light />
              <h2 className="mt-8 max-w-xl font-heading text-[clamp(3rem,7vw,6.5rem)] font-extrabold leading-[.9] tracking-[-0.06em]" data-testid="contact-headline">Have a Requirement?</h2>
              <p className="mt-8 text-base font-semibold text-white/75" data-testid="contact-support">Start with what you have.</p>
              <p className="mt-16 hidden max-w-xs text-sm leading-7 text-white/45 lg:block" data-testid="contact-note">A specification, drawing, datasheet, BOM or a short description is enough to start the conversation.</p>
            </div>
            <form className="border-t border-white/20 pt-7" onSubmit={submitForm} data-testid="contact-form">
              {selectedType && (
                <div className="mb-7 flex items-center justify-between rounded-lg border border-[#dc2626]/35 bg-[#dc2626]/[0.08] px-4 py-3" data-testid="contact-requirement-type-badge">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[9px] tracking-[0.2em] text-[#fca5a5]/70">REQUIREMENT TYPE</span>
                    <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-white">{selectedType.label}</span>
                  </div>
                  <button type="button" onClick={() => setForm((c) => ({ ...c, requirement_type: null }))} className="text-white/35 transition-colors hover:text-white" aria-label="Clear requirement type" data-testid="contact-requirement-type-clear">
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="form-label" data-testid="contact-name-field"><span data-testid="contact-name-label">Name</span><Input required value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Your name" className="form-input" data-testid="contact-name-input" /></label>
                <label className="form-label" data-testid="contact-company-field"><span data-testid="contact-company-label">Company</span><Input required value={form.company} onChange={(e) => updateField("company", e.target.value)} placeholder="Company name" className="form-input" data-testid="contact-company-input" /></label>
                <label className="form-label sm:col-span-2" data-testid="contact-email-field"><span data-testid="contact-email-label">Email</span><Input required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@company.com" className="form-input" data-testid="contact-email-input" /></label>
                <label className="form-label sm:col-span-2" data-testid="contact-requirement-field"><span data-testid="contact-requirement-label">Requirement</span><Textarea required value={form.requirement} onChange={(e) => updateField("requirement", e.target.value)} placeholder={selectedType?.requirementPlaceholder ?? "Tell us what you are working with"} className="form-input min-h-32 resize-y" data-testid="contact-requirement-input" /></label>
                <label className="group flex cursor-pointer flex-wrap items-center gap-3 text-xs text-white/60 sm:col-span-2" data-testid="contact-attachment-field">
                  <FileText className="size-4 text-[#fca5a5]" />
                  <span className="underline decoration-white/25 underline-offset-4" data-testid="contact-attachment-label">{selectedType?.attachmentLabel ?? "Attach a requirement document"}</span>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.docx" className="sr-only" onChange={(e) => updateAttachment(e.target.files?.[0] ?? null)} data-testid="contact-attachment-input" />
                  <span className="truncate text-white/40" data-testid="contact-attachment-name">{form.attachment?.name || "Optional"}</span>
                  <span className="w-full pl-7 text-[10px] text-white/35" data-testid="contact-attachment-guidance">PDF, PNG, JPG, CSV, XLSX, DOCX · max 10 MB</span>
                  {fileError && <span className="w-full pl-7 text-[10px] text-[#ffb4a9]" data-testid="contact-attachment-error">{fileError}</span>}
                </label>
              </div>
              <div className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between" data-testid="contact-form-actions">
                <Button type="submit" disabled={mutation.isPending} className="rounded bg-[#dc2626] px-6 py-3 text-sm font-bold text-white hover:bg-[#b91c1c]" data-testid="contact-submit-button">
                  {mutation.isPending ? "Sending…" : "Discuss a Requirement"}<ArrowUpRight className="ml-2 size-4" data-testid="contact-submit-icon" />
                </Button>
                {submitted && <p className="flex items-center gap-2 text-xs text-[#fca5a5]" role="status" data-testid="contact-success-message"><Check className="size-4" /> Requirement received. Thank you.</p>}
                {mutation.isError && <p className="text-xs text-[#ffb4a9]" role="alert" data-testid="contact-error-message">Something went wrong. Please try again.</p>}
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0f172a] py-14 text-white" data-testid="site-footer">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-10 md:grid-cols-[1.8fr_1fr_1fr_1.6fr]">
            <div>
              <a href="#top" className="font-heading text-2xl font-extrabold tracking-[-0.05em]" data-testid="footer-logo">NAUTI<span className="text-[#dc2626]">X.</span></a>
              <p className="mt-2 font-mono text-[9px] tracking-[0.2em] text-white/35" data-testid="footer-domain">MARINE / MARITIME / SHIPBUILDING</p>
              <p className="mt-5 max-w-xs text-sm leading-6 text-white/50">Requirement-led sourcing, procurement, and technology for the marine and maritime sector.</p>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white/35">Navigation</p>
              <div className="flex flex-col gap-3 text-sm text-white/65">
                <a href="#practices" className="transition hover:text-[#dc2626]">Practices</a>
                <a href="#about" className="transition hover:text-[#dc2626]">About</a>
                <a href="#contact" className="transition hover:text-[#dc2626]" data-testid="footer-contact-link">Contact Nautix</a>
              </div>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white/35">Legal</p>
              <div className="flex flex-col gap-3 text-sm text-white/65">
                <a href="/privacy" className="transition hover:text-[#dc2626]" data-testid="footer-privacy">Privacy Policy</a>
                <span data-testid="footer-copyright">© 2025 Nautix</span>
              </div>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white/35">Contact</p>
              <div className="flex flex-col gap-4 text-sm text-white/65">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[#dc2626]" />
                  <span className="leading-5">Commander's Galaxy,<br />M S Nagar, Bengaluru – 560064,<br />Karnataka, India.</span>
                </div>
                <a href="tel:+919886635710" className="flex items-center gap-3 transition hover:text-[#dc2626]">
                  <Phone className="size-4 shrink-0 text-[#dc2626]" />
                  +91 9886 635710
                </a>
                <div className="flex items-center gap-3">
                  <Globe className="size-4 shrink-0 text-[#dc2626]" />
                  <span>GSTN: 29ABAFN3894J1ZQ</span>
                </div>
                <a href="mailto:contact@nautix.in" className="flex items-center gap-3 transition hover:text-[#dc2626]">
                  <Mail className="size-4 shrink-0 text-[#dc2626]" />
                  contact@nautix.in
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-white/10 pt-8 text-center">
            <p className="text-xs text-white/25">Marine · Maritime · Shipbuilding</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
