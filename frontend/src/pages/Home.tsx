import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowUpRight, Check, FileText, Menu, Minus, MoveRight, X } from "lucide-react";
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

function SectionMarker({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3" data-testid={`section-marker-${number}`}>
      <span className="font-mono text-[10px] tracking-[0.24em] text-[#1bb8b0]" data-testid={`section-marker-number-${number}`}>{number}</span>
      <span className="h-px w-8 bg-[#1bb8b0]/50" data-testid={`section-marker-line-${number}`} />
      <span className="font-mono text-[10px] tracking-[0.2em] text-current/55" data-testid={`section-marker-label-${number}`}>{label}</span>
    </div>
  );
}

function ArrowLink({ children, href, light = false, testId }: { children: string; href: string; light?: boolean; testId: string }) {
  return (
    <a href={href} className={`group inline-flex items-center gap-3 border-b pb-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors duration-300 ${light ? "border-white/35 text-white hover:border-[#1bb8b0]" : "border-[#132c40]/30 text-[#132c40] hover:border-[#1bb8b0]"}`} data-testid={testId}>
      {children}
      <MoveRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
    </a>
  );
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const selectedType = requirementTypes.find((t) => t.key === form.requirement_type) ?? null;
  const environmentReveal = useReveal<HTMLImageElement>();
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

  const updateAttachment = (attachment: File | null) => {
    setSubmitted(false);
    setForm((current) => ({ ...current, attachment }));
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8f6] text-[#132c40]" data-testid="nautix-page">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0c202e]/85 text-white backdrop-blur-xl" data-testid="site-header">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#top" className="flex items-center gap-3" data-testid="header-logo">
            <img src="/images/nautix-logo.png" alt="Nautix" className="h-11 w-auto object-contain" />
            <span className="font-heading text-xl font-extrabold tracking-[-0.04em] text-white">NAUTIX</span>
          </a>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation" data-testid="desktop-navigation">
            <a href="#practices" className="nav-link" data-testid="header-practices-link">Practices</a>
            <a href="#about" className="nav-link" data-testid="header-about-link">About</a>
            <a href="#contact" className="nav-link" data-testid="header-contact-link">Contact</a>
          </nav>
          <a href="#contact" className="hidden items-center gap-2 rounded-full border border-white/25 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-[#1bb8b0] hover:text-[#70e2db] sm:flex" data-testid="header-cta">Discuss a Requirement <ArrowUpRight className="size-3.5" /></a>
          <button className="rounded-full border border-white/20 p-2 md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation" data-testid="mobile-navigation-toggle">
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {mobileOpen && (
          <nav className="border-t border-white/10 bg-[#0c202e] px-5 py-5 md:hidden" aria-label="Mobile navigation" data-testid="mobile-navigation">
            <div className="flex flex-col gap-5 text-sm">
              <a href="#practices" onClick={() => setMobileOpen(false)} data-testid="mobile-practices-link">Practices</a>
              <a href="#about" onClick={() => setMobileOpen(false)} data-testid="mobile-about-link">About</a>
              <a href="#contact" onClick={() => setMobileOpen(false)} data-testid="mobile-contact-link">Contact</a>
            </div>
          </nav>
        )}
      </header>

      <main id="top">
        <section className="relative flex min-h-[720px] items-end bg-[#0c202e] text-white sm:min-h-[800px]" data-testid="hero-section">
          <img src={images.hero} alt="Vessel under construction in a shipyard dry dock" className="absolute inset-0 size-full object-cover opacity-65" data-testid="hero-image" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,25,37,.96)_0%,rgba(8,25,37,.73)_42%,rgba(8,25,37,.15)_100%)]" data-testid="hero-overlay" />
          <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-20 pt-40 sm:px-8 sm:pb-24 lg:px-12 lg:pb-28">
            <div className="max-w-3xl" data-testid="hero-content">
              <p className="mb-7 font-mono text-[10px] tracking-[0.3em] text-[#70e2db]" data-testid="hero-eyebrow">MARINE / MARITIME / SHIPBUILDING</p>
              <h1 className="max-w-2xl font-heading text-[clamp(3.6rem,10vw,8rem)] font-semibold leading-[.88] tracking-[-0.08em]" data-testid="hero-title">NAUTIX</h1>
              <div className="mt-10 grid max-w-2xl gap-8 border-l border-[#1bb8b0] pl-5 sm:pl-7">
                <h2 className="font-heading text-[clamp(1.8rem,4vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.055em]" data-testid="hero-headline">Marine requirements are rarely simple.</h2>
                <p className="max-w-lg text-sm leading-7 text-white/65 sm:text-base" data-testid="hero-copy">Equipment, systems and operations come with specifications, dependencies and constraints that demand more than a catalogue search.</p>
                <p className="max-w-md text-sm font-semibold leading-7 text-white" data-testid="hero-positioning">Nautix is built around understanding and solving those requirements.</p>
              </div>
              <div className="mt-10" data-testid="hero-cta-wrap"><ArrowLink href="#about" light testId="hero-explore-link">Explore Nautix</ArrowLink></div>
            </div>
          </div>
          <div className="absolute bottom-7 right-5 hidden items-center gap-4 font-mono text-[9px] tracking-[0.22em] text-white/45 lg:flex" data-testid="hero-index"><span>01</span><span className="h-px w-14 bg-white/30" /><span>REQUIREMENTS, UNDERSTOOD</span></div>
        </section>

        <section id="about" className="relative bg-[#eef1ef] py-24 sm:py-32 lg:py-40" data-testid="environment-section">
          <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-24 lg:px-12">
            <div data-testid="environment-copy">
              <SectionMarker number="02" label="THE MARINE ENVIRONMENT" />
              <h2 className="mt-8 max-w-xl font-heading text-[clamp(2.7rem,6vw,5.4rem)] font-medium leading-[.97] tracking-[-0.07em]" data-testid="environment-headline">Built around the marine environment.</h2>
              <p className="mt-8 max-w-md text-sm leading-7 text-[#132c40]/65" data-testid="environment-audience">Shipyards. Vessel owners and operators. Ports. Offshore businesses. Marine contractors. Ship-management companies.</p>
              <p className="mt-5 max-w-sm text-base font-semibold leading-7 text-[#132c40]" data-testid="environment-support">Different operations. Different requirements. One demanding environment.</p>
            </div>
            <div className="relative min-h-[420px] overflow-hidden bg-[#132c40] sm:min-h-[540px]" data-testid="environment-image-frame">
              <img ref={environmentReveal.ref} src={images.engineRoom} alt="Engineers working around machinery in a vessel engine room" className={`absolute inset-0 size-full object-cover transition duration-700 hover:scale-105 reveal-image ${environmentReveal.visible ? "is-visible" : ""}`} data-testid="environment-image" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081923]/80 via-transparent to-transparent" />
              <span className="absolute bottom-6 left-6 font-mono text-[9px] tracking-[0.25em] text-white/70" data-testid="environment-image-caption">VESSEL SYSTEMS / ENGINE ROOM</span>
              <div className="absolute -bottom-1 right-0 h-24 w-24 border-l border-t border-[#1bb8b0]/70" data-testid="environment-corner-detail" />
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8f6] py-24 sm:py-32 lg:py-40" data-testid="requirements-section">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="grid gap-14 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
              <div>
                <SectionMarker number="03" label="THE STARTING POINT" />
                <h2 className="mt-8 max-w-lg font-heading text-[clamp(2.7rem,6vw,5.3rem)] font-medium leading-[.97] tracking-[-0.07em]" data-testid="requirements-headline">Requirements arrive in different forms.</h2>
                <p className="mt-8 text-sm font-semibold text-[#132c40]/65" data-testid="requirements-support">Start with the requirement you have.</p>
              </div>
              <div className="relative grid gap-3 sm:grid-cols-2" data-testid="requirements-diagram">
                <p className="relative z-10 col-span-full mb-1 font-mono text-[9px] tracking-[0.22em] text-[#132c40]/45" data-testid="requirements-instruction">SELECT HOW YOUR REQUIREMENT STARTS</p>
                {requirementTypes.map((item, index) => {
                  const isSelected = form.requirement_type === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => selectRequirementType(item.key)}
                      className={`group relative z-10 flex min-h-[74px] w-full cursor-pointer items-center justify-between border px-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-sm ${
                        isSelected
                          ? "border-[#1bb8b0] bg-[#1bb8b0]/[0.07]"
                          : "border-[#132c40]/12 bg-white hover:border-[#1bb8b0] hover:bg-[#132c40]/[0.025]"
                      }`}
                      data-testid={`requirement-form-${index + 1}`}
                    >
                      <span className={`font-mono text-[10px] tracking-[0.12em] transition-colors duration-300 ${isSelected ? "font-bold text-[#1bb8b0]" : "text-[#132c40]/70 group-hover:text-[#132c40]"}`} data-testid={`requirement-form-label-${index + 1}`}>{item.label}</span>
                    </button>
                  );
                })}
                <div className="relative z-10 col-span-full mx-auto mt-8 flex size-32 items-center justify-center rounded-full border border-[#1bb8b0] bg-[#132c40] text-center text-xs font-bold uppercase tracking-[0.15em] text-white shadow-[0_0_0_10px_#f7f8f6,0_0_0_11px_rgba(27,184,176,.28)]" data-testid="requirements-nautix-node">NAUTIX</div>
              </div>
            </div>
          </div>
        </section>

        <section id="practices" className="bg-[#132c40] py-24 text-white sm:py-32 lg:py-40" data-testid="sourcing-practice-section">
          <div className="mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:gap-24 lg:px-12">
            <div className="relative min-h-[460px] overflow-hidden sm:min-h-[580px]" data-testid="sourcing-image-frame">
              <img ref={sourcingReveal.ref} src={images.fabrication} alt="Shipyard fabrication zone with vessel hull and gantry crane" className={`absolute inset-0 size-full object-cover transition duration-700 hover:scale-105 reveal-image ${sourcingReveal.visible ? "is-visible" : ""}`} data-testid="sourcing-image" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#132c40]/65 via-transparent to-transparent" />
              <div className="absolute left-6 top-6 flex items-center gap-3 font-mono text-[9px] tracking-[0.22em] text-white/75" data-testid="sourcing-image-label"><span className="size-2 rounded-full bg-[#1bb8b0]" /> FABRICATION / INSPECTION</div>
              <div className="absolute bottom-6 right-6 font-mono text-[9px] tracking-[0.22em] text-white/65" data-testid="sourcing-image-index">01 — 02</div>
            </div>
            <div data-testid="sourcing-copy">
              <SectionMarker number="04" label="PRACTICE 01" />
              <h2 className="mt-8 max-w-xl font-heading text-[clamp(2.7rem,6vw,5.2rem)] font-medium leading-[.97] tracking-[-0.07em]" data-testid="sourcing-headline">Marine Sourcing &amp; Procurement</h2>
              <p className="mt-8 max-w-md text-sm leading-7 text-white/65" data-testid="sourcing-support">Marine procurement begins with understanding the requirement — its specifications, context and constraints.</p>
              <p className="mt-6 max-w-sm text-base font-semibold leading-7 text-white" data-testid="sourcing-positioning">Nautix works from the requirement, not from a catalogue.</p>
              <div className="mt-10 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#70e2db]" data-testid="sourcing-discipline"><Minus className="size-4" /> Requirement-led procurement</div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[430px] items-center overflow-hidden bg-[#0a1b27] text-white" data-testid="visual-break-section">
          <img src={images.engineRoom} alt="Technical marine equipment and vessel systems" className="absolute inset-0 size-full object-cover opacity-40" data-testid="visual-break-image" />
          <div className="absolute inset-0 bg-[#0a1b27]/55" />
          <div className="relative mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12">
            <div className="flex items-end justify-between gap-10" data-testid="visual-break-copy">
              <div>
                <p className="font-mono text-[10px] tracking-[0.25em] text-[#70e2db]" data-testid="visual-break-kicker">05 / MARINE DETAIL</p>
                <h2 className="mt-6 font-heading text-[clamp(3rem,9vw,8rem)] font-medium leading-[.86] tracking-[-0.08em]" data-testid="visual-break-headline">Specification<br /><span className="text-[#70e2db]">matters.</span></h2>
              </div>
              <div className="hidden max-w-[180px] pb-2 font-mono text-[9px] leading-5 tracking-[0.13em] text-white/55 sm:block" data-testid="visual-break-caption">MARINE / MARITIME / SHIPBUILDING</div>
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8f6] py-24 sm:py-28 lg:py-36" data-testid="transition-section">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="ml-auto max-w-3xl border-l border-[#1bb8b0] pl-6 sm:pl-10" data-testid="transition-copy">
              <SectionMarker number="06" label="A WIDER REQUIREMENT" />
              <h2 className="mt-8 max-w-2xl font-heading text-[clamp(2.8rem,6vw,5.7rem)] font-medium leading-[.96] tracking-[-0.075em]" data-testid="transition-headline">Not every marine requirement ends with equipment.</h2>
              <p className="mt-8 max-w-md text-sm leading-7 text-[#132c40]/65" data-testid="transition-support">Some requirements live in systems, workflows, information and software.</p>
            </div>
          </div>
        </section>

        <section className="bg-[#e6ebeb] py-24 sm:py-32 lg:py-40" data-testid="technology-practice-section">
          <div className="mx-auto grid max-w-[1440px] gap-16 px-5 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:gap-24 lg:px-12">
            <div>
              <SectionMarker number="07" label="PRACTICE 02" />
              <h2 className="mt-8 max-w-xl font-heading text-[clamp(2.7rem,6vw,5.2rem)] font-medium leading-[.97] tracking-[-0.07em]" data-testid="technology-headline">Marine Technology &amp; Engineering</h2>
              <p className="mt-8 max-w-md text-sm leading-7 text-[#132c40]/65" data-testid="technology-support">Purpose-built technology for marine and shipbuilding requirements.</p>
            </div>
            <div className="grid border-t border-[#132c40]/20" data-testid="technology-disciplines">
              {["Custom Software", "Systems Integration", "Operational Applications"].map((item, index) => (
                <div className="flex items-center justify-between border-b border-[#132c40]/20 py-6" key={item} data-testid={`technology-discipline-${index + 1}`}>
                  <span className="text-lg font-semibold tracking-[-0.03em]" data-testid={`technology-discipline-label-${index + 1}`}>{item}</span>
                  <span className="font-mono text-[10px] text-[#132c40]/45" data-testid={`technology-discipline-number-${index + 1}`}>0{index + 1}</span>
                </div>
              ))}
              <div className="mt-12 flex items-center gap-5" data-testid="technology-diagram">
                <div className="flex size-16 items-center justify-center rounded-full border border-[#1bb8b0] bg-[#132c40] text-[10px] font-bold tracking-[0.1em] text-white" data-testid="technology-nautix-node">NX</div>
                <div className="h-px flex-1 bg-[#1bb8b0]/60" data-testid="technology-connector" />
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#132c40]/60" data-testid="technology-domain-label">MARINE DOMAIN</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8f6] py-24 sm:py-32 lg:py-40" data-testid="summary-section">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <SectionMarker number="08" label="TWO PRACTICES / ONE DOMAIN" />
            <h2 className="mt-8 max-w-3xl font-heading text-[clamp(2.9rem,7vw,6.4rem)] font-medium leading-[.92] tracking-[-0.08em]" data-testid="summary-headline">One domain.<br /><span className="text-[#1bb8b0]">Different requirements.</span></h2>
            <div ref={connectorReveal.ref} className="relative mt-16 grid gap-3 md:grid-cols-2" data-testid="summary-diagram">
              <div className={`absolute left-1/2 top-[calc(100%_-_76px)] hidden h-20 w-px -translate-x-1/2 bg-[#1bb8b0] md:block reveal-connector ${connectorReveal.visible ? "is-visible" : ""}`} data-testid="summary-connector" />
              <div className="border border-[#132c40]/15 bg-white p-7 sm:p-10" data-testid="summary-sourcing-card"><p className="font-mono text-[10px] tracking-[0.2em] text-[#1bb8b0]" data-testid="summary-sourcing-label">PRACTICE 01</p><h3 className="mt-16 max-w-xs font-heading text-2xl font-semibold leading-tight tracking-[-0.05em] sm:text-3xl" data-testid="summary-sourcing-title">Marine Sourcing<br />&amp; Procurement</h3></div>
              <div className="border border-[#132c40]/15 bg-[#132c40] p-7 text-white sm:p-10" data-testid="summary-technology-card"><p className="font-mono text-[10px] tracking-[0.2em] text-[#70e2db]" data-testid="summary-technology-label">PRACTICE 02</p><h3 className="mt-16 max-w-xs font-heading text-2xl font-semibold leading-tight tracking-[-0.05em] sm:text-3xl" data-testid="summary-technology-title">Marine Technology<br />&amp; Engineering</h3></div>
              <div className="relative z-10 col-span-full mx-auto mt-10 bg-[#1bb8b0] px-7 py-4 font-mono text-[10px] font-bold tracking-[0.2em] text-[#0c202e]" data-testid="summary-domain-node">MARINE / MARITIME / SHIPBUILDING</div>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-[#132c40] py-24 text-white sm:py-32 lg:py-40" data-testid="contact-section">
          <div className="mx-auto grid max-w-[1440px] gap-16 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-24 lg:px-12">
            <div data-testid="contact-intro">
              <SectionMarker number="09" label="START A CONVERSATION" />
              <h2 className="mt-8 max-w-xl font-heading text-[clamp(3rem,7vw,6.5rem)] font-medium leading-[.9] tracking-[-0.08em]" data-testid="contact-headline">Have a marine requirement?</h2>
              <p className="mt-8 text-base font-semibold text-white/75" data-testid="contact-support">Start with what you have.</p>
              <p className="mt-16 hidden max-w-xs text-sm leading-7 text-white/45 lg:block" data-testid="contact-note">A specification, drawing, datasheet, BOM or a short description is enough to start the conversation.</p>
            </div>
            <form className="border-t border-white/20 pt-7" onSubmit={submitForm} data-testid="contact-form">
              {selectedType && (
                <div className="mb-7 flex items-center justify-between border border-[#1bb8b0]/35 bg-[#1bb8b0]/[0.08] px-4 py-3" data-testid="contact-requirement-type-badge">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[9px] tracking-[0.2em] text-[#70e2db]/70">REQUIREMENT TYPE</span>
                    <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-white">{selectedType.label}</span>
                  </div>
                  <button type="button" onClick={() => setForm((c) => ({ ...c, requirement_type: null }))} className="text-white/35 transition-colors hover:text-white" aria-label="Clear requirement type" data-testid="contact-requirement-type-clear">
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="form-label" data-testid="contact-name-field"><span data-testid="contact-name-label">Name</span><Input required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Your name" className="form-input" data-testid="contact-name-input" /></label>
                <label className="form-label" data-testid="contact-company-field"><span data-testid="contact-company-label">Company</span><Input required value={form.company} onChange={(event) => updateField("company", event.target.value)} placeholder="Company name" className="form-input" data-testid="contact-company-input" /></label>
                <label className="form-label sm:col-span-2" data-testid="contact-email-field"><span data-testid="contact-email-label">Email</span><Input required type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="you@company.com" className="form-input" data-testid="contact-email-input" /></label>
                <label className="form-label sm:col-span-2" data-testid="contact-requirement-field"><span data-testid="contact-requirement-label">Requirement</span><Textarea required value={form.requirement} onChange={(event) => updateField("requirement", event.target.value)} placeholder={selectedType?.requirementPlaceholder ?? "Tell us what you are working with"} className="form-input min-h-32 resize-y" data-testid="contact-requirement-input" /></label>
                <label className="group flex cursor-pointer flex-wrap items-center gap-3 text-xs text-white/60 sm:col-span-2" data-testid="contact-attachment-field"><FileText className="size-4 text-[#70e2db]" /><span className="underline decoration-white/25 underline-offset-4" data-testid="contact-attachment-label">{selectedType?.attachmentLabel ?? "Attach a requirement document"}</span><input type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.docx" className="sr-only" onChange={(event) => updateAttachment(event.target.files?.[0] ?? null)} data-testid="contact-attachment-input" /><span className="truncate text-white/40" data-testid="contact-attachment-name">{form.attachment?.name || "Optional"}</span><span className="w-full pl-7 text-[10px] text-white/35" data-testid="contact-attachment-guidance">PDF, PNG, JPG, CSV, XLSX, DOCX · max 10 MB</span></label>
              </div>
              <div className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between" data-testid="contact-form-actions">
                <Button type="submit" disabled={mutation.isPending} className="rounded-full bg-[#1bb8b0] px-6 text-[#0c202e] hover:bg-[#70e2db]" data-testid="contact-submit-button">{mutation.isPending ? "Sending…" : "Discuss a Requirement"}<ArrowRightIcon /></Button>
                {submitted && <p className="flex items-center gap-2 text-xs text-[#70e2db]" role="status" data-testid="contact-success-message"><Check className="size-4" /> Requirement received. Thank you.</p>}
                {mutation.isError && <p className="text-xs text-[#ffb4a9]" role="alert" data-testid="contact-error-message">Something went wrong. Please try again.</p>}
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-[#091a25] py-10 text-white" data-testid="site-footer">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-end md:justify-between lg:px-12">
          <div><a href="#top" className="font-heading text-2xl font-extrabold tracking-[-0.08em]" data-testid="footer-logo">NAUTIX<span className="text-[#1bb8b0]">.</span></a><p className="mt-3 font-mono text-[9px] tracking-[0.2em] text-white/45" data-testid="footer-domain">MARINE / MARITIME / SHIPBUILDING</p></div>
          <div className="flex flex-col gap-3 text-xs text-white/55 md:items-end"><a href="#contact" className="hover:text-[#70e2db]" data-testid="footer-contact-link">Contact Nautix</a><a href="/privacy" className="hover:text-[#70e2db]" data-testid="footer-privacy">Privacy</a><span data-testid="footer-copyright">© 2025 Nautix</span></div>
        </div>
      </footer>
    </div>
  );
}

function ArrowRightIcon() {
  return <ArrowUpRight className="ml-2 size-4" data-testid="contact-submit-icon" />;
}
