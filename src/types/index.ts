export type PipelineStage =
  | 'prospect_found'
  | 'first_dm_sent'
  | 'followup_1_sent'
  | 'followup_2_sent'
  | 'followup_3_sent'
  | 'left_on_read'
  | 'replied_interested'
  | 'replied_objection'
  | 'in_conversation'
  | 'call_scheduled'
  | 'won'
  | 'lost';

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  prospect_found: 'Prospect Found',
  first_dm_sent: 'First DM Sent',
  followup_1_sent: 'Follow-Up 1 Sent',
  followup_2_sent: 'Follow-Up 2 Sent',
  followup_3_sent: 'Follow-Up 3 Sent',
  left_on_read: 'Left on Read',
  replied_interested: 'Replied — Interested',
  replied_objection: 'Replied — Objection',
  in_conversation: 'In Conversation',
  call_scheduled: 'Call Scheduled',
  won: 'Won',
  lost: 'Lost / Not Interested',
};

export const PIPELINE_STAGES: PipelineStage[] = [
  'prospect_found',
  'first_dm_sent',
  'followup_1_sent',
  'followup_2_sent',
  'followup_3_sent',
  'left_on_read',
  'replied_interested',
  'replied_objection',
  'in_conversation',
  'call_scheduled',
  'won',
  'lost',
];

export const FREE_TIER_STAGES: PipelineStage[] = [
  'prospect_found',
  'first_dm_sent',
  'followup_1_sent',
  'followup_2_sent',
  'followup_3_sent',
  'left_on_read',
];

/** Tailwind color classes for each pipeline stage badge */
export const STAGE_BADGE_CLASSES: Record<PipelineStage, { bg: string; text: string }> = {
  prospect_found:     { bg: 'bg-zinc-100',     text: 'text-zinc-600' },
  first_dm_sent:      { bg: 'bg-blue-50',      text: 'text-blue-600' },
  followup_1_sent:    { bg: 'bg-indigo-50',    text: 'text-indigo-600' },
  followup_2_sent:    { bg: 'bg-violet-50',    text: 'text-violet-600' },
  followup_3_sent:    { bg: 'bg-purple-50',    text: 'text-purple-600' },
  left_on_read:       { bg: 'bg-zinc-200',     text: 'text-zinc-500' },
  replied_interested: { bg: 'bg-emerald-50',   text: 'text-emerald-600' },
  replied_objection:  { bg: 'bg-amber-50',     text: 'text-amber-600' },
  in_conversation:    { bg: 'bg-cyan-50',      text: 'text-cyan-600' },
  call_scheduled:     { bg: 'bg-sky-50',       text: 'text-sky-600' },
  won:                { bg: 'bg-green-50',     text: 'text-green-600' },
  lost:               { bg: 'bg-red-50',       text: 'text-red-500' },
};

/** Hex accent colors for Kanban column headers and charts */
export const STAGE_ACCENTS: Record<PipelineStage, string> = {
  prospect_found:     '#94a3b8',
  first_dm_sent:      '#60a5fa',
  followup_1_sent:    '#818cf8',
  followup_2_sent:    '#a78bfa',
  followup_3_sent:    '#c084fc',
  left_on_read:       '#71717a',
  replied_interested: '#34d399',
  replied_objection:  '#fbbf24',
  in_conversation:    '#22d3ee',
  call_scheduled:     '#38bdf8',
  won:                '#22c55e',
  lost:               '#f87171',
};

export interface Prospect {
  id: string;
  instagramHandle: string;
  instagramUrl: string;
  fullName: string;
  bio: string;
  profilePicUrl: string;
  followerCount: number | null;
  followingCount: number | null;
  postCount: number | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  businessCategory: string | null;
  pipelineStage: PipelineStage;
  tags: string[];
  customFields: Record<string, string>;
  addedBy: string;
  assignedTo: string | null;
  firstContactedAt: Date | null;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  source: 'manual' | 'chrome_extension' | 'import';
}

export interface Note {
  id: string;
  content: string;
  type: 'note' | 'message_sent' | 'message_received' | 'stage_change';
  createdBy: string;
  createdAt: Date;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  teamId: string;
  subscription: {
    plan: 'free' | 'pro' | 'team';
    status: 'active' | 'trialing' | 'canceled';
    stripeCustomerId: string | null;
    currentPeriodEnd: Date | null;
  };
  settings: UserSettings;
}

export interface UserSettings {
  timezone: string;
  dailyGoal: number;
  followUpIntervalDays: number;
  notifications: {
    followUpReminders: boolean;
    newReplyAlerts: boolean;
  };
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dailyGoal: 20,
  followUpIntervalDays: 2,
  notifications: {
    followUpReminders: true,
    newReplyAlerts: true,
  },
};

export interface DailyAnalytics {
  date: string;
  dmsSent: number;
  replies: number;
  positiveReplies: number;
  callsBooked: number;
  won: number;
  lost: number;
}

/** Computed analytics for the dashboard */
export interface AnalyticsResult {
  totalProspects: number;
  replyRate: number;
  positiveReplyRate: number;
  conversionRate: number;
  funnelRows: { stage: PipelineStage; label: string; count: number; percent: number; accent: string }[];
  dailyDms: { date: string; count: number }[];
}

/** A section in the Today view */
export interface TodaySection {
  id: 'overdue' | 'due_today' | 'recent_replies';
  title: string;
  badge: string;
  badgeLevel: 'danger' | 'warning' | 'success';
  prospects: Prospect[];
  emptyMessage: string;
}
