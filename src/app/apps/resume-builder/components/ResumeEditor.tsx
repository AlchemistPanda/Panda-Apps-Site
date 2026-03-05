"use client";

import { useState } from "react";
import {
  User, Briefcase, GraduationCap, Wrench, FolderOpen, Award, Globe,
  Trophy, Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Eye, EyeOff, LayoutList,
} from "lucide-react";
import type {
  ResumeData, Experience, Education, Skill, Project,
  Certification, Language, Award as AwardT, CustomSection,
} from "../data/types";
import { uid } from "../data/types";

/* ─── tiny shared pieces ─────────────────────────────────────────────────── */
function Input({ label, value, onChange, placeholder, type = "text", className = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition" />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition resize-none" />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, open, toggle, onAdd }: {
  icon: React.ElementType; title: string; open: boolean; toggle: () => void; onAdd?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 cursor-pointer select-none group" onClick={toggle}>
      <Icon className="h-4 w-4 text-blue-500" />
      <span className="text-sm font-semibold text-gray-800 flex-1">{title}</span>
      {onAdd && (
        <button onClick={(e) => { e.stopPropagation(); onAdd(); }} title={`Add ${title}`}
          className="p-1 rounded hover:bg-blue-50 text-blue-500 opacity-0 group-hover:opacity-100 transition">
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
      {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
    </div>
  );
}

function ItemCard({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="relative rounded-lg border border-gray-100 bg-gray-50/50 p-3 group">
      <GripVertical className="absolute left-1 top-3 h-4 w-4 text-gray-300" />
      <button onClick={onDelete} title="Remove"
        className="absolute right-2 top-2 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <div className="pl-4">{children}</div>
    </div>
  );
}

/* ─── main editor ────────────────────────────────────────────────────── */
interface Props {
  data: ResumeData;
  onChange: (d: ResumeData) => void;
}

type Section = string;

export default function ResumeEditor({ data, onChange }: Props) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["personal"]));

  function toggle(s: Section) {
    setOpenSections((prev) => {
      const n = new Set(prev);
      n.has(s) ? n.delete(s) : n.add(s);
      return n;
    });
  }
  const open = (s: Section) => openSections.has(s);

  // updaters
  function setPersonal(key: keyof typeof data.personal, val: string) {
    onChange({ ...data, personal: { ...data.personal, [key]: val } });
  }

  function setExperience(idx: number, exp: Experience) {
    const a = [...data.experience]; a[idx] = exp;
    onChange({ ...data, experience: a });
  }
  function addExperience() {
    const e: Experience = { id: uid(), company: "", position: "", location: "", startDate: "", endDate: "", current: false, description: "", highlights: [""] };
    onChange({ ...data, experience: [...data.experience, e] });
    setOpenSections((p) => new Set(p).add("experience"));
  }
  function removeExperience(idx: number) {
    onChange({ ...data, experience: data.experience.filter((_, i) => i !== idx) });
  }

  function setEducation(idx: number, edu: Education) {
    const a = [...data.education]; a[idx] = edu;
    onChange({ ...data, education: a });
  }
  function addEducation() {
    const e: Education = { id: uid(), institution: "", degree: "", field: "", location: "", startDate: "", endDate: "", gpa: "", description: "" };
    onChange({ ...data, education: [...data.education, e] });
    setOpenSections((p) => new Set(p).add("education"));
  }
  function removeEducation(idx: number) {
    onChange({ ...data, education: data.education.filter((_, i) => i !== idx) });
  }

  function setSkill(idx: number, sk: Skill) {
    const a = [...data.skills]; a[idx] = sk;
    onChange({ ...data, skills: a });
  }
  function addSkill() {
    onChange({ ...data, skills: [...data.skills, { id: uid(), category: "", items: [] }] });
    setOpenSections((p) => new Set(p).add("skills"));
  }
  function removeSkill(idx: number) {
    onChange({ ...data, skills: data.skills.filter((_, i) => i !== idx) });
  }

  function setProject(idx: number, p: Project) {
    const a = [...data.projects]; a[idx] = p;
    onChange({ ...data, projects: a });
  }
  function addProject() {
    onChange({ ...data, projects: [...data.projects, { id: uid(), name: "", description: "", technologies: [], url: "", startDate: "", endDate: "" }] });
    setOpenSections((p) => new Set(p).add("projects"));
  }
  function removeProject(idx: number) {
    onChange({ ...data, projects: data.projects.filter((_, i) => i !== idx) });
  }

  function setCert(idx: number, c: Certification) {
    const a = [...data.certifications]; a[idx] = c;
    onChange({ ...data, certifications: a });
  }
  function addCert() {
    onChange({ ...data, certifications: [...data.certifications, { id: uid(), name: "", issuer: "", date: "", url: "" }] });
    setOpenSections((p) => new Set(p).add("certifications"));
  }
  function removeCert(idx: number) {
    onChange({ ...data, certifications: data.certifications.filter((_, i) => i !== idx) });
  }

  function setLang(idx: number, l: Language) {
    const a = [...data.languages]; a[idx] = l;
    onChange({ ...data, languages: a });
  }
  function addLang() {
    onChange({ ...data, languages: [...data.languages, { id: uid(), name: "", proficiency: "Intermediate" }] });
    setOpenSections((p) => new Set(p).add("languages"));
  }
  function removeLang(idx: number) {
    onChange({ ...data, languages: data.languages.filter((_, i) => i !== idx) });
  }

  function setAward(idx: number, a: AwardT) {
    const arr = [...data.awards]; arr[idx] = a;
    onChange({ ...data, awards: arr });
  }
  function addAward() {
    onChange({ ...data, awards: [...data.awards, { id: uid(), title: "", issuer: "", date: "", description: "" }] });
    setOpenSections((p) => new Set(p).add("awards"));
  }
  function removeAward(idx: number) {
    onChange({ ...data, awards: data.awards.filter((_, i) => i !== idx) });
  }

  function toggleSection(key: keyof typeof data.sections) {
    onChange({ ...data, sections: { ...data.sections, [key]: !data.sections[key] } });
  }

  function addCustomSection() {
    const newSection: CustomSection = { id: uid(), title: "Custom Section", items: [{ id: uid(), text: "" }] };
    onChange({ ...data, customSections: [...data.customSections, newSection] });
    setOpenSections((p) => new Set(p).add(`custom-${newSection.id}`));
  }
  function removeCustomSection(idx: number) {
    onChange({ ...data, customSections: data.customSections.filter((_, i) => i !== idx) });
  }
  function setCustomSection(idx: number, s: CustomSection) {
    const arr = [...data.customSections]; arr[idx] = s;
    onChange({ ...data, customSections: arr });
  }
  function addCustomItem(sectionIdx: number) {
    const s = data.customSections[sectionIdx];
    setCustomSection(sectionIdx, { ...s, items: [...s.items, { id: uid(), text: "" }] });
  }
  function removeCustomItem(sectionIdx: number, itemIdx: number) {
    const s = data.customSections[sectionIdx];
    setCustomSection(sectionIdx, { ...s, items: s.items.filter((_, i) => i !== itemIdx) });
  }

  const p = data.personal;

  return (
    <div className="space-y-4">
      {/* ─ Personal ─ */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
        <SectionHeader icon={User} title="Personal Information" open={open("personal")} toggle={() => toggle("personal")} />
        {open("personal") && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name" value={p.fullName} onChange={(v) => setPersonal("fullName", v)} placeholder="Alex Johnson" />
              <Input label="Job Title" value={p.jobTitle} onChange={(v) => setPersonal("jobTitle", v)} placeholder="Software Engineer" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email" value={p.email} onChange={(v) => setPersonal("email", v)} placeholder="alex@email.com" type="email" />
              <Input label="Phone" value={p.phone} onChange={(v) => setPersonal("phone", v)} placeholder="+1 (555) 123-4567" />
            </div>
            <Input label="Location" value={p.location} onChange={(v) => setPersonal("location", v)} placeholder="San Francisco, CA" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Website" value={p.website} onChange={(v) => setPersonal("website", v)} placeholder="yoursite.com" />
              <Input label="LinkedIn" value={p.linkedin} onChange={(v) => setPersonal("linkedin", v)} placeholder="linkedin.com/in/you" />
            </div>
            <Input label="GitHub" value={p.github} onChange={(v) => setPersonal("github", v)} placeholder="github.com/you" />
            <Textarea label="Professional Summary" value={p.summary} onChange={(v) => setPersonal("summary", v)}
              placeholder="Results-driven engineer with 5+ years of experience…" rows={4} />
          </div>
        )}
      </div>

      {/* ─ Experience ─ */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-center">
          <div className="flex-1">
            <SectionHeader icon={Briefcase} title="Work Experience" open={open("experience")} toggle={() => toggle("experience")} onAdd={addExperience} />
          </div>
          <button onClick={() => toggleSection("experience")} title={data.sections.experience ? "Hide section" : "Show section"}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition font-medium ${
              data.sections.experience ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200"
            }`}>
            {data.sections.experience ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {data.sections.experience ? "Visible" : "Hidden"}
          </button>
        </div>
        {open("experience") && data.experience.map((exp, i) => (
          <ItemCard key={exp.id} onDelete={() => removeExperience(i)}>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Company" value={exp.company} onChange={(v) => setExperience(i, { ...exp, company: v })} placeholder="Acme Inc." />
                <Input label="Position" value={exp.position} onChange={(v) => setExperience(i, { ...exp, position: v })} placeholder="Software Engineer" />
              </div>
              <Input label="Location" value={exp.location} onChange={(v) => setExperience(i, { ...exp, location: v })} placeholder="Remote" />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Start Date" value={exp.startDate} onChange={(v) => setExperience(i, { ...exp, startDate: v })} placeholder="2022-03" />
                <div>
                  <Input label="End Date" value={exp.current ? "" : exp.endDate} onChange={(v) => setExperience(i, { ...exp, endDate: v })} placeholder="Present" />
                  <label className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <input type="checkbox" checked={exp.current} onChange={() => setExperience(i, { ...exp, current: !exp.current })} className="accent-blue-500" />
                    Currently working here
                  </label>
                </div>
              </div>
              <Textarea label="Description" value={exp.description} onChange={(v) => setExperience(i, { ...exp, description: v })} placeholder="Brief role overview…" rows={2} />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Key Achievements</label>
                {exp.highlights.map((h, hi) => (
                  <div key={hi} className="flex gap-1 mb-1">
                    <input value={h} onChange={(e) => {
                      const hl = [...exp.highlights]; hl[hi] = e.target.value;
                      setExperience(i, { ...exp, highlights: hl });
                    }} placeholder="Achieved…"
                      className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    <button onClick={() => {
                      const hl = exp.highlights.filter((_, j) => j !== hi);
                      setExperience(i, { ...exp, highlights: hl });
                    }} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
                <button onClick={() => setExperience(i, { ...exp, highlights: [...exp.highlights, ""] })}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                  <Plus className="h-3 w-3" /> Add achievement
                </button>
              </div>
            </div>
          </ItemCard>
        ))}
        {open("experience") && data.experience.length === 0 && (
          <button onClick={addExperience} className="w-full rounded-lg border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition">
            + Add Work Experience
          </button>
        )}
      </div>

      {/* ─ Education ─ */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-center">
          <div className="flex-1">
            <SectionHeader icon={GraduationCap} title="Education" open={open("education")} toggle={() => toggle("education")} onAdd={addEducation} />
          </div>
          <button onClick={() => toggleSection("education")} title={data.sections.education ? "Hide section" : "Show section"}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition font-medium ${
              data.sections.education ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200"
            }`}>
            {data.sections.education ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {data.sections.education ? "Visible" : "Hidden"}
          </button>
        </div>
        {open("education") && data.education.map((edu, i) => (
          <ItemCard key={edu.id} onDelete={() => removeEducation(i)}>
            <div className="space-y-2">
              <Input label="Institution" value={edu.institution} onChange={(v) => setEducation(i, { ...edu, institution: v })} placeholder="MIT" />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Degree" value={edu.degree} onChange={(v) => setEducation(i, { ...edu, degree: v })} placeholder="B.Sc." />
                <Input label="Field of Study" value={edu.field} onChange={(v) => setEducation(i, { ...edu, field: v })} placeholder="Computer Science" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input label="Start Date" value={edu.startDate} onChange={(v) => setEducation(i, { ...edu, startDate: v })} placeholder="2015-08" />
                <Input label="End Date" value={edu.endDate} onChange={(v) => setEducation(i, { ...edu, endDate: v })} placeholder="2019-05" />
                <Input label="GPA" value={edu.gpa} onChange={(v) => setEducation(i, { ...edu, gpa: v })} placeholder="3.8/4.0" />
              </div>
              <Textarea label="Additional Info" value={edu.description} onChange={(v) => setEducation(i, { ...edu, description: v })} placeholder="Dean's List, clubs…" rows={2} />
            </div>
          </ItemCard>
        ))}
        {open("education") && data.education.length === 0 && (
          <button onClick={addEducation} className="w-full rounded-lg border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition">
            + Add Education
          </button>
        )}
      </div>

      {/* ─ Skills ─ */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-center">
          <div className="flex-1">
            <SectionHeader icon={Wrench} title="Skills" open={open("skills")} toggle={() => toggle("skills")} onAdd={addSkill} />
          </div>
          <button onClick={() => toggleSection("skills")} title={data.sections.skills ? "Hide section" : "Show section"}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition font-medium ${
              data.sections.skills ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200"
            }`}>
            {data.sections.skills ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {data.sections.skills ? "Visible" : "Hidden"}
          </button>
        </div>
        {open("skills") && data.skills.map((sk, i) => (
          <ItemCard key={sk.id} onDelete={() => removeSkill(i)}>
            <div className="space-y-2">
              <Input label="Category" value={sk.category} onChange={(v) => setSkill(i, { ...sk, category: v })} placeholder="Frontend" />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Skills (comma-separated)</label>
                <input value={sk.items.join(", ")} onChange={(e) => setSkill(i, { ...sk, items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="React, TypeScript, Next.js"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition" />
              </div>
            </div>
          </ItemCard>
        ))}
        {open("skills") && data.skills.length === 0 && (
          <button onClick={addSkill} className="w-full rounded-lg border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition">
            + Add Skill Category
          </button>
        )}
      </div>

      {/* ─ Projects ─ */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-center">
          <div className="flex-1">
            <SectionHeader icon={FolderOpen} title="Projects" open={open("projects")} toggle={() => toggle("projects")} onAdd={addProject} />
          </div>
          <button onClick={() => toggleSection("projects")} title={data.sections.projects ? "Hide section" : "Show section"}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition font-medium ${
              data.sections.projects ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200"
            }`}>
            {data.sections.projects ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {data.sections.projects ? "Visible" : "Hidden"}
          </button>
        </div>
        {open("projects") && data.projects.map((proj, i) => (
          <ItemCard key={proj.id} onDelete={() => removeProject(i)}>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Project Name" value={proj.name} onChange={(v) => setProject(i, { ...proj, name: v })} placeholder="My App" />
                <Input label="URL" value={proj.url} onChange={(v) => setProject(i, { ...proj, url: v })} placeholder="github.com/…" />
              </div>
              <Textarea label="Description" value={proj.description} onChange={(v) => setProject(i, { ...proj, description: v })} placeholder="What the project does…" rows={2} />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Technologies (comma-separated)</label>
                <input value={proj.technologies.join(", ")} onChange={(e) => setProject(i, { ...proj, technologies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="React, Node.js, PostgreSQL"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Start Date" value={proj.startDate} onChange={(v) => setProject(i, { ...proj, startDate: v })} placeholder="2023-01" />
                <Input label="End Date" value={proj.endDate} onChange={(v) => setProject(i, { ...proj, endDate: v })} placeholder="2023-06" />
              </div>
            </div>
          </ItemCard>
        ))}
        {open("projects") && data.projects.length === 0 && (
          <button onClick={addProject} className="w-full rounded-lg border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition">
            + Add Project
          </button>
        )}
      </div>

      {/* ─ Certifications ─ */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-center">
          <div className="flex-1">
            <SectionHeader icon={Award} title="Certifications" open={open("certifications")} toggle={() => toggle("certifications")} onAdd={addCert} />
          </div>
          <button onClick={() => toggleSection("certifications")} title={data.sections.certifications ? "Hide section" : "Show section"}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition font-medium ${
              data.sections.certifications ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200"
            }`}>
            {data.sections.certifications ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {data.sections.certifications ? "Visible" : "Hidden"}
          </button>
        </div>
        {open("certifications") && data.certifications.map((c, i) => (
          <ItemCard key={c.id} onDelete={() => removeCert(i)}>
            <div className="space-y-2">
              <Input label="Certification Name" value={c.name} onChange={(v) => setCert(i, { ...c, name: v })} placeholder="AWS Solutions Architect" />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Issuer" value={c.issuer} onChange={(v) => setCert(i, { ...c, issuer: v })} placeholder="Amazon Web Services" />
                <Input label="Date" value={c.date} onChange={(v) => setCert(i, { ...c, date: v })} placeholder="2023-08" />
              </div>
              <Input label="URL" value={c.url} onChange={(v) => setCert(i, { ...c, url: v })} placeholder="credential URL" />
            </div>
          </ItemCard>
        ))}
        {open("certifications") && data.certifications.length === 0 && (
          <button onClick={addCert} className="w-full rounded-lg border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition">
            + Add Certification
          </button>
        )}
      </div>

      {/* ─ Languages ─ */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-center">
          <div className="flex-1">
            <SectionHeader icon={Globe} title="Languages" open={open("languages")} toggle={() => toggle("languages")} onAdd={addLang} />
          </div>
          <button onClick={() => toggleSection("languages")} title={data.sections.languages ? "Hide section" : "Show section"}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition font-medium ${
              data.sections.languages ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200"
            }`}>
            {data.sections.languages ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {data.sections.languages ? "Visible" : "Hidden"}
          </button>
        </div>
        {open("languages") && data.languages.map((l, i) => (
          <ItemCard key={l.id} onDelete={() => removeLang(i)}>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Language" value={l.name} onChange={(v) => setLang(i, { ...l, name: v })} placeholder="Spanish" />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Proficiency</label>
                <select value={l.proficiency} onChange={(e) => setLang(i, { ...l, proficiency: e.target.value as Language["proficiency"] })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition">
                  {(["Native", "Fluent", "Advanced", "Intermediate", "Basic"] as const).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </ItemCard>
        ))}
        {open("languages") && data.languages.length === 0 && (
          <button onClick={addLang} className="w-full rounded-lg border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition">
            + Add Language
          </button>
        )}
      </div>

      {/* ─ Awards ─ */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
        <div className="flex items-center">
          <div className="flex-1">
            <SectionHeader icon={Trophy} title="Awards & Achievements" open={open("awards")} toggle={() => toggle("awards")} onAdd={addAward} />
          </div>
          <button onClick={() => toggleSection("awards")} title={data.sections.awards ? "Hide section" : "Show section"}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition font-medium ${
              data.sections.awards ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200"
            }`}>
            {data.sections.awards ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {data.sections.awards ? "Visible" : "Hidden"}
          </button>
        </div>
        {open("awards") && data.awards.map((a, i) => (
          <ItemCard key={a.id} onDelete={() => removeAward(i)}>
            <div className="space-y-2">
              <Input label="Award Title" value={a.title} onChange={(v) => setAward(i, { ...a, title: v })} placeholder="Hackathon Winner" />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Issuer" value={a.issuer} onChange={(v) => setAward(i, { ...a, issuer: v })} placeholder="Company Hack Week" />
                <Input label="Date" value={a.date} onChange={(v) => setAward(i, { ...a, date: v })} placeholder="2023-11" />
              </div>
              <Textarea label="Description" value={a.description} onChange={(v) => setAward(i, { ...a, description: v })} placeholder="Brief description…" rows={2} />
            </div>
          </ItemCard>
        ))}
        {open("awards") && data.awards.length === 0 && (
          <button onClick={addAward} className="w-full rounded-lg border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition">
            + Add Award
          </button>
        )}
      </div>
    </div>
  );
}
