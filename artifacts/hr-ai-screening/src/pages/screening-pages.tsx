// Convex's generated anyApi keeps runtime references flexible; the page components
// deliberately normalize their data at the UI boundary.
// @ts-nocheck
import { ChangeEvent, ReactNode, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { ArrowLeft, BriefcaseBusiness, Check, ChevronRight, FileSearch, FileText, Filter, History, Info, Play, Plus, RefreshCw, Scale, Search, Sparkles, UploadCloud, UserRound } from "lucide-react";
import { Button, EmptyState, ErrorState, LoadingState, PageIntro, SearchField, SectionLabel, StatTile } from "@/components/screening-ui";
import { useGeminiKey } from "@/hooks/use-gemini-key";

const inputClass = "h-10 w-full rounded-lg border border-input bg-card px-3 text-[13px] outline-none focus:border-primary";
function BackLink({ href, children }: { href: string; children: string }) { return <Link href={href} className="mb-7 inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={15} />{children}</Link>; }
function Note({ children }: { children: ReactNode }) { return <div className="mt-6 flex items-center gap-2 rounded-lg border border-border/75 bg-secondary/40 px-3 py-2 font-mono-ui text-[10px] uppercase tracking-[.08em] text-muted-foreground"><Info size={14} className="text-primary" />{children}</div>; }
function KeyGate({ children }: { children: ReactNode }) { const [key] = useGeminiKey(); return key ? <>{children}</> : <span title="Add your Gemini API key in Settings first">{children}</span>; }

export function OverviewPage() {
  const pools = useQuery(api.pools.list) ?? []; const jobs = useQuery(api.jobs.list) ?? [];
  return <div><PageIntro eyebrow="Workspace overview" title="Decisions, with their receipts." description="Screen real candidates against real requirements, with source evidence kept visible." actions={<Link href="/runs/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-bold text-primary-foreground"><Play size={15} fill="currentColor" />Start a matching run</Link>} /><div className="mb-8 grid gap-3 sm:grid-cols-3"><StatTile label="Candidate pools" value={String(pools.length)} detail="Saved in Convex" /><StatTile label="Job descriptions" value={String(jobs.length)} detail="Canonical requirements" tone="amber" /><StatTile label="Active reviews" value="—" detail="Open a completed run" tone="ink" /></div><div className="grid gap-7 xl:grid-cols-2"><section><SectionLabel action={<Link href="/pools" className="text-[11px] font-semibold text-primary">View pools <ChevronRight size={13} className="inline" /></Link>}>Candidate pools</SectionLabel>{pools.length ? <div className="space-y-2">{pools.slice(0, 5).map((pool) => <Link href={`/pools/${pool._id}`} key={pool._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary"><span className="text-[13px] font-bold">{pool.name}</span><ChevronRight size={16} className="text-muted-foreground" /></Link>)}</div> : <EmptyState icon={UserRound} title="Your pools will appear here" description="Create a candidate pool to begin." action={<Link href="/pools" className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-[12px] font-semibold">Open candidate pools</Link>} />}</section><section><SectionLabel action={<Link href="/jobs" className="text-[11px] font-semibold text-primary">View jobs <ChevronRight size={13} className="inline" /></Link>}>Job descriptions</SectionLabel>{jobs.length ? <div className="space-y-2">{jobs.slice(0, 5).map((job) => <Link href={`/jobs/${job._id}`} key={job._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary"><span className="text-[13px] font-bold">{job.title}</span><ChevronRight size={16} className="text-muted-foreground" /></Link>)}</div> : <EmptyState icon={BriefcaseBusiness} title="No job descriptions yet" description="Paste a real job description to create canonical requirements." action={<Link href="/jobs" className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-[12px] font-semibold">Create a job</Link>} />}</section></div><Note>Every record and policy is loaded from Convex</Note></div>;
}

export function PoolsPage() {
  const pools = useQuery(api.pools.list); const create = useMutation(api.pools.create); const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [description, setDescription] = useState("");
  if (pools === undefined) return <LoadingState />;
  const submit = async () => { await create({ name: name.trim(), description: description.trim() || undefined }); setName(""); setDescription(""); setOpen(false); };
  return <div><PageIntro eyebrow="Candidate pools" title="Keep the source set intact." description="Create a pool, then attach real CVs or existing extracted candidates." actions={<Button onClick={() => setOpen(!open)} dataTestId="button-new-pool"><Plus size={15} />New pool</Button>} />{open && <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 p-5"><div className="grid gap-3 sm:grid-cols-2"><input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Pool name" data-testid="input-new-pool-name" /><input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Description (optional)" /></div><div className="mt-3 flex gap-2"><Button type="submit"><Check size={15} />Create pool</Button><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button></div></form>}{pools.length ? <div className="space-y-3">{pools.map((pool) => <Link href={`/pools/${pool._id}`} key={pool._id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 panel-shadow hover:border-primary"><div><h3 className="text-[14px] font-bold">{pool.name}</h3><p className="mt-1 text-[11px] text-muted-foreground">{pool.description || "No description"} · {new Date(pool.createdAt).toLocaleDateString()}</p></div><ChevronRight size={17} className="text-muted-foreground" /></Link>)}</div> : <EmptyState icon={UserRound} title="No candidate pools yet" description="Create your first real pool to start importing CVs." action={<Button variant="secondary" onClick={() => setOpen(true)}><Plus size={15} />Create a pool</Button>} />}<Note>Pool membership is persisted in Convex</Note></div>;
}

export function PoolDetailPage() {
  const { id } = useParams<{ id: string }>(); const poolId = id as Id<"candidatePools">; const data = useQuery(api.pools.get, { poolId }); const uploadUrl = useMutation(api.storage.generateUploadUrl); const upload = useAction(api.pools.uploadCvs); const uploadText = useAction(api.pools.uploadCvFromText); const add = useMutation(api.pools.addMember); const remove = useMutation(api.pools.removeMember); const candidates = useQuery(api.candidates.search, { query: "" }) ?? []; const [key] = useGeminiKey(); const [files, setFiles] = useState<File[]>([]); const [rawText, setRawText] = useState(""); const [inputMode, setInputMode] = useState<"file" | "text">("file"); const [search, setSearch] = useState(""); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<string | null>(null); const [selectedMemberId, setSelectedMemberId] = useState<Id<"candidates"> | null>(null);
  if (data === undefined) return <LoadingState />; if (data === null) return <ErrorState />;
  const choose = (e: ChangeEvent<HTMLInputElement>) => setFiles(Array.from(e.target.files ?? []));
  const extract = async () => { if (!key || !files.length) return; setBusy(true); setNotice(null); try { const ids = []; for (const file of files) { const url = await uploadUrl(); const result = await fetch(url, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file }); const json = await result.json(); ids.push(json.storageId as Id<"_storage">); } const results = await upload({ poolId, storageIds: ids, apiKey: key }); const failures = (results as any[]).filter((r) => r.error).map((r) => r.error); setNotice(failures.length ? failures.join(" · ") : null); setFiles([]); } catch (e: any) { setNotice(e?.message ? String(e.message) : String(e)); } finally { setBusy(false); } };
  const extractFromText = async () => { if (!key || !rawText.trim()) return; setBusy(true); setNotice(null); try { await uploadText({ poolId, rawText, apiKey: key }); setRawText(""); } catch (e: any) { setNotice(e?.message ? String(e.message) : String(e)); } finally { setBusy(false); } };
  const existing = candidates.filter((c) => !data.members.some((m) => m.candidateId === c._id) && [c.name, c.email, ...c.skills].filter(Boolean).some((x) => x!.toLowerCase().includes(search.toLowerCase()))).slice(0, 5);
  return <div><BackLink href="/pools">All candidate pools</BackLink><PageIntro eyebrow={`Candidate pool / ${data.pool.name}`} title="Pool members" description="Upload PDF/TXT CVs or paste CV text to extract structured evidence with Gemini." actions={<div className="flex gap-2"><label className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-4 text-[13px] font-bold ${inputMode === "file" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-secondary"}`}><UploadCloud size={16} />Choose CVs<input type="file" accept=".pdf,.txt" multiple className="sr-only" onChange={(e) => { choose(e); setInputMode("file"); }} /></label><Button variant={inputMode === "text" ? "primary" : "secondary"} onClick={() => setInputMode("text")}><FileText size={16} />Paste CV</Button></div>} />{notice && <div className="mb-6 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"><span className="text-[12px] font-semibold text-destructive">{notice}</span><button onClick={() => setNotice(null)} className="text-[11px] text-muted-foreground hover:text-destructive">Dismiss</button></div>}{inputMode === "file" && files.length > 0 && <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"><span className="text-[12px] font-semibold">{files.length} file(s) ready</span><KeyGate><Button onClick={() => void extract()} disabled={busy || !key}>{busy ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />} {busy ? "Extracting…" : "Upload & extract"}</Button></KeyGate></div>}{inputMode === "text" && <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 p-5"><textarea value={rawText} onChange={(e) => setRawText(e.target.value)} className="min-h-[220px] w-full rounded-lg border border-input bg-card p-3 text-[13px] leading-6 outline-none focus:border-primary" placeholder="Paste the complete CV/resume text" /><div className="mt-3 flex gap-2"><KeyGate><Button onClick={() => void extractFromText()} disabled={busy || !rawText.trim()}>{busy ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />} {busy ? "Extracting…" : "Extract from text"}</Button></KeyGate><Button variant="secondary" onClick={() => { setRawText(""); setInputMode("file"); }}>Cancel</Button></div></div>}<div className="mb-7 grid gap-3 sm:grid-cols-3"><StatTile label="Members" value={String(data.members.length)} detail="Pool records" /><StatTile label="Extracted" value={String(data.members.length)} detail="Structured profiles" tone="amber" /><StatTile label="Needs review" value="—" detail="Run matching to assess" tone="ink" /></div><SectionLabel>Pool members</SectionLabel>{data.members.length ? <div className="space-y-2">{data.members.map((member) => <div key={member._id} onClick={() => setSelectedMemberId(selectedMemberId === member.candidateId ? null : member.candidateId)} className={`flex cursor-pointer items-center justify-between rounded-xl border bg-card p-4 ${selectedMemberId === member.candidateId ? "border-primary" : "border-border hover:border-primary"}`}><div><p className="text-[13px] font-bold">{member.candidate?.name || member.candidate?.email || "Unnamed candidate"}{member.candidate?.securityFlag && <span title={`Security flag: ${String(member.candidate.securityFlag).replace(/_/g, " ")}`} className="ml-2 rounded bg-destructive/20 px-1.5 py-0.5 text-[9px] text-destructive">⚠ flagged</span>}</p><p className="mt-1 text-[11px] text-muted-foreground">{member.candidate?.totalYearsExperience ?? 0} years · {member.candidate?.skills.slice(0, 4).join(", ")}</p></div><Button variant="quiet" onClick={() => void remove({ poolId, candidateId: member.candidateId })}>Remove</Button></div>)}{selectedMemberId && (() => { const member = data.members.find((m: any) => m.candidateId === selectedMemberId); return member?.candidate ? <CandidateProfilePanel candidate={member.candidate} onClose={() => setSelectedMemberId(null)} /> : null; })()}</div> : <EmptyState icon={FileSearch} title="No members in this pool" description="Upload PDF/TXT CV files or paste CV text to extract candidates." />}<div className="mt-8 rounded-2xl border border-border bg-card p-5"><SectionLabel>Add existing candidate</SectionLabel><div className="relative"><Search size={15} className="absolute left-3 top-3 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} pl-9`} placeholder="Search candidates" /></div>{search && existing.map((candidate) => <button key={candidate._id} onClick={() => { void add({ poolId, candidateId: candidate._id }); setSearch(""); }} className="mt-2 block w-full rounded-lg border border-border p-3 text-left text-[12px] hover:border-primary">{candidate.name || candidate.email || "Unnamed candidate"}</button>)}</div><Note>Original documents stay attached to every extracted record</Note></div>;
}
function CandidateProfilePanel({ candidate, onClose }: { candidate: any; onClose: () => void }) {
  const c = candidate;
  const chip = "rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8" onClick={onClose}>
      <section className="w-full max-w-2xl rounded-2xl border border-primary/30 bg-card p-5 panel-shadow" onClick={(e) => e.stopPropagation()}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <SectionLabel>Extracted candidate profile</SectionLabel>
          <h3 className="mt-1 text-[14px] font-bold">{c.name || c.email || "Unnamed candidate"}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">{[c.email, c.location].filter(Boolean).join(" · ") || "No contact info extracted"}</p>
        </div>
        <button onClick={onClose} className="text-[11px] text-muted-foreground hover:text-destructive">Close</button>
      </div>

      {c.securityFlag && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-[11px] font-bold text-destructive">⚠ Security flag: {String(c.securityFlag).replace(/_/g, " ")}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">This document contains text attempting to manipulate AI screening (jailbreak / injected instructions). The candidate is auto-excluded from every ranking; the extraction below shows what the model read.</p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <span className={chip}>Total experience: {c.totalYearsExperience ?? 0} yrs</span>
        {c.relevantYearsExperience !== undefined && <span className={chip}>Relevant: {c.relevantYearsExperience} yrs</span>}
        <span className={chip}>Extraction confidence: {Math.round((c.extractionConfidence ?? 0) * 100)}%</span>
        <span className={chip}>{(c.skills ?? []).length} skills</span>
      </div>

      {(c.skills ?? []).length > 0 && (
        <>
          <SectionLabel>Skills</SectionLabel>
          <div className="mb-4 mt-2 flex flex-wrap gap-1.5">{c.skills.map((s: string, i: number) => <span key={`${s}-${i}`} className="rounded-md border border-border px-2 py-0.5 text-[11px]">{s}</span>)}</div>
        </>
      )}

      {(c.education ?? []).length > 0 && (
        <>
          <SectionLabel>Education</SectionLabel>
          <ul className="mb-4 mt-2 space-y-1">{c.education.map((e: any, i: number) => <li key={i} className="text-[12px]">{e.degree} · {e.field}{e.institution ? ` — ${e.institution}` : ""}</li>)}</ul>
        </>
      )}

      {(c.experienceHistory ?? []).length > 0 && (
        <>
          <SectionLabel>Experience history</SectionLabel>
          <div className="mb-4 mt-2 space-y-3">{c.experienceHistory.map((h: any, i: number) => <div key={i} className="border-l-2 border-primary/30 pl-3"><p className="text-[12px] font-bold">{h.title}{h.company ? ` — ${h.company}` : ""}</p>{h.summary && <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{h.summary}</p>}</div>)}</div>
        </>
      )}

      {(c.projects ?? []).length > 0 && (
        <>
          <SectionLabel>Projects</SectionLabel>
          <div className="mb-4 mt-2 space-y-3">{c.projects.map((p: any, i: number) => <div key={i}><p className="text-[12px] font-bold">{p.name}</p>{p.summary && <p className="mt-0.5 line-clamp-3 text-[11px] leading-5 text-muted-foreground" title={p.summary}>{p.summary}</p>}{(p.skills ?? []).length > 0 && <p className="mt-1 text-[10px] text-muted-foreground">{p.skills.join(" · ")}</p>}</div>)}</div>
        </>
      )}

      {c.rawText && <details className="mt-2"><summary className="cursor-pointer text-[11px] font-semibold text-primary">Show raw CV text</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-secondary/40 p-3 font-mono-ui text-[10px] leading-5 text-muted-foreground">{c.rawText}</pre></details>}
      </section>
    </div>
  );
}


export function JobsPage() {
  const jobs = useQuery(api.jobs.list); const extract = useAction(api.jobs.extractJd); const [key] = useGeminiKey(); const [open, setOpen] = useState(false); const [rawText, setRawText] = useState(""); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<string | null>(null);
  if (jobs === undefined) return <LoadingState />;
  const submit = async () => { if (!key || !rawText.trim()) return; setBusy(true); setNotice(null); try { await extract({ rawText, apiKey: key }); setRawText(""); setOpen(false); } catch (e: any) { setNotice(e?.message ? String(e.message) : String(e)); } finally { setBusy(false); } };
  return <div><PageIntro eyebrow="Job descriptions" title="Define the bar before the model sees it." description="Paste a real job description and review the canonical requirements Gemini extracts." actions={<KeyGate><Button onClick={() => setOpen(!open)} disabled={!key}><Plus size={15} />Create job</Button></KeyGate>} />{notice && <div className="mb-6 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"><span className="text-[12px] font-semibold text-destructive">{notice}</span><button onClick={() => setNotice(null)} className="text-[11px] text-muted-foreground hover:text-destructive">Dismiss</button></div>}{open && <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 p-5"><textarea value={rawText} onChange={(e) => setRawText(e.target.value)} className="min-h-[220px] w-full rounded-lg border border-input bg-card p-3 text-[13px] leading-6 outline-none focus:border-primary" placeholder="Paste the complete job description" /><div className="mt-3 flex gap-2"><Button onClick={() => void submit()} disabled={busy || !rawText.trim()}>{busy ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />} {busy ? "Extracting…" : "Extract requirements"}</Button><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button></div></div>}{jobs.length ? <div className="space-y-3">{jobs.map((job) => <Link href={`/jobs/${job._id}`} key={job._id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 panel-shadow hover:border-primary"><div><h3 className="text-[14px] font-bold">{job.title}</h3><p className="mt-1 text-[11px] text-muted-foreground">{job.canonicalJson.skills?.length ?? 0} extracted skills · {new Date(job.createdAt).toLocaleDateString()}</p></div><ChevronRight size={17} className="text-muted-foreground" /></Link>)}</div> : <EmptyState icon={BriefcaseBusiness} title="No job descriptions yet" description="Create one from a real job description." action={<KeyGate><Button variant="secondary" onClick={() => setOpen(true)} disabled={!key}><Plus size={15} />Add a job description</Button></KeyGate>} />}<Note>Canonical requirements are saved as the Gemini response in Convex</Note></div>;
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>(); const job = useQuery(api.jobs.get, { jobId: id as Id<"jobDescriptions"> }); const saveWeights = useMutation(api.jobs.updateWeights); const saveSkills = useMutation(api.jobs.updateSkills); const saveCategories = useMutation(api.jobs.updateCategories); const [weights, setWeights] = useState<Record<string, number> | null>(null); const [categories, setCategories] = useState<any[] | null>(null);
  if (job === undefined) return <LoadingState />; if (job === null) return <ErrorState />;
  const isNewFormat = Array.isArray(job.canonicalJson.categories) && job.canonicalJson.categories.length > 0;
  if (isNewFormat) {
    const cats = categories ?? JSON.parse(JSON.stringify(job.canonicalJson.categories));
    const total = cats.reduce((a: number, c: any) => a + Number(c.weight || 0), 0);
    const setCat = (ci: number, patch: any) => { const next = [...cats]; next[ci] = { ...cats[ci], ...patch }; setCategories(next); };
    const setReq = (ci: number, ri: number, patch: any) => { const reqs = [...cats[ci].requirements]; reqs[ri] = { ...reqs[ri], ...patch }; setCat(ci, { requirements: reqs }); };
    const save = () => { void saveCategories({ jobId: job._id, categories: cats.map((c: any) => ({ key: String(c.key), label: String(c.label), weight: Number(c.weight) || 0, requirements: c.requirements.map((r: any) => ({ name: String(r.name), mandatory: !!r.mandatory, importance: Number(r.importance) || 0 })) })) }); setCategories(null); };
    return <div><BackLink href="/jobs">All job descriptions</BackLink><PageIntro eyebrow={`Job description / ${job.title}`} title="Canonical requirements" description="Parent categories and child requirements extracted by Gemini — weights, names and mandatory flags are fully editable." actions={<Button onClick={save} disabled={Math.abs(total - 100) > .5}><Check size={15} />Save policy</Button>} /><div className="grid gap-4 xl:grid-cols-2">{cats.map((cat: any, ci: number) => <section key={`${cat.key}-${ci}`} className="rounded-2xl border border-border bg-card p-5 panel-shadow"><div className="mb-3 flex items-center justify-between gap-3"><span className="text-[13px] font-bold capitalize">{cat.label}</span><label className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">WEIGHT<input type="number" min="0" max="100" value={cat.weight} onChange={(e) => setCat(ci, { weight: Number(e.target.value) })} className="w-20 rounded border border-input bg-background px-2 py-1 font-mono-ui text-[12px]" /></label></div><div className="space-y-2">{cat.requirements.map((req: any, ri: number) => <div key={`${req.name}-${ri}`} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-lg border border-border p-3 text-[12px]"><input value={req.name} onChange={(e) => setReq(ci, ri, { name: e.target.value })} className="min-w-0 bg-transparent outline-none" /><label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={req.mandatory} onChange={(e) => setReq(ci, ri, { mandatory: e.target.checked })} />Required</label><input type="number" min="0" max="1" step=".1" value={req.importance} onChange={(e) => setReq(ci, ri, { importance: Number(e.target.value) })} className="w-16 rounded border border-input bg-background px-2 py-1" /><button onClick={() => setCat(ci, { requirements: cat.requirements.filter((_: any, x: number) => x !== ri) })} className="text-[10px] text-muted-foreground hover:text-destructive">Remove</button></div>)}<button onClick={() => setCat(ci, { requirements: [...cat.requirements, { name: "New requirement", mandatory: false, importance: 0.5 }] })} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary"><Plus size={12} />Add requirement</button></div></section>)}</div><p className={`mt-4 font-mono-ui text-[11px] ${Math.abs(total - 100) < .5 ? "text-primary" : "text-destructive"}`}>Total weight: {Math.round(total)} / 100</p><Note>The category structure itself is chosen by Gemini per job description; adjust weights and children here before starting a matching run.</Note></div>;
  }
  const current: Record<string, number> = weights ?? (job.canonicalJson.weights as Record<string, number>); const skills = job.canonicalJson.skills ?? []; const other = job.canonicalJson.other ?? []; const total = Object.values(current).reduce((a, b) => a + Number(b), 0);
}

export function NewRunPage() {
  const pools = useQuery(api.pools.list) ?? []; const jobs = useQuery(api.jobs.list) ?? []; const start = useMutation(api.runs.start); const [key] = useGeminiKey(); const [, navigate] = useLocation(); const [poolId, setPoolId] = useState(""); const [jobId, setJobId] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => { if (!key || !poolId || !jobId) return; setBusy(true); try { const id = await start({ poolId: poolId as Id<"candidatePools">, jobId: jobId as Id<"jobDescriptions">, apiKey: key }); navigate(`/runs/${id}`); } finally { setBusy(false); } };
  return <div><BackLink href="/">Workspace overview</BackLink><PageIntro eyebrow="New matching run" title="Set the comparison context." description="Choose a real candidate pool and canonical job. Gemini will evaluate each requirement sequentially." /><section className="max-w-2xl rounded-2xl border border-border bg-card p-5 panel-shadow sm:p-7"><label className="mb-5 block text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">Candidate pool<select value={poolId} onChange={(e) => setPoolId(e.target.value)} className={`${inputClass} mt-2`}><option value="">Select a pool</option>{pools.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></label><label className="mb-6 block text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground">Canonical job<select value={jobId} onChange={(e) => setJobId(e.target.value)} className={`${inputClass} mt-2`}><option value="">Select a job</option>{jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}</select></label><KeyGate><Button onClick={() => void submit()} disabled={!key || !poolId || !jobId || busy} className="w-full"><Play size={15} fill="currentColor" />{busy ? "Starting…" : "Start matching run"}</Button></KeyGate></section><Note>Matching uses the Gemini key saved in Workspace settings</Note></div>;
}

export function RunsListPage() {
  const runs = useQuery(api.runs.list);
  if (runs === undefined) return <LoadingState />;
  return <div><PageIntro eyebrow="Match history" title="Review past matching sessions" description="Access previous matching runs to revisit candidate evaluations and decisions." /><div className="rounded-2xl border border-border bg-card panel-shadow">{runs.length ? <div className="divide-y divide-border">{runs.map((run) => <Link key={run._id} href={`/runs/${run._id}`} className="flex items-center justify-between p-5 hover:bg-secondary"><div><h3 className="text-[14px] font-bold">{run.jobTitle}</h3><p className="mt-1 text-[11px] text-muted-foreground">{run.poolName} · {run.candidateCount} candidates</p></div><div className="flex items-center gap-4 text-right"><span className={`text-[11px] font-semibold ${run.status === "COMPLETED" ? "text-primary" : "text-amber-600"}`}>{run.status}</span><span className="text-[11px] text-muted-foreground">{new Date(run.createdAt).toLocaleDateString()}</span><ChevronRight size={16} className="text-muted-foreground" /></div></Link>)}</div> : <EmptyState icon={History} title="No matching runs yet" description="Start a matching run from a candidate pool to begin tracking your history." action={<Link href="/runs/new" className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-[12px] font-semibold">Start a matching run</Link>} />}</div><Note>All run data is persisted in Convex</Note></div>;
}

// Mirrors convex/scoring.ts normalizeJd for UI rendering.
export function normalizeJdCategories(canonicalJson: any): { key: string; label: string; weight: number; requirements: any[] }[] {
  if (!canonicalJson) return [];
  if (Array.isArray(canonicalJson.categories) && canonicalJson.categories.length) {
    return canonicalJson.categories.map((c: any, i: number) => ({
      key: String(c.key ?? `category-${i + 1}`),
      label: String(c.label ?? c.key ?? `Category ${i + 1}`),
      weight: Number(c.weight) || 0,
      requirements: (Array.isArray(c.requirements) ? c.requirements : []).map((r: any) => ({ name: String(r.name ?? ""), mandatory: !!r.mandatory, importance: Number(r.importance) || 0 })),
    })).filter((c: any) => c.requirements.length);
  }
  const cats: any[] = []; const w = canonicalJson.weights || {};
  if (canonicalJson.skills?.length) cats.push({ key: "skill", label: "Skills", weight: Number(w.skills) || 0, requirements: canonicalJson.skills });
  if (canonicalJson.experience) cats.push({ key: "experience", label: "Experience", weight: Number(w.experience) || 0, requirements: [{ name: "experience", mandatory: canonicalJson.experience.mandatory ?? true, importance: 1 }] });
  if (canonicalJson.education) cats.push({ key: "education", label: "Education", weight: Number(w.education) || 0, requirements: [{ name: "education", mandatory: canonicalJson.education.mandatory ?? false, importance: 1 }] });
  if (canonicalJson.other?.length) cats.push({ key: "other", label: "Other", weight: Number(w.other) || 0, requirements: canonicalJson.other });
  return cats;
}
const reqIdOf = (categoryKey: string, requirementName: string) => `${categoryKey}::${requirementName}`.toLowerCase();

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const status = useQuery(api.runs.getStatus, { runId: id as Id<"runs"> });
  const results = useQuery(api.scoring.getResults, { runId: id as Id<"runs"> });
  const update = useMutation(api.runs.updatePolicy);
  const retry = useMutation(api.runs.retry);
  const [key] = useGeminiKey();
  const [tab, setTab] = useState("queue");
  const [selected, setSelected] = useState<any>(null);

  if (status === undefined || results === undefined) return <LoadingState />;
  if (status === null) return <ErrorState />;

  const done = status.queue.filter((q) => q.status === "DONE").length;
  const shown = tab === "queue" ? results.ranked : results.review.filter((x) => tab === "review" ? x.eligibility === "REVIEW" : x.eligibility === "INELIGIBLE");
  const policy = status.run.weights;
  const categoryWeights: Record<string, number> | undefined = status.run.categoryWeights;
  const groups = normalizeJdCategories(status.job?.canonicalJson);

  const isNameActive = (names: string[], target: string) => names.some((n: string) => n.toLowerCase() === target.toLowerCase());
  const isChildActive = (catKey: string, name: string) => {
    const names: string[] = status.run.activeRequirementNames || [];
    return isNameActive(names, reqIdOf(catKey, name)) || isNameActive(names, name);
  };

  // Tolerates legacy flat-name entries: removing drops every case variant,
  // adding records the composite "categoryKey::name" form.
  const applyToggle = (nextNames: string[]) => {
    void update({
      runId: id as Id<"runs">,
      ...(categoryWeights !== undefined ? { categoryWeights } : { weights: policy }),
      activeSkillNames: status.run.activeSkillNames,
      activeRequirementNames: nextNames,
    });
  };
  const toggleChild = (catKey: string, reqName: string) => {
    const current: string[] = status.run.activeRequirementNames || [];
    const composite = reqIdOf(catKey, reqName);
    applyToggle(isChildActive(catKey, reqName)
      ? current.filter((n: string) => n.toLowerCase() !== composite && n.toLowerCase() !== reqName.toLowerCase())
      : [...current, composite]);
  };
  const toggleGroup = (group: { key: string; requirements: any[] }) => {
    const current: string[] = status.run.activeRequirementNames || [];
    const allActive = group.requirements.every((r: any) => isChildActive(group.key, r.name));
    if (allActive) {
      applyToggle(current.filter((n: string) => !group.requirements.some((r: any) => n.toLowerCase() === reqIdOf(group.key, r.name) || n.toLowerCase() === r.name.toLowerCase())));
    } else {
      const additions = group.requirements.filter((r: any) => !isChildActive(group.key, r.name)).map((r: any) => reqIdOf(group.key, r.name));
      applyToggle([...current, ...additions]);
    }
  };

  return (
    <div>
      <BackLink href="/runs">Match history</BackLink>
      <PageIntro eyebrow={`Matching run / ${status.job?.title ?? ""}`} title="Review queue" description="Watch the live queue, inspect deterministic scores, and open evidence for each candidate." actions={<Button variant="secondary" onClick={() => window.location.reload()}><RefreshCw size={15} />Refresh</Button>} />
      <div className="mb-7 grid gap-3 sm:grid-cols-4">
        <StatTile label="Run status" value={status.run.status} detail="Reactive Convex status" />
        <StatTile label="Candidates" value={String(status.queue.length)} detail={`${done} complete`} tone="amber" />
        <StatTile label="Ranked" value={String(results.ranked.length)} detail="Eligible candidates" tone="ink" />
        <StatTile label="Review" value={String(results.review.length)} detail="Needs human attention" />
      </div>
      <div className="mb-5 flex gap-1 border-b border-border">
        {["queue", "review", "excluded"].map((name) => <button key={name} onClick={() => setTab(name)} className={`border-b-2 px-3 py-3 text-[12px] font-bold capitalize ${tab === name ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{name}</button>)}
      </div>
      <div className="grid gap-7 xl:grid-cols-[1.2fr_.8fr]">
        <section>
          {shown.length ? (
            <div className="space-y-2">
              {shown.map((row: any, index: number) => (
                <button key={row.candidateId} onClick={() => setSelected(row)} className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left hover:border-primary">
                  <div className="flex items-center gap-3">
                    <span className="font-mono-ui text-[11px] text-muted-foreground">{tab === "queue" ? String(index + 1).padStart(2, "0") : "—"}</span>
                    <span>
                      <span className="block text-[13px] font-bold">{row.candidate?.name || row.candidate?.email || "Unnamed candidate"}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{row.eligibility} · {row.reviewReasons?.length ? row.reviewReasons.slice(0, 1).join(" ") + (row.reviewReasons.length > 1 ? ` +${row.reviewReasons.length - 1} more` : "") : ""}</span>
                    </span>
                  </div>
                  <span className="font-mono-ui text-[14px] text-primary">{Math.round(row.finalScore)}%</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileSearch} title={tab === "queue" ? "The ranked queue is empty" : "No candidates in this bucket"} description="Queue activity and scores will appear as matching completes." />
          )}
        </section>
        <aside className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 panel-shadow">
            <SectionLabel>Requirements</SectionLabel>
            <div className="space-y-4">
              {groups.map((group: any) => {
                const allActive = group.requirements.every((r: any) => isChildActive(group.key, r.name));
                return (
                  <div key={group.key} className="rounded-xl border border-border">
                    <label className="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-3 py-2.5 cursor-pointer">
                      <span className="flex items-center gap-2.5">
                        <input type="checkbox" checked={allActive} onChange={() => toggleGroup(group)} className="rounded border-input" />
                        <span className="text-[12px] font-bold">{group.label}</span>
                        <span className="font-mono-ui text-[10px] text-muted-foreground">{Math.round(group.weight)}%</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">{group.requirements.filter((r: any) => isChildActive(group.key, r.name)).length}/{group.requirements.length} active</span>
                    </label>
                    <div className="space-y-1 p-2">
                      {group.requirements.map((req: any, i: number) => (
                        <label key={`${req.name}-${i}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary cursor-pointer">
                          <input type="checkbox" checked={isChildActive(group.key, req.name)} onChange={() => toggleChild(group.key, req.name)} className="rounded border-input" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-semibold capitalize">{req.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${req.mandatory ? "bg-destructive/20 text-destructive" : "bg-secondary text-muted-foreground"}`}>{req.mandatory ? "Required" : "Optional"}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">importance {Number(req.importance ?? 0).toFixed(2)}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-5 panel-shadow">
            <SectionLabel>Run policy</SectionLabel>
            {Object.entries(categoryWeights ?? {}).map(([name, value]) => <div key={name} className="mb-3 flex justify-between text-[12px]"><span>{name}</span><span className="font-mono-ui">{String(value)}%</span></div>)}
            {!categoryWeights && Object.entries(policy).map(([name, value]) => <div key={name} className="mb-3 flex justify-between text-[12px] capitalize"><span>{name}</span><span className="font-mono-ui">{String(value)}%</span></div>)}
            <Button variant="secondary" className="mt-3 w-full" onClick={() => void update({ runId: id as Id<"runs">, ...(categoryWeights !== undefined ? { categoryWeights } : { weights: policy }), activeSkillNames: status.run.activeSkillNames })}><Scale size={15} />Recalculate scores</Button>
          </section>
          {selected && <EvidencePanel runId={id as Id<"runs">} candidateId={selected.candidateId} candidate={selected.candidate} queueItem={status.queue.find((q: any) => q.candidateId === selected.candidateId)} onRetry={(queueId) => void retry({ queueId, apiKey: key! })} onClose={() => setSelected(null)} />}
        </aside>
      </div>
      <Note>Live queue: {status.queue.map((q) => `${q.candidate?.name || "Candidate"} ${q.status}`).join(" · ") || "No queue items"}</Note>
    </div>
  );
}

function EvidencePanel({ runId, candidateId, candidate, queueItem, onRetry, onClose }: { runId: Id<"runs">; candidateId: Id<"candidates">; candidate: any; queueItem?: any; onRetry?: (queueId: Id<"matchQueue">) => void; onClose: () => void }) {
  const rows = useQuery(api.matching.getAssessments, { runId, candidateId }) ?? [];
  const results = useQuery(api.scoring.getResults, { runId }) ?? { ranked: [], review: [] };
  const candidateResult = results.review.find((r: any) => r.candidateId === candidateId);

  return (
    <section className="rounded-2xl border border-primary/30 bg-card p-5 panel-shadow">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <SectionLabel>Evidence ledger</SectionLabel>
          <h3 className="text-[14px] font-bold">{candidate?.name || candidate?.email || "Candidate"}</h3>
        </div>
        <div className="flex items-center gap-3">
          {onRetry && queueItem && <button onClick={() => onRetry(queueItem._id)} title={queueItem.status === "DONE" ? "Re-run AI matching for this candidate" : `Queue status: ${queueItem.status}`} className="text-[11px] font-semibold text-primary hover:text-primary/80">↻ Re-judge</button>}
          <button onClick={onClose} className="text-[11px] text-muted-foreground">Close</button>
        </div>
      </div>

      {candidateResult?.reviewReasons && candidateResult.reviewReasons.length > 0 && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3">
          <SectionLabel className="text-[11px] text-destructive">Eligibility reasons</SectionLabel>
          <ul className="mt-2 space-y-1">
            {candidateResult.reviewReasons.map((reason: string, i: number) => (
              <li key={i} className="text-[11px] text-destructive">✗ {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row: any) => (
            <div key={row._id} className="border-t border-border pt-3">
              <div className="flex justify-between text-[11px] font-bold">
                <span>
                  {row.requirementName}
                  {row.flag && <span title={row.flag === "uniform_anomaly" ? "Manipulation pattern detected" : "Claim not supported by the candidate document"} className="ml-2 rounded bg-destructive/20 px-1.5 py-0.5 text-[9px] text-destructive">⚠ {row.flag === "uniform_anomaly" ? "manipulation" : "unsupported"}</span>}
                </span>
                <span className="font-mono-ui text-primary">{row.result} · {Math.round(row.confidence * 100)}%</span>
              </div>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{row.evidence || "No evidence returned."} {row.reason}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">No assessments yet.</p>
      )}
    </section>
  );
}
