import { PIPELINE_STAGE_LABELS, STAGE_BADGE_CLASSES, type PipelineStage } from "@/types";

interface StageBadgeProps {
  stage: PipelineStage;
  className?: string;
}

export function StageBadge({ stage, className = "" }: StageBadgeProps) {
  const { bg, text } = STAGE_BADGE_CLASSES[stage] ?? { bg: "bg-zinc-100", text: "text-zinc-600" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bg} ${text} ${className}`}
    >
      {PIPELINE_STAGE_LABELS[stage]}
    </span>
  );
}
