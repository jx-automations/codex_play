export const STAGES = [
  "Prospect Found",
  "First DM Sent",
  "Follow-Up 1 Sent",
  "Follow-Up 2 Sent",
  "Follow-Up 3 Sent",
  "Left on Read",
  "Replied — Interested",
  "Replied — Objection",
  "In Conversation",
  "Call Scheduled",
  "Won",
  "Lost/Not Interested",
] as const;

export const STAGE_ACCENTS: Record<string, string> = {
  "Prospect Found": "#94a3b8",
  "First DM Sent": "#60a5fa",
  "Follow-Up 1 Sent": "#38bdf8",
  "Follow-Up 2 Sent": "#22d3ee",
  "Follow-Up 3 Sent": "#2dd4bf",
  "Left on Read": "#f59e0b",
  "Replied — Interested": "#a78bfa",
  "Replied — Objection": "#fb923c",
  "In Conversation": "#f472b6",
  "Call Scheduled": "#facc15",
  "Won": "#22c55e",
  "Lost/Not Interested": "#64748b",
};

export const PLATFORMS = [
  "Instagram",
  "LinkedIn",
  "Twitter/X",
  "TikTok",
  "Other",
] as const;

export const PAGE_TITLES = {
  today: "Today",
  prospects: "Prospects",
  log: "Log Outreach",
  analytics: "Analytics",
  settings: "Settings",
} as const;

export const NAV_ITEMS = [
  { href: "/app/today", key: "today", label: "Today", shortLabel: "TD", description: "What needs action now" },
  { href: "/app/prospects", key: "prospects", label: "Prospects", shortLabel: "PR", description: "Pipeline and search" },
  { href: "/app/log", key: "log", label: "Log", shortLabel: "LG", description: "Add a new lead" },
  { href: "/app/settings", key: "settings", label: "Settings", shortLabel: "ST", description: "Targets, backup, and sync" },
] as const;

export const DEFAULT_SETTINGS = {
  dailyTarget: 20,
  followUpHours: 48,
};

export const SETTINGS_STORAGE_KEY = "jx_settings";

export const LOG_TYPE_OPTIONS = [
  { value: "dm-sent", label: "DM sent" },
  { value: "they-replied", label: "They replied" },
  { value: "note", label: "Note" },
  { value: "stage-change", label: "Stage change" },
  { value: "other", label: "Other" },
] as const;

// Migration map for old stage names → new stage names
const OLD_STAGE_MAP: Record<string, string> = {
  "Researched": "Prospect Found",
  "Engaged": "Prospect Found",
  "DM Sent": "First DM Sent",
  "Seen No Reply": "Left on Read",
  "Replied": "Replied — Interested",
  "Pitched": "In Conversation",
  "Mockup Requested": "In Conversation",
  "Mockup Sent": "In Conversation",
  "Negotiating": "In Conversation",
  "Closed Won": "Won",
  "Closed Lost": "Lost/Not Interested",
  "Ghosted": "Lost/Not Interested",
  "No reply": "Left on Read",
  "Seen no reply": "Left on Read",
  "Followed up": "First DM Sent",
  "Not interested": "Lost/Not Interested",
  "Interested in mockup": "In Conversation",
  "Mockup sent": "In Conversation",
  "Closed": "Won",
  "Lost after mockup": "Lost/Not Interested",
};

export type Stage = (typeof STAGES)[number];
export type Platform = (typeof PLATFORMS)[number];
export type PageKey = keyof typeof PAGE_TITLES;

export interface StageHistoryEntry {
  stage: string;
  timestamp: string;
  note: string;
}

export interface ConversationLogEntry {
  id: string;
  timestamp: string;
  type: string;
  text: string;
  link: string;
}

export interface Prospect {
  id: string;
  userId: string;
  handle: string;
  fullName?: string;
  platform: string;
  dateContacted: string;
  currentStage: string;
  stageHistory: StageHistoryEntry[];
  conversationLog: ConversationLogEntry[];
  notes: string;
  lastActionDate: string;
  nextActionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProspectInput {
  handle: string;
  fullName?: string;
  platform: string;
  stage: string;
  dateContacted: string;
  nextActionDate: string;
  notes: string;
}

export interface ProspectFieldUpdate {
  handle?: string;
  fullName?: string;
  platform?: string;
  notes?: string;
  nextActionDate?: string;
}

export interface UserSettings {
  dailyTarget: number;
  followUpHours: number;
  updatedAt?: string;
  migratedFromLocalStorage?: boolean;
}

export interface WeeklyMetrics {
  sent: number;
  replied: number;
  won: number;
  replyRate: string;
  winRate: string;
}

export interface TodaySection {
  id: string;
  title: string;
  subtitle: string;
  prospects: Prospect[];
  emptyMessage: string;
}

export interface AnalyticsResult {
  totalProspects: number;
  thisWeek: WeeklyMetrics;
  lastWeek: WeeklyMetrics;
  funnelRows: { stage: string; count: number; percent: number; accent: string }[];
}

export function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function todayString(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function weekStart(date = new Date()) {
  const copy = new Date(date);
  const diff = copy.getDay() === 0 ? 6 : copy.getDay() - 1;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function daysSince(value?: string | null) {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
}

export function hoursSince(value?: string | null) {
  if (!value) return 0;
  return Math.max(0, (Date.now() - new Date(value).getTime()) / 3600000);
}

export function normalizeHandle(handle?: string | null) {
  const raw = `${handle ?? ""}`.trim().replace(/^@+/, "");
  return raw ? `@${raw.toLowerCase()}` : "";
}

export function normalizeSettings(raw?: Partial<UserSettings> | null): UserSettings {
  return {
    dailyTarget: Number(raw?.dailyTarget) > 0 ? Number(raw?.dailyTarget) : DEFAULT_SETTINGS.dailyTarget,
    followUpHours: Number(raw?.followUpHours) > 0 ? Number(raw?.followUpHours) : DEFAULT_SETTINGS.followUpHours,
    updatedAt: raw?.updatedAt,
    migratedFromLocalStorage: Boolean(raw?.migratedFromLocalStorage),
  };
}

export function normalizeProspect(raw: (Record<string, unknown> | Prospect) & { id?: string }): Prospect {
  const currentStage = OLD_STAGE_MAP[`${raw.currentStage ?? ""}`] ?? `${raw.currentStage ?? "First DM Sent"}`;
  const createdAt = `${raw.createdAt ?? raw.updatedAt ?? new Date().toISOString()}`;
  const updatedAt = `${raw.updatedAt ?? createdAt}`;
  const stageHistory = Array.isArray(raw.stageHistory)
    ? (raw.stageHistory as StageHistoryEntry[]).map((entry) => ({
        stage: OLD_STAGE_MAP[`${entry.stage}`] ?? entry.stage ?? currentStage,
        timestamp: `${entry.timestamp ?? updatedAt}`,
        note: `${entry.note ?? ""}`,
      }))
    : [{ stage: currentStage, timestamp: updatedAt, note: "" }];
  const conversationLog = Array.isArray(raw.conversationLog)
    ? (raw.conversationLog as ConversationLogEntry[]).map((entry) => ({
        id: `${entry.id ?? createId()}`,
        timestamp: `${entry.timestamp ?? updatedAt}`,
        type: `${entry.type ?? "other"}`,
        text: `${entry.text ?? ""}`,
        link: `${entry.link ?? ""}`,
      }))
    : [];

  return {
    id: `${raw.id ?? createId()}`,
    userId: `${raw.userId ?? ""}`,
    handle: normalizeHandle(`${raw.handle ?? ""}`) || "@unnamed",
    fullName: raw.fullName ? `${raw.fullName}` : undefined,
    platform: `${raw.platform ?? "Instagram"}`,
    dateContacted: `${raw.dateContacted ?? todayString()}`,
    currentStage,
    stageHistory,
    conversationLog,
    notes: `${raw.notes ?? ""}`,
    lastActionDate: `${raw.lastActionDate ?? updatedAt}`,
    nextActionDate: `${raw.nextActionDate ?? ""}`,
    createdAt,
    updatedAt,
  };
}

export function createProspectRecord(userId: string, input: ProspectInput): Prospect {
  const now = new Date().toISOString();
  const stage = input.stage || "First DM Sent";
  const notes = input.notes?.trim() ?? "";
  const conversationLog: ConversationLogEntry[] = [
    {
      id: createId(),
      timestamp: now,
      type: "stage-change",
      text: `Prospect added in stage: ${stage}`,
      link: "",
    },
  ];

  if (notes) {
    conversationLog.push({
      id: createId(),
      timestamp: now,
      type: "note",
      text: notes,
      link: "",
    });
  }

  return {
    id: createId(),
    userId,
    handle: normalizeHandle(input.handle),
    fullName: input.fullName?.trim() || undefined,
    platform: input.platform || "Instagram",
    dateContacted: input.dateContacted,
    currentStage: stage,
    stageHistory: [{ stage, timestamp: now, note: notes }],
    conversationLog,
    notes,
    lastActionDate: now,
    nextActionDate: input.nextActionDate,
    createdAt: now,
    updatedAt: now,
  };
}

export function isReplyStage(stage: string) {
  return [
    "Replied — Interested",
    "Replied — Objection",
    "In Conversation",
    "Call Scheduled",
    "Won",
  ].includes(stage);
}

export function isClosedStage(stage: string) {
  return stage === "Won";
}

export function daysInStage(prospect: Prospect) {
  const latestStage = prospect.stageHistory[prospect.stageHistory.length - 1];
  if (!latestStage) return 0;
  return daysSince(latestStage.timestamp);
}

export function timeAgo(value?: string | null) {
  if (!value) return "Never";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(value);
}

const GOING_COLD_STAGES = [
  "First DM Sent",
  "Follow-Up 1 Sent",
  "Follow-Up 2 Sent",
  "Follow-Up 3 Sent",
  "Left on Read",
];

export function getTodaySections(prospects: Prospect[], settings: UserSettings): TodaySection[] {
  const today = todayString();
  const hot = prospects
    .filter((p) => ["Replied — Interested", "In Conversation", "Call Scheduled", "Replied — Objection"].includes(p.currentStage))
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  const followUpDue = prospects
    .filter((p) => p.nextActionDate && p.nextActionDate <= today)
    .sort((a, b) => a.nextActionDate.localeCompare(b.nextActionDate));
  const goingCold = prospects
    .filter((p) => GOING_COLD_STAGES.includes(p.currentStage) && hoursSince(p.lastActionDate || p.updatedAt) >= settings.followUpHours)
    .sort((a, b) => daysInStage(b) - daysInStage(a));
  const readyToDm = prospects
    .filter((p) => p.currentStage === "Prospect Found")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return [
    { id: "hot", title: "Hot leads", subtitle: "Conversations that need your reply now", prospects: hot, emptyMessage: "No active conversations waiting. All caught up." },
    { id: "followup", title: "Follow-up due", subtitle: "Scheduled follow-ups for today or earlier", prospects: followUpDue, emptyMessage: "Nothing is due today." },
    { id: "cold", title: "Going cold", subtitle: `No activity for ${settings.followUpHours}h — time to follow up`, prospects: goingCold, emptyMessage: "No leads are past the follow-up threshold." },
    { id: "ready", title: "Ready to DM", subtitle: "Prospects found but not yet messaged", prospects: readyToDm, emptyMessage: "No prospects waiting for a first DM." },
  ];
}

function toRate(top: number, bottom: number) {
  return bottom ? ((top / bottom) * 100).toFixed(1) : "0.0";
}

function dmDate(prospect: Prospect) {
  const entry = prospect.stageHistory.find((s) => s.stage === "First DM Sent");
  return entry ? new Date(entry.timestamp) : null;
}

function weeklyMetrics(prospects: Prospect[]): WeeklyMetrics {
  const sent = prospects.length;
  const replied = prospects.filter((p) => isReplyStage(p.currentStage)).length;
  const won = prospects.filter((p) => isClosedStage(p.currentStage)).length;
  return {
    sent,
    replied,
    won,
    replyRate: toRate(replied, sent),
    winRate: toRate(won, replied),
  };
}

export function buildAnalytics(prospects: Prospect[]): AnalyticsResult {
  const activeProspects = prospects.length || 1;
  const thisWeekStart = weekStart();
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const dmProspects = prospects.filter((p) => p.stageHistory.some((s) => s.stage === "First DM Sent"));
  const thisWeekProspects = dmProspects.filter((p) => {
    const date = dmDate(p);
    return date ? date >= thisWeekStart : false;
  });
  const lastWeekProspects = dmProspects.filter((p) => {
    const date = dmDate(p);
    return date ? date >= lastWeekStart && date < thisWeekStart : false;
  });
  const stageCounts = Object.fromEntries(STAGES.map((stage) => [stage, 0]));
  prospects.forEach((p) => {
    if (stageCounts[p.currentStage] !== undefined) stageCounts[p.currentStage] += 1;
  });

  return {
    totalProspects: prospects.length,
    thisWeek: weeklyMetrics(thisWeekProspects),
    lastWeek: weeklyMetrics(lastWeekProspects),
    funnelRows: STAGES.map((stage) => ({
      stage,
      count: stageCounts[stage],
      percent: Math.round((stageCounts[stage] / activeProspects) * 100),
      accent: STAGE_ACCENTS[stage] ?? "#94a3b8",
    })),
  };
}

export function buildCsv(prospects: Prospect[]) {
  const headers = ["Handle", "Name", "Platform", "Stage", "DateContacted", "NextFollowUp", "DaysInStage", "Notes", "CreatedAt"];
  const rows = prospects.map((p) => [
    p.handle,
    p.fullName ?? "",
    p.platform,
    p.currentStage,
    p.dateContacted,
    p.nextActionDate,
    daysInStage(p),
    p.notes,
    p.createdAt,
  ].map((v) => `"${`${v}`.replaceAll('"', '""')}"`).join(","));
  return [headers.join(","), ...rows].join("\n");
}

export function buildBackup(prospects: Prospect[], settings: UserSettings) {
  return JSON.stringify({ prospects, settings, exportedAt: new Date().toISOString() }, null, 2);
}

export function parseImportedBackup(text: string): { prospects: Prospect[]; settings?: UserSettings } {
  const raw = JSON.parse(text) as { prospects?: Record<string, unknown>[]; settings?: Partial<UserSettings> } | Record<string, unknown>[];
  const prospects = Array.isArray(raw) ? raw : raw.prospects;
  if (!Array.isArray(prospects)) {
    throw new Error("Invalid import format. Expected a JSON array or an object with a prospects array.");
  }
  return {
    prospects: prospects.map((p) => normalizeProspect(p as Record<string, unknown>)),
    settings: Array.isArray(raw) ? undefined : normalizeSettings(raw.settings),
  };
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function stageSortValue(stage: string) {
  const index = STAGES.indexOf(stage as Stage);
  return index === -1 ? STAGES.length : index;
}

export function platformProfileUrl(handle: string, platform: string): string | null {
  const raw = handle.replace(/^@/, "").trim();
  if (!raw) return null;
  switch (platform) {
    case "Instagram": return `https://instagram.com/${raw}`;
    case "LinkedIn":
      return raw.startsWith("http") ? raw : `https://linkedin.com/in/${raw}`;
    case "Twitter/X": return `https://x.com/${raw}`;
    case "TikTok": return `https://tiktok.com/@${raw}`;
    default: return null;
  }
}

export function urgencyLabel(nextActionDate: string | undefined): { text: string; level: "overdue" | "today" | "upcoming" } | null {
  if (!nextActionDate) return null;
  const today = todayString();
  if (nextActionDate < today) {
    const days = Math.max(1, Math.floor((Date.now() - new Date(nextActionDate).getTime()) / 86400000));
    return { text: `${days}d overdue`, level: "overdue" };
  }
  if (nextActionDate === today) return { text: "Due today", level: "today" };
  return null;
}
