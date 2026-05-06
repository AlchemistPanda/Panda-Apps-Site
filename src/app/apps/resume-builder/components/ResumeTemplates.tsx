"use client";

import React from "react";
import type { ResumeData } from "../data/types";
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from "lucide-react";

/* ─── Rich-text helper ──────────────────────────────────────────────── */
/** Renders plain text with support for:
 *  - Line breaks (newlines become <br/>)
 *  - Bullet points (lines starting with "- ", "• ", or "* " render as <ul><li>)
 */
function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let key = 0;

  function flushBullets() {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={key++} className="list-disc list-outside ml-4 space-y-0.5">
        {bulletBuffer.map((b, i) => (
          <li key={i} className={className}>{b}</li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^\s*[-•*]\s+(.*)/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
    } else {
      flushBullets();
      if (line.trim() === "" && elements.length > 0) {
        elements.push(<br key={key++} />);
      } else if (line.trim()) {
        if (elements.length > 0 && elements[elements.length - 1] !== null) {
          // Add line break between consecutive text lines
          const lastEl = elements[elements.length - 1];
          if (React.isValidElement(lastEl) && lastEl.type === 'span') {
            elements.push(<br key={key++} />);
          }
        }
        elements.push(<span key={key++} className={className}>{line}</span>);
      }
    }
  }
  flushBullets();

  return <div>{elements}</div>;
}

/* ─── Shared helpers ─────────────────────────────────────────────────── */
function fmtDate(d: string) {
  if (!d) return "";
  const [y, m] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return m ? `${months[parseInt(m, 10) - 1]} ${y}` : y;
}

function DateRange({ start, end, current }: { start: string; end: string; current?: boolean }) {
  return (
    <span className="text-xs text-gray-500 whitespace-nowrap">
      {fmtDate(start)}{start && (end || current) ? " – " : ""}{current ? "Present" : fmtDate(end)}
    </span>
  );
}

interface TemplateProps {
  data: ResumeData;
}

/* ═══════════════════════════════════════════════════════════════════════
   TEMPLATE 1 — MODERN
   Clean two-column with colored sidebar strip
   ═══════════════════════════════════════════════════════════════════════ */
export function ModernTemplate({ data }: TemplateProps) {
  const { personal: p, sections: vis, accentColor: accent } = data;

  function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
      <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 mt-4 first:mt-0"
        style={{ color: accent }}>
        {children}
      </h3>
    );
  }

  return (
    <div className="font-[system-ui] text-gray-800 text-[10.5px] leading-[1.5] bg-white">
      {/* Header */}
      <div className="px-8 pt-7 pb-4" style={{ borderBottom: `3px solid ${accent}` }}>
        <div className="flex items-start gap-4">
          {p.photoUrl && <img src={p.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 flex-shrink-0" style={{ borderColor: accent }} />}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: accent }}>{p.fullName || "Your Name"}</h1>
            {p.jobTitle && <p className="text-sm text-gray-600 mt-0.5 font-medium">{p.jobTitle}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[9.5px] text-gray-500">
              {p.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>}
              {p.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>}
              {p.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location}</span>}
              {p.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{p.website}</span>}
              {p.linkedin && <span className="flex items-center gap-1"><Linkedin className="h-3 w-3" />{p.linkedin}</span>}
              {p.github && <span className="flex items-center gap-1"><Github className="h-3 w-3" />{p.github}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-4">
        {/* Summary */}
        {vis.summary && p.summary && (
          <>
            <SectionTitle>Professional Summary</SectionTitle>
            <RichText text={p.summary} className="text-gray-600" />
          </>
        )}

        {/* Experience */}
        {vis.experience && data.experience.length > 0 && (
          <>
            <SectionTitle>Experience</SectionTitle>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-gray-900">{exp.position}</span>
                    {exp.company && <span className="text-gray-500"> · {exp.company}</span>}
                  </div>
                  <DateRange start={exp.startDate} end={exp.endDate} current={exp.current} />
                </div>
                {exp.location && <p className="text-[9px] text-gray-400">{exp.location}</p>}
                {exp.description && <div className="mt-0.5"><RichText text={exp.description} className="text-gray-600" /></div>}
                {exp.highlights.filter(Boolean).length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5">
                    {exp.highlights.filter(Boolean).map((h, i) => (
                      <li key={i} className="text-gray-600">{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}

        {/* Education */}
        {vis.education && data.education.length > 0 && (
          <>
            <SectionTitle>Education</SectionTitle>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2.5">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-gray-900">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>
                    {edu.institution && <span className="text-gray-500"> · {edu.institution}</span>}
                  </div>
                  <DateRange start={edu.startDate} end={edu.endDate} />
                </div>
                {edu.gpa && <p className="text-[9px] text-gray-400">GPA: {edu.gpa}</p>}
                {edu.description && <div className="mt-0.5"><RichText text={edu.description} className="text-gray-600" /></div>}
              </div>
            ))}
          </>
        )}

        {/* Skills */}
        {vis.skills && data.skills.length > 0 && (
          <>
            <SectionTitle>Skills</SectionTitle>
            <div className="space-y-1">
              {data.skills.map((sk) => (
                <div key={sk.id}>
                  {sk.category && <span className="font-semibold text-gray-700">{sk.category}: </span>}
                  <span className="text-gray-600">{sk.items.join(", ")}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Projects */}
        {vis.projects && data.projects.length > 0 && (
          <>
            <SectionTitle>Projects</SectionTitle>
            {data.projects.map((proj) => (
              <div key={proj.id} className="mb-2.5">
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900">{proj.name}</span>
                    {proj.url && (
                      <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                        <ExternalLink className="h-2.5 w-2.5" />{proj.url}
                      </span>
                    )}
                  </div>
                  <DateRange start={proj.startDate} end={proj.endDate} />
                </div>
                {proj.description && <div className="mt-0.5"><RichText text={proj.description} className="text-gray-600" /></div>}
                {proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proj.technologies.map((t) => (
                      <span key={t} className="rounded px-1.5 py-0.5 text-[8.5px] font-medium"
                        style={{ backgroundColor: `${accent}18`, color: accent }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Certifications */}
        {vis.certifications && data.certifications.length > 0 && (
          <>
            <SectionTitle>Certifications</SectionTitle>
            {data.certifications.map((c) => (
              <div key={c.id} className="flex justify-between items-baseline mb-1">
                <span className="text-gray-800 font-medium">{c.name} <span className="text-gray-400 font-normal">· {c.issuer}</span></span>
                <span className="text-[9px] text-gray-400">{fmtDate(c.date)}</span>
              </div>
            ))}
          </>
        )}

        {/* Languages */}
        {vis.languages && data.languages.length > 0 && (
          <>
            <SectionTitle>Languages</SectionTitle>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              {data.languages.map((l) => (
                <span key={l.id} className="text-gray-700">
                  {l.name} <span className="text-gray-400">({l.proficiency})</span>
                </span>
              ))}
            </div>
          </>
        )}

        {/* Awards */}
        {vis.awards && data.awards.length > 0 && (
          <>
            <SectionTitle>Awards</SectionTitle>
            {data.awards.map((a) => (
              <div key={a.id} className="mb-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-gray-800">{a.title} <span className="text-gray-400 font-normal">· {a.issuer}</span></span>
                  <span className="text-[9px] text-gray-400">{fmtDate(a.date)}</span>
                </div>
                {a.description && <RichText text={a.description} className="text-gray-600" />}
              </div>
            ))}
          </>
        )}
        {/* Volunteer */}
        {vis.volunteer && (data.volunteer || []).length > 0 && (
          <>
            <SectionTitle>Volunteer Experience</SectionTitle>
            {(data.volunteer || []).map((vol) => (
              <div key={vol.id} className="mb-2.5">
                <div className="flex justify-between items-baseline">
                  <div><span className="font-semibold text-gray-900">{vol.role}</span>{vol.organization && <span className="text-gray-500"> · {vol.organization}</span>}</div>
                  <DateRange start={vol.startDate} end={vol.endDate} current={vol.current} />
                </div>
                {vol.location && <p className="text-[9px] text-gray-400">{vol.location}</p>}
                {vol.description && <div className="mt-0.5"><RichText text={vol.description} className="text-gray-600" /></div>}
              </div>
            ))}
          </>
        )}

        {/* Interests */}
        {vis.interests && (data.interests || []).length > 0 && (
          <>
            <SectionTitle>Interests</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {(data.interests || []).map((item, i) => (
                <span key={i} className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ backgroundColor: `${accent}15`, color: accent }}>{item}</span>
              ))}
            </div>
          </>
        )}

        {/* References */}
        {vis.references && (
          <>
            <SectionTitle>References</SectionTitle>
            {data.referencesNote && <p className="text-gray-500 italic text-[10px] mb-1">{data.referencesNote}</p>}
            {(data.references || []).filter(r => r.name).map((ref) => (
              <div key={ref.id} className="mb-1.5">
                <span className="font-medium text-gray-800">{ref.name}</span>
                {ref.position && <span className="text-gray-500"> · {ref.position}{ref.company ? `, ${ref.company}` : ""}</span>}
                <div className="text-[9px] text-gray-400">{[ref.email, ref.phone].filter(Boolean).join(" · ")}</div>
              </div>
            ))}
          </>
        )}

        {data.customSections.map((cs) => cs.items.some((i) => i.text) && (
          <React.Fragment key={cs.id}>
            <SectionTitle>{cs.title || "Custom Section"}</SectionTitle>
            {cs.items.filter((i) => i.text).map((item) => (
              <div key={item.id} className="mb-1"><RichText text={item.text} className="text-gray-600" /></div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   TEMPLATE 2 — CLASSIC
   Traditional single-column with horizontal rules
   ═══════════════════════════════════════════════════════════════════════ */
export function ClassicTemplate({ data }: TemplateProps) {
  const { personal: p, sections: vis } = data;

  function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
      <div className="mt-4 first:mt-0 mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800">{children}</h3>
        <hr className="border-gray-300 mt-1" />
      </div>
    );
  }

  return (
    <div className="font-serif text-gray-800 text-[10.5px] leading-[1.55] bg-white px-8 py-7">
      {/* Header */}
      <div className="text-center mb-3">
        {p.photoUrl && <img src={p.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 mx-auto mb-2" />}
        <h1 className="text-2xl font-bold tracking-wide text-gray-900">{p.fullName || "Your Name"}</h1>
        {p.jobTitle && <p className="text-sm text-gray-600 italic mt-0.5">{p.jobTitle}</p>}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mt-2 text-[9px] text-gray-500">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>• {p.phone}</span>}
          {p.location && <span>• {p.location}</span>}
          {p.website && <span>• {p.website}</span>}
          {p.linkedin && <span>• {p.linkedin}</span>}
          {p.github && <span>• {p.github}</span>}
        </div>
      </div>

      {vis.summary && p.summary && (<><SectionTitle>Summary</SectionTitle><RichText text={p.summary} className="text-gray-600" /></>)}

      {vis.experience && data.experience.length > 0 && (
        <>
          <SectionTitle>Professional Experience</SectionTitle>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-gray-900">{exp.position}</span>
                <DateRange start={exp.startDate} end={exp.endDate} current={exp.current} />
              </div>
              <p className="text-gray-500 italic text-[10px]">{exp.company}{exp.location ? `, ${exp.location}` : ""}</p>
              {exp.description && <div className="mt-0.5"><RichText text={exp.description} className="text-gray-600" /></div>}
              {exp.highlights.filter(Boolean).length > 0 && (
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  {exp.highlights.filter(Boolean).map((h, i) => <li key={i} className="text-gray-600">{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </>
      )}

      {vis.education && data.education.length > 0 && (
        <>
          <SectionTitle>Education</SectionTitle>
          {data.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-gray-900">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>
                <DateRange start={edu.startDate} end={edu.endDate} />
              </div>
              <p className="text-gray-500 italic text-[10px]">{edu.institution}{edu.gpa ? ` • GPA: ${edu.gpa}` : ""}</p>
              {edu.description && <div className="mt-0.5"><RichText text={edu.description} className="text-gray-600" /></div>}
            </div>
          ))}
        </>
      )}

      {vis.skills && data.skills.length > 0 && (
        <>
          <SectionTitle>Skills</SectionTitle>
          {data.skills.map((sk) => (
            <p key={sk.id} className="mb-0.5">
              {sk.category && <span className="font-bold text-gray-800">{sk.category}: </span>}
              <span className="text-gray-600">{sk.items.join(", ")}</span>
            </p>
          ))}
        </>
      )}

      {vis.projects && data.projects.length > 0 && (
        <>
          <SectionTitle>Projects</SectionTitle>
          {data.projects.map((proj) => (
            <div key={proj.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-gray-900">{proj.name}</span>
                <DateRange start={proj.startDate} end={proj.endDate} />
              </div>
              {proj.url && <p className="text-[9px] text-gray-400 italic">{proj.url}</p>}
              {proj.description && <div className="mt-0.5"><RichText text={proj.description} className="text-gray-600" /></div>}
              {proj.technologies.length > 0 && (
                <p className="text-[9px] text-gray-500 mt-0.5">Technologies: {proj.technologies.join(", ")}</p>
              )}
            </div>
          ))}
        </>
      )}

      {vis.certifications && data.certifications.length > 0 && (
        <>
          <SectionTitle>Certifications</SectionTitle>
          {data.certifications.map((c) => (
            <p key={c.id} className="mb-0.5">
              <span className="font-bold">{c.name}</span> — {c.issuer} ({fmtDate(c.date)})
            </p>
          ))}
        </>
      )}

      {vis.languages && data.languages.length > 0 && (
        <>
          <SectionTitle>Languages</SectionTitle>
          <p className="text-gray-600">{data.languages.map((l) => `${l.name} (${l.proficiency})`).join(" • ")}</p>
        </>
      )}

      {vis.awards && data.awards.length > 0 && (
        <>
          <SectionTitle>Awards</SectionTitle>
          {data.awards.map((a) => (
            <div key={a.id} className="mb-1">
              <span className="font-bold">{a.title}</span> — {a.issuer} ({fmtDate(a.date)})
              {a.description && <RichText text={a.description} className="text-gray-600" />}
            </div>
          ))}
        </>
      )}
      {vis.volunteer && (data.volunteer || []).length > 0 && (<><SectionTitle>Volunteer</SectionTitle>{(data.volunteer || []).map((vol) => (<div key={vol.id} className="mb-2"><div className="flex justify-between items-baseline"><span className="font-bold text-gray-900">{vol.role}</span><DateRange start={vol.startDate} end={vol.endDate} current={vol.current} /></div><p className="text-gray-500 italic text-[10px]">{vol.organization}{vol.location ? `, ${vol.location}` : ""}</p>{vol.description && <div className="mt-0.5"><RichText text={vol.description} className="text-gray-600" /></div>}</div>))}</>)}
      {vis.interests && (data.interests || []).length > 0 && (<><SectionTitle>Interests</SectionTitle><p className="text-gray-600">{(data.interests || []).join(" • ")}</p></>)}
      {vis.references && (<><SectionTitle>References</SectionTitle>{data.referencesNote && <p className="text-gray-600 italic">{data.referencesNote}</p>}{(data.references || []).filter(r => r.name).map((ref) => (<p key={ref.id} className="mb-0.5"><span className="font-bold">{ref.name}</span> — {ref.position}{ref.company ? `, ${ref.company}` : ""}{ref.email ? ` · ${ref.email}` : ""}</p>))}</>)}
      {data.customSections.map((cs) => cs.items.some((i) => i.text) && (
        <React.Fragment key={cs.id}>
          <SectionTitle>{cs.title || "Custom Section"}</SectionTitle>
          {cs.items.filter((i) => i.text).map((item) => (
            <div key={item.id} className="mb-1"><RichText text={item.text} className="text-gray-700" /></div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   TEMPLATE 3 — MINIMAL
   Maximum whitespace, very clean sans-serif
   ═══════════════════════════════════════════════════════════════════════ */
export function MinimalTemplate({ data }: TemplateProps) {
  const { personal: p, sections: vis, accentColor: accent } = data;

  return (
    <div className="font-[system-ui] text-gray-700 text-[10.5px] leading-[1.6] bg-white px-8 py-8">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-4">
          {p.photoUrl && <img src={p.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />}
          <div>
            <h1 className="text-3xl font-extralight tracking-tight text-gray-900">{p.fullName || "Your Name"}</h1>
            {p.jobTitle && <p className="text-sm text-gray-400 mt-1 font-light">{p.jobTitle}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-3 text-[9px] text-gray-400">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>{p.phone}</span>}
          {p.location && <span>{p.location}</span>}
          {p.website && <span>{p.website}</span>}
          {p.linkedin && <span>{p.linkedin}</span>}
          {p.github && <span>{p.github}</span>}
        </div>
      </div>

      {vis.summary && p.summary && (
        <div className="mb-5">
          <RichText text={p.summary} className="text-gray-500 leading-relaxed" />
        </div>
      )}

      {vis.experience && data.experience.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>Experience</h3>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-3.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-medium text-gray-800">{exp.position}</span>
                <DateRange start={exp.startDate} end={exp.endDate} current={exp.current} />
              </div>
              <p className="text-[9.5px] text-gray-400">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>
              {exp.description && <div className="mt-1"><RichText text={exp.description} className="text-gray-500" /></div>}
              {exp.highlights.filter(Boolean).length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {exp.highlights.filter(Boolean).map((h, i) => (
                    <li key={i} className="text-gray-500 pl-3 relative before:content-['–'] before:absolute before:left-0 before:text-gray-300">{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {vis.education && data.education.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>Education</h3>
          {data.education.map((edu) => (
            <div key={edu.id} className="mb-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-medium text-gray-800">{edu.degree}{edu.field ? `, ${edu.field}` : ""}</span>
                <DateRange start={edu.startDate} end={edu.endDate} />
              </div>
              <p className="text-[9.5px] text-gray-400">{edu.institution}{edu.gpa ? ` · GPA: ${edu.gpa}` : ""}</p>
              {edu.description && <div className="mt-0.5"><RichText text={edu.description} className="text-gray-500" /></div>}
            </div>
          ))}
        </div>
      )}

      {vis.skills && data.skills.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.flatMap((sk) => sk.items).map((item, i) => (
              <span key={i} className="rounded-full px-2.5 py-0.5 text-[9px] font-medium border border-gray-200 text-gray-600">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {vis.projects && data.projects.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>Projects</h3>
          {data.projects.map((proj) => (
            <div key={proj.id} className="mb-2.5">
              <span className="text-[11px] font-medium text-gray-800">{proj.name}</span>
              {proj.url && <span className="text-[9px] text-gray-400 ml-1.5">({proj.url})</span>}
              {proj.description && <div className="mt-0.5"><RichText text={proj.description} className="text-gray-500" /></div>}
              {proj.technologies.length > 0 && (
                <p className="text-[9px] text-gray-400 mt-0.5">{proj.technologies.join(" · ")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {vis.certifications && data.certifications.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>Certifications</h3>
          {data.certifications.map((c) => (
            <p key={c.id} className="text-gray-600 mb-0.5">{c.name} — {c.issuer} · {fmtDate(c.date)}</p>
          ))}
        </div>
      )}

      {vis.languages && data.languages.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>Languages</h3>
          <div className="flex flex-wrap gap-x-4">{data.languages.map((l) => (
            <span key={l.id} className="text-gray-600">{l.name} <span className="text-gray-400">· {l.proficiency}</span></span>
          ))}</div>
        </div>
      )}

      {vis.awards && data.awards.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>Awards</h3>
          {data.awards.map((a) => (
            <div key={a.id} className="mb-1">
              <span className="font-medium text-gray-700">{a.title}</span> — {a.issuer} ({fmtDate(a.date)})
              {a.description && <RichText text={a.description} className="text-gray-500" />}
            </div>
          ))}
        </div>
      )}
      {vis.volunteer && (data.volunteer || []).length > 0 && (
        <div className="mb-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>Volunteer</h3>
          {(data.volunteer || []).map((vol) => (<div key={vol.id} className="mb-2.5"><span className="text-[11px] font-medium text-gray-800">{vol.role}</span><p className="text-[9.5px] text-gray-400">{vol.organization}{vol.location ? ` · ${vol.location}` : ""}</p>{vol.description && <div className="mt-0.5"><RichText text={vol.description} className="text-gray-500" /></div>}</div>))}
        </div>
      )}
      {vis.interests && (data.interests || []).length > 0 && (
        <div className="mb-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>Interests</h3>
          <div className="flex flex-wrap gap-1.5">{(data.interests || []).map((item, i) => (<span key={i} className="rounded-full px-2.5 py-0.5 text-[9px] font-medium border border-gray-200 text-gray-600">{item}</span>))}</div>
        </div>
      )}
      {vis.references && (
        <div className="mb-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>References</h3>
          {data.referencesNote && <p className="text-gray-500 mb-1">{data.referencesNote}</p>}
          {(data.references || []).filter(r => r.name).map((ref) => (<div key={ref.id} className="mb-1"><span className="font-medium text-gray-700">{ref.name}</span> — {ref.position}{ref.company ? `, ${ref.company}` : ""}</div>))}
        </div>
      )}
      {data.customSections.map((cs) => cs.items.some((i) => i.text) && (
        <div key={cs.id} className="mb-5">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>{cs.title || "Custom Section"}</h3>
          {cs.items.filter((i) => i.text).map((item) => (
            <div key={item.id} className="mb-1"><RichText text={item.text} className="text-gray-600" /></div>
          ))}
        </div>
      ))}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   TEMPLATE 4 — CREATIVE
   Bold accent sidebar with personal info, content on the right
   ═══════════════════════════════════════════════════════════════════════ */
export function CreativeTemplate({ data }: TemplateProps) {
  const { personal: p, sections: vis, accentColor: accent } = data;

  function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
      <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2 mt-4 first:mt-0 flex items-center gap-2">
        <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: accent }} />
        {children}
      </h3>
    );
  }

  return (
    <div className="font-[system-ui] text-[10.5px] leading-[1.5] bg-white flex min-h-full">
      {/* ── Left sidebar ── */}
      <div className="w-[32%] text-white px-5 py-7 flex-shrink-0" style={{ backgroundColor: accent }}>
        {/* Photo */}
        {p.photoUrl && <img src={p.photoUrl} alt="" className="w-20 h-20 rounded-full object-cover border-3 border-white/30 mx-auto mb-3" />}
        {/* Name */}
        <h1 className="text-xl font-bold tracking-tight leading-tight">{p.fullName || "Your Name"}</h1>
        {p.jobTitle && <p className="text-[10px] mt-1 font-medium opacity-80">{p.jobTitle}</p>}

        {/* Contact */}
        <div className="mt-5 space-y-1.5 text-[9px] opacity-90">
          {p.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 opacity-70" />{p.email}</div>}
          {p.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 opacity-70" />{p.phone}</div>}
          {p.location && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 opacity-70" />{p.location}</div>}
          {p.website && <div className="flex items-center gap-1.5"><Globe className="h-3 w-3 opacity-70" />{p.website}</div>}
          {p.linkedin && <div className="flex items-center gap-1.5"><Linkedin className="h-3 w-3 opacity-70" />{p.linkedin}</div>}
          {p.github && <div className="flex items-center gap-1.5"><Github className="h-3 w-3 opacity-70" />{p.github}</div>}
        </div>

        {/* Skills in sidebar */}
        {vis.skills && data.skills.length > 0 && (
          <div className="mt-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">Skills</h3>
            {data.skills.map((sk) => (
              <div key={sk.id} className="mb-2">
                {sk.category && <p className="text-[9px] font-semibold opacity-80 mb-0.5">{sk.category}</p>}
                <div className="flex flex-wrap gap-1">
                  {sk.items.map((item) => (
                    <span key={item} className="rounded px-1.5 py-0.5 text-[8px] font-medium bg-white/20">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Languages in sidebar */}
        {vis.languages && data.languages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">Languages</h3>
            {data.languages.map((l) => (
              <div key={l.id} className="flex justify-between text-[9px] mb-0.5">
                <span>{l.name}</span>
                <span className="opacity-70">{l.proficiency}</span>
              </div>
            ))}
          </div>
        )}

        {/* Certifications in sidebar */}
        {vis.certifications && data.certifications.length > 0 && (
          <div className="mt-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">Certifications</h3>
            {data.certifications.map((c) => (
              <div key={c.id} className="mb-1.5 text-[9px]">
                <p className="font-semibold">{c.name}</p>
                <p className="opacity-70">{c.issuer} · {fmtDate(c.date)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right main content ── */}
      <div className="flex-1 px-6 py-7 text-gray-800">
        {vis.summary && p.summary && (
          <>
            <SectionTitle>About Me</SectionTitle>
            <RichText text={p.summary} className="text-gray-600" />
          </>
        )}

        {vis.experience && data.experience.length > 0 && (
          <>
            <SectionTitle>Experience</SectionTitle>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-3 pl-3 border-l-2" style={{ borderColor: `${accent}40` }}>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-gray-900">{exp.position}</span>
                  <DateRange start={exp.startDate} end={exp.endDate} current={exp.current} />
                </div>
                <p className="text-[9.5px] text-gray-400">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>
                {exp.description && <div className="mt-0.5"><RichText text={exp.description} className="text-gray-600" /></div>}
                {exp.highlights.filter(Boolean).length > 0 && (
                  <ul className="list-disc ml-4 mt-1 space-y-0.5">
                    {exp.highlights.filter(Boolean).map((h, i) => <li key={i} className="text-gray-600">{h}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}

        {vis.education && data.education.length > 0 && (
          <>
            <SectionTitle>Education</SectionTitle>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2 pl-3 border-l-2" style={{ borderColor: `${accent}40` }}>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-gray-900">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>
                  <DateRange start={edu.startDate} end={edu.endDate} />
                </div>
                <p className="text-[9.5px] text-gray-400">{edu.institution}{edu.gpa ? ` · GPA: ${edu.gpa}` : ""}</p>
                {edu.description && <div className="mt-0.5"><RichText text={edu.description} className="text-gray-600" /></div>}
              </div>
            ))}
          </>
        )}

        {vis.projects && data.projects.length > 0 && (
          <>
            <SectionTitle>Projects</SectionTitle>
            {data.projects.map((proj) => (
              <div key={proj.id} className="mb-2.5 pl-3 border-l-2" style={{ borderColor: `${accent}40` }}>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900">{proj.name}</span>
                  {proj.url && <span className="text-[8.5px] text-gray-400">({proj.url})</span>}
                </div>
                {proj.description && <div className="mt-0.5"><RichText text={proj.description} className="text-gray-600" /></div>}
                {proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proj.technologies.map((t) => (
                      <span key={t} className="rounded px-1.5 py-0.5 text-[8px] font-medium border border-gray-200 text-gray-600">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {vis.awards && data.awards.length > 0 && (
          <>
            <SectionTitle>Awards</SectionTitle>
            {data.awards.map((a) => (
              <div key={a.id} className="mb-1.5">
                <span className="font-medium text-gray-800">{a.title}</span>
                <span className="text-gray-400"> · {a.issuer} · {fmtDate(a.date)}</span>
                {a.description && <div className="mt-0.5"><RichText text={a.description} className="text-gray-500" /></div>}
              </div>
            ))}
          </>
        )}
        {vis.volunteer && (data.volunteer || []).length > 0 && (<><SectionTitle>Volunteer</SectionTitle>{(data.volunteer || []).map((vol) => (<div key={vol.id} className="mb-2.5 pl-3 border-l-2" style={{ borderColor: `${accent}40` }}><div className="flex justify-between items-baseline"><span className="font-semibold text-gray-900">{vol.role}</span><DateRange start={vol.startDate} end={vol.endDate} current={vol.current} /></div><p className="text-[9.5px] text-gray-400">{vol.organization}{vol.location ? ` · ${vol.location}` : ""}</p>{vol.description && <div className="mt-0.5"><RichText text={vol.description} className="text-gray-600" /></div>}</div>))}</>)}
        {vis.interests && (data.interests || []).length > 0 && (<><SectionTitle>Interests</SectionTitle><div className="flex flex-wrap gap-1.5">{(data.interests || []).map((item, i) => (<span key={i} className="rounded px-1.5 py-0.5 text-[8px] font-medium border border-gray-200 text-gray-600">{item}</span>))}</div></>)}
        {vis.references && (<><SectionTitle>References</SectionTitle>{data.referencesNote && <p className="text-gray-500 italic text-[10px] mb-1">{data.referencesNote}</p>}{(data.references || []).filter(r => r.name).map((ref) => (<div key={ref.id} className="mb-1.5"><span className="font-medium text-gray-800">{ref.name}</span><span className="text-gray-400"> · {ref.position}{ref.company ? `, ${ref.company}` : ""}</span></div>))}</>)}
        {data.customSections.map((cs) => cs.items.some((i) => i.text) && (
          <React.Fragment key={cs.id}>
            <SectionTitle>{cs.title || "Custom Section"}</SectionTitle>
            {cs.items.filter((i) => i.text).map((item) => (
              <div key={item.id} className="mb-1"><RichText text={item.text} className="text-gray-600" /></div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}


/* ─── Template selector ──────────────────────────────────────────────── */
export function ResumePreview({ data }: TemplateProps) {
  switch (data.template) {
    case "modern":   return <ModernTemplate data={data} />;
    case "classic":  return <ClassicTemplate data={data} />;
    case "minimal":  return <MinimalTemplate data={data} />;
    case "creative": return <CreativeTemplate data={data} />;
    default:         return <ModernTemplate data={data} />;
  }
}
