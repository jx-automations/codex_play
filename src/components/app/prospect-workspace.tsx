"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { useAuth } from "@/context/auth-context";
import { FREE_PROSPECT_LIMIT, useOutreach } from "@/context/outreach-context";
import { checkAndNotify } from "@/lib/notifications";
import {
  DEFAULT_SETTINGS,
  LOG_TYPE_OPTIONS,
  NAV_ITEMS,
  PAGE_TITLES,
  PLATFORMS,
  STAGE_ACCENTS,
  STAGES,
  buildAnalytics,
  buildBackup,
  buildCsv,
  daysInStage,
  downloadFile,
  formatDate,
  formatDateTime,
  getTodaySections,
  normalizeHandle,
  parseImportedBackup,
  platformProfileUrl,
  stageSortValue,
  timeAgo,
  todayString,
  urgencyLabel,
  type PageKey,
  type Prospect,
  type ProspectFieldUpdate,
  type ProspectInput,
} from "@/lib/outreach";

import styles from "./prospect-workspace.module.css";

type FlashState = { tone: "success" | "error"; text: string } | null;

interface ProspectFormState {
  handle: string;
  fullName: string;
  platform: string;
  stage: string;
  nextActionDate: string;
  notes: string;
}

interface ProspectEditState {
  handle: string;
  fullName: string;
  platform: string;
  notes: string;
  nextActionDate: string;
}

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return todayString(d);
}

function createLogForm(): ProspectFormState {
  return {
    handle: "",
    fullName: "",
    platform: "Instagram",
    stage: "First DM Sent",
    nextActionDate: addDays(2),
    notes: "",
  };
}

function createEditForm(prospect: Prospect | null): ProspectEditState {
  return {
    handle: prospect ? prospect.handle.replace(/^@/, "") : "",
    fullName: prospect?.fullName ?? "",
    platform: prospect?.platform ?? "Instagram",
    notes: prospect?.notes ?? "",
    nextActionDate: prospect?.nextActionDate ?? "",
  };
}

function toNumberOrDefault(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getPlatformAccent(platform: string): string {
  switch (platform) {
    case "Instagram": return "#e1306c";
    case "LinkedIn": return "#0a66c2";
    case "Twitter/X": return "#1da1f2";
    case "TikTok": return "#00f2ea";
    default: return "#94a3b8";
  }
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span
      className={`${styles.badge} ${styles.platformBadge}`}
      style={{ "--badge-accent": getPlatformAccent(platform) } as CSSProperties}
    >
      {platform}
    </span>
  );
}

function StageBadge({ stage }: { stage: string }) {
  return (
    <span
      className={`${styles.badge} ${styles.stageBadge}`}
      style={{ "--badge-accent": STAGE_ACCENTS[stage] ?? "#94a3b8" } as CSSProperties}
    >
      {stage}
    </span>
  );
}

function DaysBadge({ days }: { days: number }) {
  return <span className={`${styles.badge} ${styles.daysBadge}`}>{days}d in stage</span>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className={styles.emptyCard}>
      <h3 className={styles.emptyHeading}>{title}</h3>
      <p className={styles.emptyCopy}>{copy}</p>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <article className={styles.statCard}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </article>
  );
}

export function ProspectWorkspace({ activePage }: { activePage: PageKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { configured, error: authError, signOutUser, status, user } = useAuth();
  const {
    addLogEntry,
    addProspect,
    bulkUpdateStage,
    clearProspects,
    deleteProspect,
    error: dataError,
    loading,
    mutating,
    prospects,
    replaceAllData,
    saveSettings,
    settings,
    snoozeProspect,
    updateProspect,
    updateStage,
  } = useOutreach();

  const [flash, setFlash] = useState<FlashState>(null);
  const [online, setOnline] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingDetail, setEditingDetail] = useState(false);
  const [logForm, setLogForm] = useState<ProspectFormState>(createLogForm());
  const [editForm, setEditForm] = useState<ProspectEditState>(createEditForm(null));
  const [settingsForm, setSettingsForm] = useState({
    dailyTarget: `${DEFAULT_SETTINGS.dailyTarget}`,
    followUpHours: `${DEFAULT_SETTINGS.followUpHours}`,
  });
  const [stageModal, setStageModal] = useState<{
    prospectId: string;
    stage: string;
    note: string;
  } | null>(null);
  const [logModal, setLogModal] = useState<{
    prospectId: string;
    type: string;
    text: string;
    link: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [stageFilter, setStageFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState("");
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [swUpdateReady, setSwUpdateReady] = useState(false);

  const currentProspect = prospects.find((entry) => entry.id === detailId) ?? null;
  const topError = dataError || authError;
  const dailyDmCount = prospects.filter((prospect) =>
    prospect.stageHistory.some(
      (entry) => entry.stage === "First DM Sent" && entry.timestamp.startsWith(todayString()),
    ),
  ).length;
  const progressRatio = dailyDmCount / Math.max(settings.dailyTarget, 1);

  useEffect(() => {
    setSettingsForm({
      dailyTarget: `${settings.dailyTarget}`,
      followUpHours: `${settings.followUpHours}`,
    });
  }, [settings.dailyTarget, settings.followUpHours]);

  useEffect(() => {
    setEditForm(createEditForm(currentProspect));
    setEditingDetail(false);
  }, [currentProspect]);

  useEffect(() => {
    if (!flash) return undefined;
    const timeout = window.setTimeout(() => setFlash(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [flash]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const setNetworkState = () => setOnline(window.navigator.onLine);
    setNetworkState();
    window.addEventListener("online", setNetworkState);
    window.addEventListener("offline", setNetworkState);
    return () => {
      window.removeEventListener("online", setNetworkState);
      window.removeEventListener("offline", setNetworkState);
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/?next=/app/${activePage}`);
    }
  }, [activePage, router, status]);

  useEffect(() => {
    if (activePage === "today" && prospects.length > 0) {
      checkAndNotify(prospects);
    }
  }, [activePage, prospects]);

  useEffect(() => {
    if (activePage !== "log" || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const handle = params.get("handle");
    const platform = params.get("platform");
    if (handle || platform) {
      setLogForm((current) => ({
        ...current,
        ...(handle ? { handle } : {}),
        ...(platform ? { platform } : {}),
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return undefined;
    const checkForUpdate = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setSwUpdateReady(true);
          }
        });
      });
    };
    void checkForUpdate();
    return undefined;
  }, []);

  function setSuccess(text: string) {
    setFlash({ tone: "success", text });
  }

  function setFailure(text: string) {
    setFlash({ tone: "error", text });
  }

  async function handleSignOut() {
    if (!window.confirm("Sign out of OutreachFlow?")) return;
    await signOutUser();
    router.replace("/");
  }

  async function handleInstallApp() {
    if (!installPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (installPrompt as any).prompt();
    setInstallPrompt(null);
  }

  async function handleSnooze(id: string, days: number) {
    try {
      await snoozeProspect(id, days);
      setSuccess(`Follow-up rescheduled +${days}d.`);
    } catch {
      return;
    }
  }

  async function handleTestNotification() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setFailure("Browser notifications are not supported on this device.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setFailure("Notification permission denied — enable it in browser settings.");
      return;
    }
    new Notification("OutreachFlow", {
      body: "Follow-up reminders are working correctly.",
      icon: "/icon-192.png",
    });
    setSuccess("Test notification sent.");
  }

  async function handleAddProspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!logForm.handle.trim()) {
      setFailure("Handle is required.");
      return;
    }

    const payload: ProspectInput = {
      handle: logForm.handle,
      fullName: logForm.fullName || undefined,
      platform: logForm.platform,
      stage: logForm.stage,
      dateContacted: todayString(),
      nextActionDate: logForm.nextActionDate,
      notes: logForm.notes,
    };

    try {
      await addProspect(payload);
      setLogForm(createLogForm());
      setSuccess("Prospect added and synced.");
      router.push("/app/prospects");
    } catch {
      return;
    }
  }

  async function handleSaveSettings() {
    try {
      await saveSettings({
        dailyTarget: toNumberOrDefault(settingsForm.dailyTarget, settings.dailyTarget),
        followUpHours: toNumberOrDefault(
          settingsForm.followUpHours,
          settings.followUpHours,
        ),
      });
      setSuccess("Settings saved.");
    } catch {
      return;
    }
  }

  async function handleSaveEdit() {
    if (!currentProspect) return;
    const updates: ProspectFieldUpdate = {
      handle: normalizeHandle(editForm.handle),
      fullName: editForm.fullName.trim() || undefined,
      platform: editForm.platform,
      notes: editForm.notes.trim(),
      nextActionDate: editForm.nextActionDate,
    };

    try {
      await updateProspect(currentProspect.id, updates);
      setEditingDetail(false);
      setSuccess("Prospect updated.");
    } catch {
      return;
    }
  }

  async function handleDeleteProspect() {
    if (!currentProspect) return;
    if (!window.confirm(`Delete ${currentProspect.handle}? This cannot be undone.`)) return;
    try {
      await deleteProspect(currentProspect.id);
      setDetailId(null);
      setSuccess("Prospect deleted.");
    } catch {
      return;
    }
  }

  async function handleSaveStage() {
    if (!stageModal) return;
    try {
      await updateStage(stageModal.prospectId, stageModal.stage, stageModal.note);
      setStageModal(null);
      setSuccess("Stage updated.");
    } catch {
      return;
    }
  }

  async function handleSaveLogEntry() {
    if (!logModal) return;
    if (!logModal.text.trim() && !logModal.link.trim()) {
      setFailure("Add a note or a link before saving the log entry.");
      return;
    }
    try {
      await addLogEntry(logModal.prospectId, {
        type: logModal.type,
        text: logModal.text,
        link: logModal.link,
      });
      setLogModal(null);
      setSuccess("Log entry added.");
    } catch {
      return;
    }
  }

  async function handleBulkUpdate() {
    if (!bulkStage || selectedIds.length === 0) {
      setFailure("Choose prospects and a target stage first.");
      return;
    }
    if (!window.confirm(`Move ${selectedIds.length} prospect(s) to ${bulkStage}?`)) return;
    try {
      await bulkUpdateStage(selectedIds, bulkStage);
      setSelectedIds([]);
      setSelectMode(false);
      setBulkStage("");
      setSuccess("Bulk update complete.");
    } catch {
      return;
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parseImportedBackup(await file.text());
      if (
        !window.confirm(
          `Import ${parsed.prospects.length} prospects? This replaces the current prospect dataset.`,
        )
      ) {
        return;
      }
      await replaceAllData(parsed.prospects, parsed.settings);
      setSuccess("Backup imported.");
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Import failed.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleClearProspects() {
    if (!window.confirm("Delete every synced prospect?")) return;
    if (!window.confirm("Last check: this cannot be undone. Continue?")) return;
    try {
      await clearProspects();
      setSuccess("All prospects removed.");
    } catch {
      return;
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function renderProspectSummary(
    prospect: Prospect,
    options?: {
      selectable?: boolean;
      selected?: boolean;
      onSelect?: () => void;
      showSnooze?: boolean;
    },
  ) {
    const profileUrl = platformProfileUrl(prospect.handle, prospect.platform);
    const urgency = urgencyLabel(prospect.nextActionDate);

    return (
      <article
        key={prospect.id}
        className={`${styles.prospectCard} ${
          options?.selected ? styles.prospectCardSelected : ""
        } ${urgency?.level === "overdue" ? styles.prospectCardOverdue : ""}`}
        style={{ "--stage-accent": STAGE_ACCENTS[prospect.currentStage] ?? "#94a3b8" } as CSSProperties}
      >
        <div className={options?.selectable ? styles.checkRow : undefined}>
          {options?.selectable ? (
            <button
              type="button"
              className={styles.checkButton}
              onClick={options.onSelect}
            >
              {options.selected ? "✓" : ""}
            </button>
          ) : null}
          <div className={styles.pageStack}>
            <div className={styles.prospectHeader}>
              <div>
                <div className={styles.handle}>
                  {profileUrl ? (
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.handleLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {prospect.handle}
                      <span className={styles.handleArrow}>↗</span>
                    </a>
                  ) : prospect.handle}
                </div>
                {prospect.fullName ? (
                  <div className={styles.prospectName}>{prospect.fullName}</div>
                ) : null}
                <div className={styles.metaRow}>
                  <PlatformBadge platform={prospect.platform} />
                  <StageBadge stage={prospect.currentStage} />
                  <DaysBadge days={daysInStage(prospect)} />
                  {urgency ? (
                    <span className={`${styles.badge} ${styles[urgency.level === "overdue" ? "overdueBadge" : "dueTodayBadge"]}`}>
                      {urgency.text}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className={styles.inlineActions}>
                <button
                  type="button"
                  className={`${styles.buttonGhost} ${styles.buttonSmall}`}
                  onClick={() =>
                    setStageModal({
                      prospectId: prospect.id,
                      stage: prospect.currentStage,
                      note: "",
                    })
                  }
                >
                  Stage
                </button>
                <button
                  type="button"
                  className={`${styles.buttonGhost} ${styles.buttonSmall}`}
                  onClick={() => setDetailId(prospect.id)}
                >
                  Details
                </button>
              </div>
            </div>
            {prospect.notes ? (
              <div className={styles.metaText}>
                {prospect.notes.slice(0, 80)}{prospect.notes.length > 80 ? "…" : ""}
              </div>
            ) : null}
            {options?.showSnooze ? (
              <div className={styles.snoozeRow}>
                <span className={styles.snoozeLabel}>Snooze:</span>
                {([1, 3, 7] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    className={styles.snoozeChip}
                    disabled={mutating}
                    onClick={() => handleSnooze(prospect.id, days)}
                  >
                    +{days}d
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  function renderTodayPage() {
    if (prospects.length === 0) {
      return (
        <div className={styles.pageStack}>
          <section className={styles.onboardCard}>
            <h2 className={styles.sectionHeading}>Log your first prospect</h2>
            <p className={styles.sectionCopy}>
              Switch to Instagram, find someone to DM, then come back and tap Log. Under 30 seconds.
            </p>
            <div className={styles.actionsRow}>
              <Link href="/app/log" className={styles.button} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                Log first prospect
              </Link>
            </div>
          </section>
        </div>
      );
    }

    const sections = getTodaySections(prospects, settings);
    const totalDue = sections.find((s) => s.id === "followup")?.prospects.length ?? 0;
    const progressPct = Math.min(100, Math.round((dailyDmCount / Math.max(settings.dailyTarget, 1)) * 100));
    const progressDone = progressPct >= 100;
    return (
      <div className={styles.pageStack}>
        {/* Daily progress card */}
        <section className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <div>
              <div className={styles.progressTitle}>Daily DM target</div>
              <div className={styles.progressSub}>
                {totalDue > 0
                  ? `${totalDue} follow-up${totalDue === 1 ? "" : "s"} due — start there.`
                  : progressDone
                    ? "Target hit. Keep the momentum going."
                    : "Log a DM to start the clock."}
              </div>
            </div>
            <div className={`${styles.progressCount} ${progressDone ? styles.progressCountDone : ""}`}>
              {dailyDmCount}<span className={styles.progressCountOf}>/{settings.dailyTarget}</span>
            </div>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressFill} ${progressDone ? styles.progressFillDone : ""}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </section>

        {sections.map((section) => (
          <section className={styles.sectionBlock} key={section.id}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <h3 className={styles.sectionHeading}>{section.title}</h3>
                <p className={styles.sectionCopy}>{section.subtitle}</p>
              </div>
              <div className={styles.sectionCount}>{section.prospects.length}</div>
            </div>
            <div className={styles.todayList}>
              {section.prospects.length === 0 ? (
                <EmptyState title="Nothing waiting here" copy={section.emptyMessage} />
              ) : (
                section.prospects.map((prospect) =>
                  renderProspectSummary(prospect, { showSnooze: section.id === "followup" }),
                )
              )}
            </div>
          </section>
        ))}

        <Link href="/app/log" className={styles.fab} aria-label="Log a new prospect">
          +
        </Link>
      </div>
    );
  }

  function renderProspectsPage() {
    const searchTerm = deferredSearch.trim().toLowerCase();
    let visibleProspects = [...prospects];

    if (searchTerm) {
      visibleProspects = visibleProspects.filter((prospect) => {
        const logText = prospect.conversationLog
          .map((entry) => `${entry.text} ${entry.link}`)
          .join(" ")
          .toLowerCase();
        return (
          prospect.handle.toLowerCase().includes(searchTerm) ||
          (prospect.fullName ?? "").toLowerCase().includes(searchTerm) ||
          prospect.platform.toLowerCase().includes(searchTerm) ||
          prospect.notes.toLowerCase().includes(searchTerm) ||
          logText.includes(searchTerm)
        );
      });
    }

    if (stageFilter) {
      visibleProspects = visibleProspects.filter(
        (prospect) => prospect.currentStage === stageFilter,
      );
    }

    if (platformFilter) {
      visibleProspects = visibleProspects.filter(
        (prospect) => prospect.platform === platformFilter,
      );
    }

    if (sortBy === "date-desc") {
      visibleProspects.sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
    } else if (sortBy === "date-asc") {
      visibleProspects.sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );
    } else if (sortBy === "updated") {
      visibleProspects.sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      );
    } else {
      visibleProspects.sort(
        (left, right) =>
          stageSortValue(left.currentStage) - stageSortValue(right.currentStage),
      );
    }

    return (
      <div className={styles.pageStack}>
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2 className={styles.sectionHeading}>Live prospect list</h2>
              <p className={styles.sectionCopy}>
                Search handles, names, platforms, and notes. Select mode for bulk stage moves.
              </p>
            </div>
            <div className={styles.inlineActions}>
              <button
                type="button"
                className={`${styles.buttonGhost} ${styles.buttonSmall}`}
                onClick={() => {
                  setSelectMode((current) => !current);
                  setSelectedIds([]);
                  setBulkStage("");
                }}
              >
                {selectMode ? "Cancel select" : "Select"}
              </button>
            </div>
          </div>

          <div className={styles.filterGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Search</span>
              <input
                className={styles.input}
                placeholder="Handle, name, or notes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Stage</span>
              <select
                className={styles.select}
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
              >
                <option value="">All stages</option>
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Platform</span>
              <select
                className={styles.select}
                value={platformFilter}
                onChange={(event) => setPlatformFilter(event.target.value)}
              >
                <option value="">All platforms</option>
                {PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Sort</span>
              <select
                className={styles.select}
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="updated">Last updated</option>
                <option value="stage">By stage</option>
              </select>
            </label>
          </div>

          {selectMode ? (
            <div className={styles.bulkBar}>
              <select
                className={styles.select}
                value={bulkStage}
                onChange={(event) => setBulkStage(event.target.value)}
              >
                <option value="">Move selected to...</option>
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.button}
                disabled={mutating}
                onClick={handleBulkUpdate}
              >
                Update selected
              </button>
            </div>
          ) : null}

          {visibleProspects.length === 0 ? (
            <EmptyState
              title={prospects.length === 0 ? "No prospects yet" : "No results"}
              copy={
                prospects.length === 0
                  ? "Add your first prospect from the Log tab to start the pipeline."
                  : "Try loosening the filters or search text."
              }
            />
          ) : (
            <div className={styles.prospectList}>
              {visibleProspects.map((prospect) =>
                renderProspectSummary(prospect, {
                  selectable: selectMode,
                  selected: selectedIds.includes(prospect.id),
                  onSelect: () => toggleSelected(prospect.id),
                }),
              )}
            </div>
          )}
        </section>

        <Link href="/app/log" className={styles.fab} aria-label="Log a new prospect">
          +
        </Link>
      </div>
    );
  }

  const LOG_STAGE_PILLS = [
    "First DM Sent",
    "Prospect Found",
    "Follow-Up 1 Sent",
    "Left on Read",
    "Replied — Interested",
    "In Conversation",
  ] as const;

  const FOLLOWUP_QUICK_PICKS = [
    { label: "+1d", days: 1 },
    { label: "+2d", days: 2 },
    { label: "+3d", days: 3 },
    { label: "+1w", days: 7 },
  ] as const;

  function renderLogPage() {
    if (prospects.length >= FREE_PROSPECT_LIMIT) {
      return (
        <div className={styles.pageStack}>
          <section className={styles.sectionBlock}>
            <div className={styles.sectionTitle}>
              <h2 className={styles.sectionHeading}>Free plan limit reached</h2>
              <p className={styles.sectionCopy}>
                You&apos;ve used all {FREE_PROSPECT_LIMIT} free prospect slots. Upgrade to Pro for unlimited prospects and CSV export.
              </p>
            </div>
            <div className={styles.actionsRow}>
              <a
                href="mailto:hello@outreachflow.app?subject=Pro upgrade"
                className={styles.button}
                style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
              >
                Upgrade to Pro — $19/month
              </a>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>
              Or delete old prospects to free up slots.
            </p>
          </section>
        </div>
      );
    }

    const handleLabel = logForm.platform === "Instagram"
      ? "Instagram handle *"
      : logForm.platform === "LinkedIn"
        ? "LinkedIn URL or name *"
        : logForm.platform === "Twitter/X"
          ? "Twitter/X handle *"
          : logForm.platform === "TikTok"
            ? "TikTok handle *"
            : "Handle or name *";

    return (
      <form className={styles.pageStack} onSubmit={handleAddProspect}>
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2 className={styles.sectionHeading}>Log a prospect</h2>
              <p className={styles.sectionCopy}>3 taps. Under 30 seconds.</p>
            </div>
          </div>

          {/* Platform — pick first so handle label updates */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Platform</span>
            <div className={styles.platformPillRow}>
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  className={`${styles.platformPill} ${logForm.platform === platform ? styles.platformPillActive : ""}`}
                  onClick={() => setLogForm((current) => ({ ...current, platform }))}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Handle */}
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{handleLabel}</span>
            <input
              className={styles.input}
              placeholder="@username"
              value={logForm.handle}
              autoFocus
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              onChange={(event) => setLogForm((current) => ({ ...current, handle: event.target.value }))}
              required
            />
          </label>

          {/* Name — optional */}
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Name <span style={{ fontWeight: 400, opacity: 0.55 }}>(optional)</span></span>
            <input
              className={styles.input}
              placeholder="e.g. Sarah's Lash Studio"
              value={logForm.fullName}
              autoComplete="off"
              onChange={(event) => setLogForm((current) => ({ ...current, fullName: event.target.value }))}
            />
          </label>

          {/* Stage — pill selector */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Stage</span>
            <div className={styles.stagePillRow}>
              {LOG_STAGE_PILLS.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  className={`${styles.stagePill} ${logForm.stage === stage ? styles.stagePillActive : ""}`}
                  style={logForm.stage === stage ? { "--pill-accent": STAGE_ACCENTS[stage] ?? "#f97316" } as React.CSSProperties : undefined}
                  onClick={() => setLogForm((current) => ({ ...current, stage }))}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up date — quick picks + manual */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Follow-up date</span>
            <div className={styles.quickPickRow}>
              {FOLLOWUP_QUICK_PICKS.map(({ label, days }) => {
                const val = addDays(days);
                return (
                  <button
                    key={label}
                    type="button"
                    className={`${styles.quickPick} ${logForm.nextActionDate === val ? styles.quickPickActive : ""}`}
                    onClick={() => setLogForm((current) => ({ ...current, nextActionDate: val }))}
                  >
                    {label}
                  </button>
                );
              })}
              <input
                className={`${styles.input} ${styles.quickPickDate}`}
                type="date"
                value={logForm.nextActionDate}
                onChange={(event) => setLogForm((current) => ({ ...current, nextActionDate: event.target.value }))}
              />
            </div>
          </div>

          {/* Notes */}
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Notes <span style={{ fontWeight: 400, opacity: 0.55 }}>(optional)</span></span>
            <textarea
              className={styles.textarea}
              value={logForm.notes}
              onChange={(event) => setLogForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Quick note about the profile or conversation"
              rows={3}
            />
          </label>

          <div className={styles.actionsRow}>
            <button className={styles.button} disabled={mutating} type="submit">
              {mutating ? "Saving…" : "Save prospect"}
            </button>
          </div>
        </section>
      </form>
    );
  }

  function renderAnalyticsPage() {
    const analytics = buildAnalytics(prospects);
    return (
      <div className={styles.pageStack}>
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2 className={styles.sectionHeading}>Pipeline overview</h2>
              <p className={styles.sectionCopy}>
                Stage-by-stage funnel and weekly outreach metrics.
              </p>
            </div>
            <div className={styles.inlineActions}>
              <button
                type="button"
                className={styles.buttonGhost}
                onClick={() =>
                  downloadFile(
                    `outreachflow-${todayString()}.csv`,
                    buildCsv(prospects),
                    "text/csv",
                  )
                }
              >
                Export CSV
              </button>
            </div>
          </div>

          {prospects.length === 0 ? (
            <EmptyState
              title="No analytics yet"
              copy="Add prospects and move them through stages to see the pipeline funnel."
            />
          ) : (
            <div className={styles.pageStack}>
              <div className={styles.statsGrid}>
                <MetricCard value={`${analytics.totalProspects}`} label="Total prospects" />
                <MetricCard value={`${analytics.thisWeek.sent}`} label="DMs sent this week" />
                <MetricCard value={`${analytics.thisWeek.replyRate}%`} label="Reply rate" />
                <MetricCard value={`${analytics.thisWeek.winRate}%`} label="Win rate" />
              </div>

              <section className={styles.tableCard}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>This week</th>
                        <th>Last week</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>DMs sent</td><td>{analytics.thisWeek.sent}</td><td>{analytics.lastWeek.sent}</td></tr>
                      <tr><td>Replied</td><td>{analytics.thisWeek.replied}</td><td>{analytics.lastWeek.replied}</td></tr>
                      <tr><td>Reply rate</td><td>{analytics.thisWeek.replyRate}%</td><td>{analytics.lastWeek.replyRate}%</td></tr>
                      <tr><td>Won</td><td>{analytics.thisWeek.won}</td><td>{analytics.lastWeek.won}</td></tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={styles.tableCard}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Stage</th><th>Count</th><th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.funnelRows.filter((row) => row.count > 0).map((row) => (
                        <tr key={row.stage}>
                          <td><span style={{ color: row.accent }}>{row.stage}</span></td>
                          <td>{row.count}</td>
                          <td>{row.percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderSettingsPage() {
    return (
      <div className={styles.pageStack}>
        <section className={styles.settingsPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2 className={styles.sectionHeading}>Goals and sync</h2>
              <p className={styles.sectionCopy}>
                Settings are stored in Firestore so your targets travel with your account.
              </p>
            </div>
          </div>

          <div className={styles.settingsGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Daily DM target</span>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={settingsForm.dailyTarget}
                onChange={(event) => setSettingsForm((current) => ({ ...current, dailyTarget: event.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Follow-up threshold (hours)</span>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={settingsForm.followUpHours}
                onChange={(event) => setSettingsForm((current) => ({ ...current, followUpHours: event.target.value }))}
              />
            </label>
          </div>

          <div className={styles.actionsRow}>
            <button type="button" className={styles.button} disabled={mutating} onClick={handleSaveSettings}>
              Save settings
            </button>
          </div>
        </section>

        <section className={styles.settingsPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h3 className={styles.sectionHeading}>Device and notifications</h3>
              <p className={styles.sectionCopy}>Install to home screen for one-tap access. Test that follow-up alerts are wired up.</p>
            </div>
          </div>
          <div className={styles.actionsRow}>
            {installPrompt ? (
              <button type="button" className={styles.button} onClick={handleInstallApp}>
                Install OutreachFlow on this device
              </button>
            ) : null}
            <button type="button" className={styles.buttonGhost} onClick={handleTestNotification}>
              Send test notification
            </button>
          </div>
        </section>

        <section className={styles.settingsPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h3 className={styles.sectionHeading}>Data</h3>
            </div>
          </div>
          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={() =>
                downloadFile(
                  `outreachflow-backup-${todayString()}.json`,
                  buildBackup(prospects, settings),
                  "application/json",
                )
              }
            >
              Export JSON backup
            </button>
            <button type="button" className={styles.buttonGhost} onClick={() => fileInputRef.current?.click()}>
              Import JSON backup
            </button>
            <button type="button" className={styles.buttonDanger} onClick={handleClearProspects}>
              Clear all prospects
            </button>
          </div>
          <input ref={fileInputRef} className="visually-hidden" type="file" accept=".json" onChange={handleImport} />
        </section>
      </div>
    );
  }

  function renderActivePage() {
    if (activePage === "today") return renderTodayPage();
    if (activePage === "prospects") return renderProspectsPage();
    if (activePage === "log") return renderLogPage();
    if (activePage === "analytics") return renderAnalyticsPage();
    return renderSettingsPage();
  }

  if (!configured) {
    return (
      <main className={styles.setupShell}>
        <section className={styles.setupCard}>
          <div className={styles.pageStack}>
            <span className={styles.eyebrow}>Setup required</span>
            <h1 className={styles.topbarHeading}>Firebase client env vars are missing.</h1>
            <p className={styles.sectionCopy}>
              OutreachFlow is wired to use <code>NEXT_PUBLIC_FIREBASE_*</code> values from <code>.env.local</code>.
            </p>
            <div className={styles.actionsRow}>
              <Link className={styles.buttonGhost} href="/">
                Back to landing page
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (status === "loading" || status === "unauthenticated" || loading) {
    return (
      <main className={styles.setupShell}>
        <section className={styles.loadingCard}>
          <div className={styles.spinner} />
          <h1 className={styles.topbarHeading}>
            {status === "loading" ? "Checking session" : "Loading OutreachFlow"}
          </h1>
          <p className={styles.sectionCopy}>
            {status === "unauthenticated"
              ? "Redirecting to the landing page so you can sign in."
              : "Syncing prospects and settings from Firestore."}
          </p>
        </section>
      </main>
    );
  }

  const profileLabel = user?.displayName || user?.email || "Signed in";
  const initials =
    profileLabel
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "OF";

  return (
    <>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>OF</div>
            <div className={styles.brandTitle}>OutreachFlow</div>
            <div className={styles.brandMeta}>
              Track every prospect. Never miss a follow-up.
            </div>
          </div>
          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  <span className={styles.navMark}>{item.shortLabel}</span>
                  <span className={styles.navCopy}>
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={styles.navDescription}>{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className={styles.main}>
          {!online ? (
            <div className={styles.banner}>
              You are offline. Firestore sync will recover automatically when the connection returns.
            </div>
          ) : null}
          {swUpdateReady ? (
            <div className={`${styles.banner} ${styles.bannerUpdate}`}>
              A new version of OutreachFlow is ready.{" "}
              <button
                type="button"
                className={styles.bannerAction}
                onClick={() => window.location.reload()}
              >
                Refresh to update
              </button>
            </div>
          ) : null}
          {flash ? (
            <div
              className={`${styles.flash} ${
                flash.tone === "success" ? styles.flashSuccess : styles.flashError
              }`}
            >
              {flash.text}
            </div>
          ) : null}
          {topError ? <div className={`${styles.flash} ${styles.flashError}`}>{topError}</div> : null}

          <header className={styles.topbar}>
            <div className={styles.topbarTitle}>
              <span className={styles.eyebrow}>Outreach workspace</span>
              <h1 className={styles.topbarHeading}>{PAGE_TITLES[activePage]}</h1>
              <p className={styles.topbarText}>
                {activePage === "today"
                  ? "Work the hottest leads first."
                  : activePage === "prospects"
                    ? "Search and move the full pipeline."
                    : activePage === "log"
                      ? "3 taps. Under 30 seconds."
                      : "Tune targets, backups, and sync."}
              </p>
            </div>
            <div className={styles.topbarActions}>
              <span
                className={`${styles.pill} ${
                  progressRatio >= 1
                    ? styles.pillHot
                    : progressRatio >= 0.5
                      ? styles.pillWarm
                      : ""
                }`}
              >
                Today: {dailyDmCount} / {settings.dailyTarget} DMs
              </span>
              <span
                className={`${styles.pill} ${prospects.length >= FREE_PROSPECT_LIMIT ? styles.pillHot : ""}`}
                title={`Free plan: ${FREE_PROSPECT_LIMIT} prospect limit`}
              >
                {prospects.length}/{FREE_PROSPECT_LIMIT} prospects
              </span>
              <div className={styles.userBlock}>
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={profileLabel} className={styles.userAvatar} src={user.photoURL} />
                ) : (
                  <div className={styles.avatarFallback}>{initials}</div>
                )}
                <span className={styles.userName}>{profileLabel}</span>
                <button
                  type="button"
                  className={`${styles.buttonGhost} ${styles.buttonSmall}`}
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            </div>
          </header>

          <main className={styles.content}>{renderActivePage()}</main>
        </div>
      </div>

      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              className={`${styles.bottomLink} ${active ? styles.bottomLinkActive : ""}`}
              href={item.href}
              key={item.href}
            >
              <span>{item.shortLabel}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {currentProspect ? (
        <div className={styles.overlay}>
          <section className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div className={styles.sectionTitle}>
                <h2 className={styles.sectionHeading}>
                  {(() => {
                    const url = platformProfileUrl(currentProspect.handle, currentProspect.platform);
                    return url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.handleLink}>
                        {currentProspect.handle}
                        <span className={styles.handleArrow}>↗</span>
                      </a>
                    ) : currentProspect.handle;
                  })()}
                </h2>
                {currentProspect.fullName ? (
                  <p className={styles.sectionCopy}>{currentProspect.fullName}</p>
                ) : null}
                <div className={styles.metaRow}>
                  <PlatformBadge platform={currentProspect.platform} />
                  <StageBadge stage={currentProspect.currentStage} />
                  <DaysBadge days={daysInStage(currentProspect)} />
                </div>
              </div>
              <button
                type="button"
                className={`${styles.buttonGhost} ${styles.buttonSmall}`}
                onClick={() => setDetailId(null)}
              >
                Close
              </button>
            </div>

            <div className={styles.drawerBody}>
              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <h3 className={styles.sectionHeading}>Lead details</h3>
                  </div>
                  <div className={styles.inlineActions}>
                    <button
                      type="button"
                      className={`${styles.buttonGhost} ${styles.buttonSmall}`}
                      onClick={() =>
                        setStageModal({
                          prospectId: currentProspect.id,
                          stage: currentProspect.currentStage,
                          note: "",
                        })
                      }
                    >
                      Update stage
                    </button>
                    <button
                      type="button"
                      className={`${styles.buttonGhost} ${styles.buttonSmall}`}
                      onClick={() =>
                        setLogModal({
                          prospectId: currentProspect.id,
                          type: "note",
                          text: "",
                          link: "",
                        })
                      }
                    >
                      Add note
                    </button>
                  </div>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Platform</span>
                    <span className={styles.infoValue}>{currentProspect.platform}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Stage</span>
                    <span className={styles.infoValue}>{currentProspect.currentStage}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Last action</span>
                    <span className={styles.infoValue}>{formatDateTime(currentProspect.lastActionDate)}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Next follow-up</span>
                    <span className={styles.infoValue}>
                      {currentProspect.nextActionDate ? formatDate(currentProspect.nextActionDate) : "—"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Added</span>
                    <span className={styles.infoValue}>{formatDate(currentProspect.dateContacted)}</span>
                  </div>
                  {currentProspect.notes ? (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Notes</span>
                      <span className={styles.infoValue}>{currentProspect.notes}</span>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <h3 className={styles.sectionHeading}>Conversation log</h3>
                    <p className={styles.sectionCopy}>Timeline of updates, notes, and replies.</p>
                  </div>
                </div>
                <div className={styles.timeline}>
                  {currentProspect.conversationLog.length === 0 ? (
                    <EmptyState title="No log entries yet" copy="Add a note from the action bar above." />
                  ) : (
                    [...currentProspect.conversationLog].reverse().map((entry) => (
                      <article className={styles.timelineCard} key={entry.id}>
                        <div className={styles.timelineType}>{entry.type.replaceAll("-", " ")}</div>
                        {entry.text ? <div className={styles.timelineText}>{entry.text}</div> : null}
                        <div className={styles.timelineMeta}>
                          {formatDateTime(entry.timestamp)} · {timeAgo(entry.timestamp)}
                          {entry.link ? ` · ${entry.link}` : ""}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <h3 className={styles.sectionHeading}>Edit details</h3>
                  </div>
                  <button
                    type="button"
                    className={`${styles.buttonGhost} ${styles.buttonSmall}`}
                    onClick={() => setEditingDetail((current) => !current)}
                  >
                    {editingDetail ? "Hide editor" : "Edit"}
                  </button>
                </div>

                {editingDetail ? (
                  <div className={styles.pageStack}>
                    <div className={styles.fieldGrid}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Handle</span>
                        <input className={styles.input} value={editForm.handle} onChange={(event) => setEditForm((current) => ({ ...current, handle: event.target.value }))} />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Name</span>
                        <input className={styles.input} value={editForm.fullName} placeholder="Optional" onChange={(event) => setEditForm((current) => ({ ...current, fullName: event.target.value }))} />
                      </label>
                    </div>

                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Platform</span>
                      <div className={styles.platformPillRow}>
                        {PLATFORMS.map((platform) => (
                          <button
                            key={platform}
                            type="button"
                            className={`${styles.platformPill} ${editForm.platform === platform ? styles.platformPillActive : ""}`}
                            onClick={() => setEditForm((current) => ({ ...current, platform }))}
                          >
                            {platform}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Next follow-up</span>
                      <input className={styles.input} type="date" value={editForm.nextActionDate} onChange={(event) => setEditForm((current) => ({ ...current, nextActionDate: event.target.value }))} />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Notes</span>
                      <textarea className={styles.textarea} value={editForm.notes} onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))} />
                    </label>

                    <div className={styles.actionsRow}>
                      <button type="button" className={styles.button} disabled={mutating} onClick={handleSaveEdit}>Save changes</button>
                      <button type="button" className={styles.buttonDanger} disabled={mutating} onClick={handleDeleteProspect}>Delete prospect</button>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </section>
        </div>
      ) : null}

      {stageModal ? (
        <div className={styles.modalWrap} onClick={() => setStageModal(null)}>
          <section className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Update stage</h2>
                <p className={styles.modalText}>Tap a stage to select, then save.</p>
              </div>
              <button type="button" className={`${styles.buttonGhost} ${styles.buttonSmall}`} onClick={() => setStageModal(null)}>✕</button>
            </div>
            <div className={styles.pageStack}>
              <div className={styles.stageGrid}>
                {STAGES.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    className={`${styles.stageGridPill} ${stageModal.stage === stage ? styles.stageGridPillActive : ""}`}
                    style={stageModal.stage === stage ? { "--pill-accent": STAGE_ACCENTS[stage] ?? "#f97316" } as CSSProperties : undefined}
                    onClick={() => setStageModal((current) => current ? { ...current, stage } : current)}
                  >
                    {stage}
                  </button>
                ))}
              </div>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Note <span style={{ fontWeight: 400, opacity: 0.55 }}>(optional)</span></span>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={stageModal.note}
                  placeholder="e.g. Seen my message, waiting for reply"
                  onChange={(event) => setStageModal((current) => current ? { ...current, note: event.target.value } : current)}
                />
              </label>
              <div className={styles.actionsRow}>
                <button type="button" className={styles.button} disabled={mutating} onClick={handleSaveStage}>Save stage</button>
                <button type="button" className={styles.buttonGhost} onClick={() => setStageModal(null)}>Cancel</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {logModal ? (
        <div className={styles.modalWrap}>
          <section className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add a log entry</h2>
              <p className={styles.modalText}>Capture what happened in the conversation.</p>
            </div>
            <div className={styles.pageStack}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Type</span>
                <select className={styles.select} value={logModal.type} onChange={(event) => setLogModal((current) => current ? { ...current, type: event.target.value } : current)}>
                  {LOG_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>What happened</span>
                <textarea className={styles.textarea} value={logModal.text} onChange={(event) => setLogModal((current) => current ? { ...current, text: event.target.value } : current)} />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Reference link</span>
                <input className={styles.input} value={logModal.link} onChange={(event) => setLogModal((current) => current ? { ...current, link: event.target.value } : current)} />
              </label>
              <div className={styles.actionsRow}>
                <button type="button" className={styles.button} disabled={mutating} onClick={handleSaveLogEntry}>Save entry</button>
                <button type="button" className={styles.buttonGhost} onClick={() => setLogModal(null)}>Cancel</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
