"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/context/auth-context";

import styles from "@/app/page.module.css";

export function LandingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextHref = searchParams.get("next") || "/today";
  const { configured, error, signInWithGoogle, signOutUser, status } = useAuth();

  async function handleLaunch() {
    if (status === "authenticated") {
      router.push(nextHref);
      return;
    }

    try {
      await signInWithGoogle();
      router.push(nextHref);
    } catch {
      return;
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>OF</div>
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>OutreachFlow</span>
              <span className={styles.brandMeta}>Instagram prospect tracker with follow-up reminders</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            {status === "authenticated" ? (
              <>
                <button className={styles.secondaryButton} onClick={() => router.push(nextHref)}>
                  Open app
                </button>
                <button className={styles.ghostButton} onClick={() => signOutUser()}>
                  Sign out
                </button>
              </>
            ) : (
              <button className={styles.primaryButton} disabled={!configured} onClick={handleLaunch}>
                {configured ? "Try it free" : "Add Firebase env first"}
              </button>
            )}
          </div>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Mobile-first · Free tier included</span>
            <h1 className={styles.heroTitle}>Stop losing Instagram prospects to messy spreadsheets.</h1>
            <p className={styles.heroText}>
              Log a prospect in under 30 seconds. Never miss a follow-up. OutreachFlow runs alongside Instagram
              in your browser — no app install, no context switch, no excuses.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.primaryButton} disabled={!configured} onClick={handleLaunch}>
                {status === "authenticated" ? "Open OutreachFlow" : "Try it free — 25 prospects, no credit card"}
              </button>
            </div>
            <p className={styles.notice}>
              {configured
                ? "Sign in with Google and start logging prospects immediately."
                : "Firebase client env vars are expected in `.env.local`. See `.env.example` for the project values."}
            </p>
            {error ? <p className={styles.notice}>{error}</p> : null}
          </div>

          <aside className={styles.heroAside}>
            <div className={styles.signalCard}>
              <div className={styles.signalHeadline}>
                <span className={styles.signalValue}>30s</span>
                <span className={styles.signalMeta}>to log a prospect</span>
              </div>
              <div className={styles.signalList}>
                <div className={styles.signalRow}>
                  <span className={styles.signalTitle}>Your spreadsheet breaks at 20 conversations.</span>
                  <span className={styles.signalBody}>OutreachFlow scales to hundreds. Stage, note, follow-up — all in one tap.</span>
                </div>
                <div className={styles.signalRow}>
                  <span className={styles.signalTitle}>You&apos;re missing follow-ups that cost clients.</span>
                  <span className={styles.signalBody}>Smart reminders surface overdue prospects the moment you open the app.</span>
                </div>
                <div className={styles.signalRow}>
                  <span className={styles.signalTitle}>Consistency drops when things get busy.</span>
                  <span className={styles.signalBody}>The Today view keeps your daily DM target and due follow-ups front and centre.</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className={styles.metrics}>
          <article className={styles.metricCard}>
            <span className={styles.metricValue}>3 taps</span>
            <span className={styles.metricLabel}>to log a new prospect from inside an Instagram conversation.</span>
          </article>
          <article className={styles.metricCard}>
            <span className={styles.metricValue}>Free tier</span>
            <span className={styles.metricLabel}>25 prospects, follow-up reminders, no credit card required.</span>
          </article>
          <article className={styles.metricCard}>
            <span className={styles.metricValue}>Works offline</span>
            <span className={styles.metricLabel}>View and add prospects on a subway. Syncs when you&apos;re back online.</span>
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Why it works</span>
            <h2 className={styles.sectionTitle}>Built around the workflow, not the other way round.</h2>
            <p className={styles.sectionCopy}>
              Generic CRMs were built for email and web forms. OutreachFlow is shaped around Instagram
              prospecting: DM sent, seen no reply, follow-up, replied, pitched, closed. Your phone is the interface.
            </p>
          </div>
          <div className={styles.features}>
            <article className={styles.featureCard}>
              <div className={styles.featureIcon}>01</div>
              <div className={styles.featureTitle}>Today-first workspace</div>
              <p className={styles.featureText}>
                Follow-ups due, hot leads, and overdue prospects are grouped by urgency so you always know
                what needs to happen next.
              </p>
            </article>
            <article className={styles.featureCard}>
              <div className={styles.featureIcon}>02</div>
              <div className={styles.featureTitle}>Follow-up reminders that actually fire</div>
              <p className={styles.featureText}>
                Set a follow-up date when you log a prospect. Get notified when it&apos;s due — even when the
                app is closed. Free tier included.
              </p>
            </article>
            <article className={styles.featureCard}>
              <div className={styles.featureIcon}>03</div>
              <div className={styles.featureTitle}>Offline-ready PWA</div>
              <p className={styles.featureText}>
                Install to your home screen. View and add prospects with no signal. Changes sync the moment
                you reconnect.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>How it works</span>
            <h2 className={styles.sectionTitle}>From Instagram to logged in under 30 seconds.</h2>
            <p className={styles.sectionCopy}>
              The whole point is that logging a prospect feels faster than opening a spreadsheet — so the habit sticks.
            </p>
          </div>
          <div className={styles.workflow}>
            <article className={styles.workflowCard}>
              <span className={styles.workflowStep}>Step 1</span>
              <span className={styles.workflowTitle}>Find a prospect on Instagram</span>
              <p className={styles.workflowText}>Browse as normal. When you DM someone, switch to OutreachFlow — it runs in the next browser tab.</p>
            </article>
            <article className={styles.workflowCard}>
              <span className={styles.workflowStep}>Step 2</span>
              <span className={styles.workflowTitle}>Log in 3 taps</span>
              <p className={styles.workflowText}>Paste the handle, tap the stage pill, set a follow-up date with one quick-pick button. Done.</p>
            </article>
            <article className={styles.workflowCard}>
              <span className={styles.workflowStep}>Step 3</span>
              <span className={styles.workflowTitle}>Get reminded when it matters</span>
              <p className={styles.workflowText}>OutreachFlow notifies you when a follow-up is due. No more scrolling through spreadsheet rows trying to remember who to chase.</p>
            </article>
            <article className={styles.workflowCard}>
              <span className={styles.workflowStep}>Step 4</span>
              <span className={styles.workflowTitle}>Move the pipeline forward</span>
              <p className={styles.workflowText}>Update the stage in one tap from any prospect. The Today view keeps your full pipeline front and centre every day.</p>
            </article>
          </div>
        </section>

        <section className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Your spreadsheet stops working at 20 conversations. This doesn&apos;t.</h2>
          <p className={styles.ctaText}>
            Free tier — 25 prospects, follow-up reminders, no credit card. Upgrade to Pro for $19/month
            when you need unlimited prospects and CSV export.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryButton} disabled={!configured} onClick={handleLaunch}>
              {status === "authenticated" ? "Go to Today" : "Start free — no credit card"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
