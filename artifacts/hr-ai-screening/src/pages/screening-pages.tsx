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
  const { id } = useParams<{ id: string }>(); const poolId = id as Id<"candidatePools">; const data = useQuery(api.pools.get, { poolId }); const uploadUrl = useMutation(api.storage.generateUploadUrl); const upload = useAction(api.pools.uploadCvs); const uploadText = useAction(api.pools.uploadCvFromText); const add = useMutation(api.pools.addMember); const remove = useMutation(api.pools.removeMember); const candidates = useQuery(api.candidates.search, { query: "" }) ?? []; const [key] = useGeminiKey(); const [files, setFiles] = useState<File[]>([]); const [rawText, setRawText] = useState(""); const [inputMode, setInputMode] = useState<"file" | "text">("file"); const [search, setSearch] = useState(""); const [busy, setBusy] = useState(false);
  if (data === undefined) return <LoadingState />; if (data === null) return <ErrorState />;
  const choose = (e: ChangeEvent<HTMLInputElement>) => setFiles(Array.from(e.target.files ?? []));
  const extract = async () => { if (!key || !files.length) return; setBusy(true); try { const ids = []; for (const file of files) { const url = await uploadUrl(); const result = await fetch(url, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file }); const json = await result.json(); ids.push(json.storageId as Id<"_storage">); } await upload({ poolId, storageIds: ids, apiKey: key }); setFiles([]); } finally { setBusy(false); } };
  const extractFromText = async () => { if (!key || !rawText.trim()) return; setBusy(true); try { await uploadText({ poolId, rawText, apiKey: key }); setRawText(""); } finally { setBusy(false); } };
  const existing = candidates.filter((c) => !data.members.some((m) => m.candidateId === c._id) && [c.name, c.email, ...c.skills].filter(Boolean).some((x) => x!.toLowerCase().includes(search.toLowerCase()))).slice(0, 5);
  return <div><BackLink href="/pools">All candidate pools</BackLink><PageIntro eyebrow={`Candidate pool / ${data.pool.name}`} title="Pool members" description="Upload PDF/TXT CVs or paste CV text to extract structured evidence with Gemini." actions={<div className="flex gap-2"><label className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-4 text-[13px] font-bold ${inputMode === "file" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-secondary"}`}><UploadCloud size={16} />Choose CVs<input type="file" accept=".pdf,.txt" multiple className="sr-only" onChange={(e) => { choose(e); setInputMode("file"); }} /></label><Button variant={inputMode === "text" ? "primary" : "secondary"} onClick={() => setInputMode("text")}><FileText size={16} />Paste CV</Button></div>} />{inputMode === "file" && files.length > 0 && <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"><span className="text-[12px] font-semibold">{files.length} file(s) ready</span><KeyGate><Button onClick={() => void extract()} disabled={busy || !key}>{busy ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />} {busy ? "Extracting…" : "Upload & extract"}</Button></KeyGate></div>}{inputMode === "text" && <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 p-5"><textarea value={rawText} onChange={(e) => setRawText(e.target.value)} className="min-h-[220px] w-full rounded-lg border border-input bg-card p-3 text-[13px] leading-6 outline-none focus:border-primary" placeholder="Paste the complete CV/resume text" /><div className="mt-3 flex gap-2"><KeyGate><Button onClick={() => void extractFromText()} disabled={busy || !rawText.trim()}>{busy ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />} {busy ? "Extracting…" : "Extract from text"}</Button></KeyGate><Button variant="secondary" onClick={() => { setRawText(""); setInputMode("file"); }}>Cancel</Button></div></div>}<div className="mb-7 grid gap-3 sm:grid-cols-3"><StatTile label="Members" value={String(data.members.length)} detail="Pool records" /><StatTile label="Extracted" value={String(data.members.length)} detail="Structured profiles" tone="amber" /><StatTile label="Needs review" value="—" detail="Run matching to assess" tone="ink" /></div><SectionLabel>Pool members</SectionLabel>{data.members.length ? <div className="space-y-2">{data.members.map((member) => <div key={member._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4"><div><p className="text-[13px] font-bold">{member.candidate?.name || member.candidate?.email || "Unnamed candidate"}</p><p className="mt-1 text-[11px] text-muted-foreground">{member.candidate?.totalYearsExperience ?? 0} years · {member.candidate?.skills.slice(0, 4).join(", ")}</p></div><Button variant="quiet" onClick={() => void remove({ poolId, candidateId: member.candidateId })}>Remove</Button></div>)}</div> : <EmptyState icon={FileSearch} title="No members in this pool" description="Upload PDF/TXT CV files or paste CV text to extract candidates." />}<div className="mt-8 rounded-2xl border border-border bg-card p-5"><SectionLabel>Add existing candidate</SectionLabel><div className="relative"><Search size={15} className="absolute left-3 top-3 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} pl-9`} placeholder="Search candidates" /></div>{search && existing.map((candidate) => <button key={candidate._id} onClick={() => { void add({ poolId, candidateId: candidate._id }); setSearch(""); }} className="mt-2 block w-full rounded-lg border border-border p-3 text-left text-[12px] hover:border-primary">{candidate.name || candidate.email || "Unnamed candidate"}</button>)}</div><Note>Original documents stay attached to every extracted record</Note></div>;
}

export function JobsPage() {
  const jobs = useQuery(api.jobs.list); const extract = useAction(api.jobs.extractJd); const [key] = useGeminiKey(); const [open, setOpen] = useState(false); const [rawText, setRawText] = useState(""); const [busy, setBusy] = useState(false);
  if (jobs === undefined) return <LoadingState />;
  const submit = async () => { if (!key || !rawText.trim()) return; setBusy(true); try { await extract({ rawText, apiKey: key }); setRawText(""); setOpen(false); } finally { setBusy(false); } };
  return <div><PageIntro eyebrow="Job descriptions" title="Define the bar before the model sees it." description="Paste a real job description and review the canonical requirements Gemini extracts." actions={<KeyGate><Button onClick={() => setOpen(!open)} disabled={!key}><Plus size={15} />Create job</Button></KeyGate>} />{open && <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 p-5"><textarea value={rawText} onChange={(e) => setRawText(e.target.value)} className="min-h-[220px] w-full rounded-lg border border-input bg-card p-3 text-[13px] leading-6 outline-none focus:border-primary" placeholder="Paste the complete job description" /><div className="mt-3 flex gap-2"><Button onClick={() => void submit()} disabled={busy || !rawText.trim()}>{busy ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />} {busy ? "Extracting…" : "Extract requirements"}</Button><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button></div></div>}{jobs.length ? <div className="space-y-3">{jobs.map((job) => <Link href={`/jobs/${job._id}`} key={job._id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 panel-shadow hover:border-primary"><div><h3 className="text-[14px] font-bold">{job.title}</h3><p className="mt-1 text-[11px] text-muted-foreground">{job.canonicalJson.skills?.length ?? 0} extracted skills · {new Date(job.createdAt).toLocaleDateString()}</p></div><ChevronRight size={17} className="text-muted-foreground" /></Link>)}</div> : <EmptyState icon={BriefcaseBusiness} title="No job descriptions yet" description="Create one from a real job description." action={<KeyGate><Button variant="secondary" onClick={() => setOpen(true)} disabled={!key}><Plus size={15} />Add a job description</Button></KeyGate>} />}<Note>Canonical requirements are saved as the Gemini response in Convex</Note></div>;
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>(); const job = useQuery(api.jobs.get, { jobId: id as Id<"jobDescriptions"> }); const saveWeights = useMutation(api.jobs.updateWeights); const saveSkills = useMutation(api.jobs.updateSkills); const [weights, setWeights] = useState<Record<string, number> | null>(null);
  if (job === undefined) return <LoadingState />; if (job === null) return <ErrorState />;
  const current: Record<string, number> = weights ?? (job.canonicalJson.weights as Record<string, number>); const skills = job.canonicalJson.skills ?? []; const other = job.canonicalJson.other ?? []; const total = Object.values(current).reduce((a, b) => a + Number(b), 0);
  return <div><BackLink href="/jobs">All job descriptions</BackLink><PageIntro eyebrow={`Job description / ${job.title}`} title="Canonical requirements" description="Review and save the policy extracted from the source job description." actions={<Button onClick={() => { void saveWeights({ jobId: job._id, weights: { experience: Number(current.experience), skills: Number(current.skills), education: Number(current.education), other: Number(current.other) } }); void saveSkills({ jobId: job._id, skills }); setWeights(null); }} disabled={Math.abs(total - 100) > .01}><Check size={15} />Save policy</Button>} /><div className="grid gap-7 xl:grid-cols-[.8fr_1.2fr]"><section className="rounded-2xl border border-border bg-card p-5 panel-shadow"><SectionLabel>Category weights</SectionLabel>{Object.entries(current).map(([name, value]) => <label key={name} className="mb-4 block text-[12px] font-semibold capitalize">{name}<input type="number" min="0" max="100" value={value} onChange={(e) => setWeights({ ...current, [name]: Number(e.target.value) })} className={`${inputClass} mt-2`} /></label>)}<p className={`font-mono-ui text-[11px] ${Math.abs(total - 100) < .01 ? "text-primary" : "text-destructive"}`}>Total: {total} / 100</p></section><section className="rounded-2xl border border-border bg-card p-5 panel-shadow"><SectionLabel>Skills and requirements</SectionLabel>{skills.length ? <div className="space-y-2">{skills.map((skill: any, i: number) => <div key={`${skill.name}-${i}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-border p-3 text-[12px]"><input value={skill.name} onChange={(e) => { const next = [...skills]; next[i] = { ...skill, name: e.target.value }; setWeights(current); job.canonicalJson.skills = next; }} className="min-w-0 bg-transparent outline-none" /><label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={skill.mandatory} onChange={(e) => { const next = [...skills]; next[i] = { ...skill, mandatory: e.target.checked }; job.canonicalJson.skills = next; setWeights(current); }} />Required</label><input type="number" min="0" max="1" step=".1" value={skill.importance} onChange={(e) => { const next = [...skills]; next[i] = { ...skill, importance: Number(e.target.value) }; job.canonicalJson.skills = next; setWeights(current); }} className="w-16 rounded border border-input bg-background px-2 py-1" /></div>)}</div> : <EmptyState icon={FileSearch} title="No skills extracted" description="The source job description did not return skills." />}{other.length > 0 && <><SectionLabel className="mt-6">Other requirements</SectionLabel><div className="space-y-2">{other.map((item: any, i: number) => <div key={`${item.name}-${i}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-border p-3 text-[12px]"><input value={item.name} onChange={(e) => { const next = [...other]; next[i] = { ...item, name: e.target.value }; setWeights(current); job.canonicalJson.other = next; }} className="min-w-0 bg-transparent outline-none" /><label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={item.mandatory} onChange={(e) => { const next = [...other]; next[i] = { ...item, mandatory: e.target.checked }; job.canonicalJson.other = next; setWeights(current); }} />Required</label><input type="number" min="0" max="1" step=".1" value={item.importance} onChange={(e) => { const next = [...other]; next[i] = { ...item, importance: Number(e.target.value) }; job.canonicalJson.other = next; setWeights(current); }} className="w-16 rounded border border-input bg-background px-2 py-1" /></div>)}</div></>}</section></div><Note>Weights must sum to 100 before saving</Note></div>;
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

  const requirements = [
    ...(status.job?.canonicalJson.skills || []).map((s: any) => ({ name: s.name, mandatory: s.mandatory, importance: s.importance, category: "skill" })),
    { name: "experience", mandatory: status.job?.canonicalJson.experience?.mandatory ?? true, importance: 1, category: "experience" },
    { name: "education", mandatory: status.job?.canonicalJson.education?.mandatory ?? false, importance: 1, category: "education" },
    ...(status.job?.canonicalJson.other || []).map((o: any) => ({ name: o.name, mandatory: o.mandatory, importance: o.importance, category: "other" })),
  ];

  const isActive = (names: string[], name: string) => names.some((n: string) => n.toLowerCase() === name.toLowerCase());

  const toggleRequirement = (requirementName: string) => {
    const currentRequirementNames = status.run.activeRequirementNames || [];
    const currentSkillNames = status.run.activeSkillNames || [];

    // Find the requirement to determine its category
    const requirement = requirements.find((r: any) => r.name === requirementName);
    const isSkill = requirement?.category === "skill";

    // Update activeRequirementNames (for ALL requirements), matching case-insensitively
    // so stale entries like "Experience" are removed together with "experience".
    const nextRequirementNames = isActive(currentRequirementNames, requirementName)
      ? currentRequirementNames.filter((n: string) => n.toLowerCase() !== requirementName.toLowerCase())
      : [...currentRequirementNames, requirementName];

    // Update activeSkillNames only for skills
    const nextSkillNames = isSkill
      ? (isActive(currentSkillNames, requirementName)
          ? currentSkillNames.filter((n: string) => n.toLowerCase() !== requirementName.toLowerCase())
          : [...currentSkillNames, requirementName])
      : currentSkillNames;

    void update({ runId: id as Id<"runs">, weights: policy, activeSkillNames: nextSkillNames, activeRequirementNames: nextRequirementNames });
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
            <div className="space-y-2">
              {requirements.map((req: any) => (
                <label key={req.name} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary cursor-pointer">
                  <input type="checkbox" checked={isActive(status.run.activeRequirementNames || [], req.name)} onChange={() => toggleRequirement(req.name)} className="rounded border-input" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold">{req.name.charAt(0).toUpperCase() + req.name.slice(1)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${req.mandatory ? "bg-destructive/20 text-destructive" : "bg-secondary text-muted-foreground"}`}>{req.mandatory ? "Required" : "Optional"}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{req.category} · {req.importance.toFixed(2)}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-5 panel-shadow">
            <SectionLabel>Run policy</SectionLabel>
            {Object.entries(policy).map(([name, value]) => <div key={name} className="mb-3 flex justify-between text-[12px] capitalize"><span>{name}</span><span className="font-mono-ui">{String(value)}%</span></div>)}
            <Button variant="secondary" className="mt-3 w-full" onClick={() => void update({ runId: id as Id<"runs">, weights: policy, activeSkillNames: status.run.activeSkillNames })}><Scale size={15} />Recalculate scores</Button>
          </section>
          {selected && <EvidencePanel runId={id as Id<"runs">} candidateId={selected.candidateId} candidate={selected.candidate} onClose={() => setSelected(null)} />}
        </aside>
      </div>
      <Note>Live queue: {status.queue.map((q) => `${q.candidate?.name || "Candidate"} ${q.status}`).join(" · ") || "No queue items"}</Note>
    </div>
  );
}

function EvidencePanel({ runId, candidateId, candidate, onClose }: { runId: Id<"runs">; candidateId: Id<"candidates">; candidate: any; onClose: () => void }) {
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
        <button onClick={onClose} className="text-[11px] text-muted-foreground">Close</button>
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
                <span>{row.requirementName}</span>
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