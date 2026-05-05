'use client';

import { useState } from 'react';
import { Mic, Home, ListChecks, User, Plus } from 'lucide-react';
import { VoiceModal } from './voice-modal';
import { cn } from '@/lib/utils';

export function HomeShell({ children }: { children: React.ReactNode }) {
  const [voiceOpen, setVoiceOpen] = useState(false);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex md:flex-col md:gap-1 md:border-r md:border-border md:bg-card md:p-4">
        <div className="mb-6 flex items-center gap-2 px-2 py-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-fg text-lg font-bold">
            ⚡
          </span>
          <span className="font-semibold tracking-tight">Notion Pulse</span>
        </div>

        <NavItem icon={<Home size={18} />} label="Today" active />
        <NavItem icon={<ListChecks size={18} />} label="All lists" />
        <NavItem icon={<User size={18} />} label="Profile" />

        <button
          onClick={() => setVoiceOpen(true)}
          className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-primary-fg shadow-md shadow-primary/20 transition-transform active:scale-[.98]"
        >
          <Mic size={18} /> Create by voice
        </button>
      </aside>

      {/* Main */}
      <main className="relative pb-32 md:pb-12">
        {children}

        {/* Mobile FAB */}
        <button
          onClick={() => setVoiceOpen(true)}
          className="fixed bottom-24 right-5 z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-fg shadow-lg shadow-primary/40 transition-transform active:scale-95 md:hidden"
          aria-label="Create by voice"
        >
          <Mic size={22} />
        </button>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-bg/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur md:hidden">
          <BottomItem icon={<Home size={20} />} label="Today" active />
          <BottomItem icon={<ListChecks size={20} />} label="Lists" />
          <BottomItem icon={<User size={20} />} label="Profile" />
        </nav>
      </main>

      <VoiceModal open={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-fg' : 'text-muted hover:bg-bg hover:text-fg'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function BottomItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={cn('flex flex-col items-center gap-1 px-4 py-1 text-[10px] font-medium', active ? 'text-primary' : 'text-muted')}>
      {icon}
      {label}
    </button>
  );
}
