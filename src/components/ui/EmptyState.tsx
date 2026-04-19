interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="text-4xl">🎯</div>
      <p className="font-medium text-neutral-700">{title}</p>
      {description && <p className="max-w-xs text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
