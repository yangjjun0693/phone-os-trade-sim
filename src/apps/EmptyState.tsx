import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

/** Shared empty/placeholder panel used by every stub app for now. */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-ios-surface shadow-sm">
        <Icon className="size-7 text-ios-muted" aria-hidden />
      </div>
      <p className="text-[17px] font-semibold">{title}</p>
      {description ? <p className="max-w-64 text-[13px] text-ios-muted">{description}</p> : null}
    </div>
  );
}
