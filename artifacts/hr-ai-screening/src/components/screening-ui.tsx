import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  FileSearch,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UsersRound,
  X,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useGeminiKey } from '@/hooks/use-gemini-key';

type IconType = typeof LayoutDashboard;

export const navItems: Array<{ href: string; label: string; icon: IconType }> = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/pools', label: 'Candidate pools', icon: UsersRound },
  { href: '/jobs', label: 'Job descriptions', icon: BriefcaseBusiness },
];

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  onClick,
  disabled = false,
  dataTestId,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  className?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  dataTestId?: string;
}) {
  const variants = {
    primary: 'bg-primary text-primary-foreground border-primary hover:brightness-95',
    secondary: 'bg-card text-foreground border-border hover:bg-secondary',
    quiet: 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground',
    danger: 'bg-destructive text-destructive-foreground border-destructive hover:brightness-95',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={dataTestId}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3.5 text-[13px] font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const activeHref = location === '/' ? '/' : location.startsWith('/pools') ? '/pools' : location.startsWith('/jobs') ? '/jobs' : '/';

  return (
    <div className="app-noise min-h-[100dvh] bg-background text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarOpen ? '' : 'md:w-[76px]'}`}
      >
        <div className={`flex h-[76px] items-center border-b border-sidebar-border px-5 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && (
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3" data-testid="link-brand">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <ShieldCheck size={20} strokeWidth={2.2} />
              </span>
              <span className="leading-none">
                <span className="block text-[15px] font-extrabold tracking-[-.03em]">clearframe</span>
                <span className="mt-1 block font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">evidence workspace</span>
              </span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen((open) => !open)}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/65 transition hover:bg-sidebar-accent hover:text-sidebar-foreground md:flex"
            data-testid="button-toggle-sidebar"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/65 hover:bg-sidebar-accent md:hidden" data-testid="button-close-mobile-nav" aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Primary navigation">
          <p className={`mb-3 px-3 font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/40 ${!sidebarOpen ? 'text-center' : ''}`}>{sidebarOpen ? 'Workspace' : '—'}</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition ${active ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/75 hover:text-sidebar-foreground'} ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {sidebarOpen && <span>{item.label}</span>}
                {active && sidebarOpen && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
              </Link>
            );
          })}
          <div className={`mt-7 border-t border-sidebar-border pt-6 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
            <p className={`mb-3 px-3 font-mono-ui text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/40 ${!sidebarOpen ? 'hidden' : ''}`}>Review</p>
            <Link href="/runs/new" onClick={() => setMobileOpen(false)} className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold text-sidebar-foreground/65 transition hover:bg-sidebar-accent/75 hover:text-sidebar-foreground ${!sidebarOpen ? 'justify-center px-0' : ''}`} data-testid="link-nav-new-run">
              <Sparkles size={18} strokeWidth={1.8} />
              {sidebarOpen && <span>Start a matching run</span>}
            </Link>
          </div>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button onClick={() => setSettingsOpen(true)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold text-sidebar-foreground/65 transition hover:bg-sidebar-accent hover:text-sidebar-foreground ${!sidebarOpen ? 'justify-center px-0' : ''}`} data-testid="button-open-settings">
            <Settings2 size={17} strokeWidth={1.8} />
            {sidebarOpen && <><span>Workspace settings</span><ChevronDown size={14} className="ml-auto rotate-[-90deg] opacity-50" /></>}
          </button>
          {sidebarOpen && <div className="mt-3 flex items-center gap-2 rounded-lg bg-sidebar-accent/60 px-3 py-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-primary font-mono-ui text-[10px] font-medium text-sidebar-primary-foreground">HR</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">Hiring workspace</span><span className="block truncate text-[10px] text-sidebar-foreground/45">BYOK connection</span></span><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /></div>}
        </div>
      </aside>

      {mobileOpen && <button onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-sidebar/35 backdrop-blur-[2px] md:hidden" aria-label="Close navigation overlay" data-testid="button-mobile-overlay" />}
      <div className={`min-h-[100dvh] transition-[padding] duration-300 ${sidebarOpen ? 'md:pl-[252px]' : 'md:pl-[76px]'}`}>
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground md:hidden" data-testid="button-open-mobile-nav" aria-label="Open navigation"><Menu size={18} /></button>
            <div className="hidden items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Decision support / <span className="text-foreground">Evidence first</span></div>
          </div>
          <button onClick={() => setSettingsOpen(true)} className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-left transition hover:bg-secondary" data-testid="button-open-settings-header">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8b963] font-mono-ui text-[10px] font-medium text-[#203138]">HR</span>
            <span className="hidden text-[11px] font-semibold sm:block">Workspace</span>
            <Settings2 size={14} className="text-muted-foreground" />
          </button>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">{children}</main>
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useGeminiKey();
  const [saved, setSaved] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="settings-title" data-testid="modal-settings">
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-border bg-card panel-shadow">
        <div className="flex items-start justify-between border-b border-border px-6 py-5"><div><div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary"><KeyRound size={18} /></div><h2 id="settings-title" className="text-lg font-bold tracking-[-.03em]">Workspace settings</h2><p className="mt-1 text-[12px] leading-5 text-muted-foreground">Connect your own Gemini key for document extraction and matching.</p></div><button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground" data-testid="button-close-settings" aria-label="Close settings"><X size={18} /></button></div>
        <div className="space-y-4 px-6 py-6"><label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[.11em] text-muted-foreground">Gemini API key</span><input value={key} onChange={(event) => { setKey(event.target.value); setSaved(false); }} type="password" placeholder="Paste your key" className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono-ui text-[12px] outline-none transition placeholder:text-muted-foreground/55 focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-gemini-key" /></label><div className="flex gap-3 rounded-lg border border-accent/25 bg-accent/10 p-3 text-[11px] leading-5 text-foreground/75"><CircleHelp size={15} className="mt-0.5 shrink-0 text-accent-foreground" /><span>Your key stays in this browser and is used only for your workspace requests.</span></div></div>
        <div className="flex items-center justify-between border-t border-border bg-secondary/45 px-6 py-4"><span className={`font-mono-ui text-[10px] uppercase tracking-[.12em] ${saved ? 'text-primary' : 'text-muted-foreground'}`}>{saved ? 'Key saved locally' : key ? 'Key connected' : 'No key connected'}</span><div className="flex gap-2"><Button variant="quiet" onClick={onClose} dataTestId="button-cancel-settings">Cancel</Button><Button variant="quiet" onClick={() => { setKey(''); setSaved(true); }} disabled={!key} dataTestId="button-clear-settings">Clear</Button><Button onClick={() => setSaved(true)} disabled={!key.trim()} dataTestId="button-save-settings">{saved && <Check size={15} />} Save key</Button></div></div>
      </div>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-9 flex flex-col justify-between gap-5 lg:flex-row lg:items-end animate-rise"><div><p className="mb-3 flex items-center gap-2 font-mono-ui text-[10px] font-medium uppercase tracking-[.19em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{eyebrow}</p><h1 className="text-balance text-[32px] font-extrabold leading-[1.1] tracking-[-.055em] text-foreground sm:text-[40px]">{title}</h1><p className="mt-3 max-w-[620px] text-[14px] leading-6 text-muted-foreground">{description}</p></div>{actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}</div>;
}

export function EmptyState({ icon: Icon = FileSearch, title, description, action }: { icon?: IconType; title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/55 px-6 py-10 text-center"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon size={22} strokeWidth={1.7} /></span><h3 className="text-[15px] font-bold tracking-[-.02em]">{title}</h3><p className="mt-2 max-w-[380px] text-[12px] leading-5 text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-2" aria-label="Loading"><span className="sr-only">Loading</span>{Array.from({ length: rows }).map((_, index) => <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4" key={index}><div className="skeleton h-9 w-9 rounded-lg" /><div className="flex-1 space-y-2"><div className="skeleton h-3 w-1/3 rounded" /><div className="skeleton h-2.5 w-2/3 rounded" /></div><div className="skeleton hidden h-3 w-16 rounded sm:block" /></div>)}</div>;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-10 text-center"><Archive size={22} className="mx-auto text-destructive" /><h3 className="mt-3 text-[14px] font-bold">Could not load this workspace view</h3><p className="mx-auto mt-2 max-w-[340px] text-[12px] leading-5 text-muted-foreground">Check the connection and try again. Your review data has not been changed.</p>{onRetry && <Button variant="secondary" onClick={onRetry} className="mt-5" dataTestId="button-retry-load">Try again</Button>}</div>;
}

export function StatTile({ label, value, detail, tone = 'teal' }: { label: string; value: string; detail: string; tone?: 'teal' | 'amber' | 'ink' }) {
  return <div className="rounded-xl border border-border bg-card p-5 panel-shadow"><div className={`mb-5 h-1 w-9 rounded-full ${tone === 'amber' ? 'bg-accent' : tone === 'ink' ? 'bg-foreground/70' : 'bg-primary'}`} /><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">{label}</p><p className="mt-2 font-mono-ui text-[26px] tracking-[-.06em] text-foreground">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div>;
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-[13px] font-bold tracking-[-.01em]"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{children}</h2>{action}</div>;
}

export function SearchField({ placeholder = 'Search workspace' }: { placeholder?: string }) {
  return <label className="relative block"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" placeholder={placeholder} className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-[12px] outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-search-workspace" /></label>;
}

export { ArrowLeft, ArrowRight, BriefcaseBusiness, FileSearch, FolderKanban, Plus, SlidersHorizontal, Upload };