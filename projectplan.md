# OutreachFlow — Project Plan

Last updated: 2026-04-19

---

## Phase 1 — Packages ✅
- [x] @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, recharts installed

## Phase 2 — Tailwind v4 + Fonts ✅
- [x] `globals.css` — `@import "tailwindcss"` + `@theme {}` with full design token set
- [x] Light body default (neutral-50 background, neutral-900 text)
- [x] Landing page dark theme scoped to `page.module.css` via `.page` class CSS vars
- [x] Space Grotesk + Work Sans via `next/font/google` with CSS variable injection
- [x] Full neutral scale (50–900) defined in `@theme`
- [x] Theme color updated to #6366F1 (primary indigo)

## Phase 3 — Types ✅
- [x] `src/types/index.ts` — spec-exact types
- [x] `PipelineStage` union (12 stages)
- [x] `PIPELINE_STAGE_LABELS`, `PIPELINE_STAGES`, `FREE_TIER_STAGES`
- [x] `STAGE_BADGE_CLASSES`, `STAGE_ACCENTS`
- [x] `Prospect`, `Note`, `AppUser`, `UserSettings`, `DEFAULT_USER_SETTINGS`
- [x] `DailyAnalytics`, `AnalyticsResult`, `TodaySection`

## Phase 4 — Route Groups ✅
- [x] `src/app/(auth)/page.tsx` → `/` landing + Google Sign-In
- [x] `src/app/(app)/layout.tsx` → app shell with auth guard
- [x] `src/app/(app)/today/page.tsx` → /today
- [x] `src/app/(app)/pipeline/page.tsx` → /pipeline
- [x] `src/app/(app)/prospects/page.tsx` → /prospects
- [x] `src/app/(app)/prospects/[id]/page.tsx` → /prospects/:id
- [x] `src/app/(app)/analytics/page.tsx` → /analytics
- [x] `src/app/(app)/settings/page.tsx` → /settings
- [x] manifest.ts start_url → /today, theme_color → #6366F1
- [x] public/sw.js PRECACHE_URLS updated to /today

## Phase 5 — Firestore Schema ✅
- [x] `src/lib/firestore.ts` — all CRUD via `/teams/{uid}/prospects/{id}`
- [x] `subscribeToProspects`, `writeProspect`, `deleteProspectDoc`, `batchWriteProspects`
- [x] `subscribeToSettings`, `writeSettings`, `fetchSettings`
- [x] `toFirestore` / `fromFirestore` with Timestamp ↔ Date conversion
- [x] `src/lib/auth.ts` — standalone signInWithGoogle / signOutUser
- [x] `firestore.rules` — teams/{teamId}/{document=**} locked to teamId === auth.uid
- [x] `src/lib/notifications.ts` — updated to use new Prospect type

## Phase 6 — App Shell ✅
- [x] `src/components/layout/AuthGuard.tsx` — auth redirect + loading/disabled states
- [x] `src/components/layout/BottomNav.tsx` — 4-tab nav (Today/Pipeline/Prospects/Analytics)
- [x] `src/components/layout/FloatingActionButton.tsx` — fixed + button, opens AddProspectSheet
- [x] `src/components/layout/OfflineBanner.tsx` — online/offline state banner
- [x] `src/components/layout/PageHeader.tsx` — title + subtitle + settings gear link
- [x] `src/context/add-prospect-context.tsx` — sheet open/close/prefill state
- [x] `(app)/layout.tsx` — composes AuthGuard, AddProspectProvider, BottomNav, FAB, Sheet

## Phase 7 — Add Prospect Sheet ✅
- [x] `src/components/prospects/AddProspectSheet.tsx`
- [x] extractHandle() — strips @, extracts from Instagram URL
- [x] Auto-focus handle input on open (useRef + setTimeout)
- [x] 12 stage pills with horizontal scroll
- [x] Writes to Firestore via writeProspect, sets nextFollowUpAt from settings
- [x] Error handling + saving state

## Phase 8 — Page Components ✅
- [x] `src/components/ui/StageBadge.tsx` — colored badge from STAGE_BADGE_CLASSES
- [x] `src/components/ui/EmptyState.tsx` — title + description + CTA
- [x] `src/components/today/TodayView.tsx` — overdue / due today / recent replies sections
- [x] `src/components/today/TodayProspectCard.tsx` — card with urgency text
- [x] `src/components/prospects/ProspectCard.tsx` — list row with stage badge + follow-up
- [x] `src/components/prospects/ProspectList.tsx` — search, stage filter chips, sort select
- [x] `src/components/prospects/ProspectDetail.tsx` — full detail, inline stage selector, delete
- [x] `src/components/analytics/MetricCard.tsx` — stat card
- [x] `src/components/analytics/AnalyticsDashboard.tsx` — recharts BarChart + LineChart
- [x] `src/components/settings/SettingsPanel.tsx` — daily goal, follow-up interval, notifications

## Phase 9 — Kanban ✅
- [x] `src/components/pipeline/KanbanBoard.tsx` — DndContext, PointerSensor + TouchSensor
- [x] `src/components/pipeline/KanbanColumn.tsx` — useDroppable, SortableContext, accent border
- [x] `src/components/pipeline/KanbanCard.tsx` — useSortable, drag handle, Link to detail
- [x] Drag-end updates Firestore immediately via writeProspect
- [x] Mobile: overflow-x-auto + scroll-snap-type: x mandatory, column min-width 256px

## Phase 10 — Prospect Detail Route ✅
- [x] `src/app/(app)/prospects/[id]/page.tsx` — async params, renders ProspectDetail

## Phase 11 — Hooks ✅
- [x] `src/hooks/useProspects.ts` — real-time onSnapshot subscription
- [x] `src/hooks/useAnalytics.ts` — useMemo computed metrics + funnel + daily DMs
- [x] `src/hooks/useTodayData.ts` — computed today sections
- [x] `src/hooks/useSettings.ts` — subscribeToSettings + save()
- [x] `src/hooks/useOnlineStatus.ts` — online/offline event listeners
- [x] `src/hooks/useInstallPrompt.ts` — beforeinstallprompt capture

## Phase 12 — Cleanup ✅
- [x] Deleted `src/context/outreach-context.tsx` (dead code, no imports)
- [x] `src/lib/notifications.ts` updated to new Prospect type (@/types)
- [x] `src/lib/outreach.ts` retained for any legacy utility fns still needed

---

## Future Phases (not started)
- [ ] Chrome extension — share Instagram profiles directly to app
- [ ] Team accounts UI — invite collaborators, shared pipeline
- [ ] Stripe / subscription billing — Pro tier enforcement
- [ ] CSV export UI — download prospects as spreadsheet
- [ ] AI reply suggestions — GPT-powered DM follow-up drafts
- [ ] FCM push notifications — server-triggered follow-up alerts
- [ ] Capacitor wrapper — native iOS/Android app store build
- [ ] Bulk operations — select multiple prospects, batch stage update
- [ ] Custom fields UI — user-defined extra fields per prospect
- [ ] PWA install prompt — nudge after 3 prospects added
