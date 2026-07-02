"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ZoomPlayer from "@/components/ZoomPlayer";
import { sessions as sessionsApi } from "@/lib/api";

const STATUS_STYLE = {
  SCHEDULED: "bg-surface-high text-ink-muted",
  LIVE: "bg-danger-light text-danger",
  PROCESSING: "bg-warning-light text-[#8B6914]",
  RECORDED: "bg-secondary-light text-secondary",
};

export default function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [recordingPlayerUrl, setRecordingPlayerUrl] = useState("");
  const [recordingPasscode, setRecordingPasscode] = useState("");
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    sessionsApi.get(id)
      .then((data) => { if (active) setSession(data.session); })
      .catch((err) => { if (active) setError(err.message || "Unable to load this session."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (session?.status !== "RECORDED") return;
    let active = true;
    setRecordingLoading(true);
    setError("");
    sessionsApi.getRecordingUrl(id)
      .then((data) => {
        if (!active) return;
        setRecordingPlayerUrl(data.playerUrl);
        setRecordingPasscode(data.passcode || "");
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load this recording.");
      })
      .finally(() => {
        if (active) setRecordingLoading(false);
      });
    return () => { active = false; };
  }, [id, session?.status]);

  if (loading) return <div className="h-[620px] rounded-3xl route-shimmer" />;
  if (error && !session) {
    return (
      <div className="glass rounded-3xl p-10 text-center shadow-glass">
        <span className="material-symbols-outlined text-5xl text-danger">error</span>
        <p className="font-bold mt-3">{error}</p>
        <Link href="/sessions" className="inline-block mt-5 text-secondary font-bold">Back to sessions</Link>
      </div>
    );
  }

  const scheduled = new Date(session.scheduledAt);
  return (
    <div className="animate-page-enter">
      <div className="flex flex-wrap items-start justify-between gap-5 mb-7">
        <div>
          <Link href="/sessions" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-primary font-semibold">
            <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Sessions
          </Link>
          <div className="flex items-center gap-3 mt-5 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[session.status] || STATUS_STYLE.SCHEDULED}`}>
              {session.status === "LIVE" && <span className="inline-block w-1.5 h-1.5 bg-danger rounded-full animate-pulse mr-2" />}
              {session.status.replace("_", " ")}
            </span>
            {session.course?.name && <span className="text-xs font-bold text-ink-muted">{session.course.name}</span>}
          </div>
          <h1 className="font-headline text-3xl font-extrabold">{session.title}</h1>
          <p className="text-ink-muted mt-2 max-w-3xl">{session.description || session.topic}</p>
        </div>
        <div className="glass rounded-2xl px-5 py-4 shadow-glass text-sm text-right">
          <p className="font-bold">{scheduled.toLocaleDateString()}</p>
          <p className="text-ink-muted">{scheduled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {session.durationMin} min</p>
        </div>
      </div>

      {error && <div className="mb-5 px-4 py-3 rounded-xl bg-danger-light text-danger text-sm">{error}</div>}

      {session.status === "LIVE" ? (
        <ZoomPlayer sessionId={id} />
      ) : session.status === "RECORDED" ? (
        <div className="relative min-h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-ink to-[#2D2D2D] shadow-elevated">
          {recordingPlayerUrl ? (
            <>
              <iframe
                src={recordingPlayerUrl}
                title={`${session.title} recording`}
                className="absolute inset-0 h-full min-h-[500px] w-full border-0 bg-black"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer"
              />
              <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-black/55 px-3 py-1.5 text-xs font-bold text-white/80 backdrop-blur">
                MathHub · {session.course?.name || "Lesson recording"}
              </div>
              {recordingPasscode && (
                <div className="pointer-events-none absolute bottom-4 right-4 rounded-lg bg-black/65 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
                  Passcode: <strong className="font-mono">{recordingPasscode}</strong>
                </div>
              )}
            </>
          ) : (
            <div className="grid min-h-[500px] place-items-center p-8 text-center">
              <div>
                <span className="material-symbols-outlined animate-pulse text-7xl text-white/25">smart_display</span>
                <h2 className="mt-4 font-headline text-2xl font-bold text-white">
                  {recordingLoading ? "Loading recording…" : "Recording unavailable"}
                </h2>
                <p className="mt-2 text-white/55">
                  {recordingLoading ? "Preparing the secure player inside MathHub." : "Please try again shortly."}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass rounded-3xl p-12 min-h-[360px] shadow-glass grid place-items-center text-center">
          <div>
            <span className="material-symbols-outlined text-6xl text-primary/40">{session.status === "PROCESSING" ? "hourglass_top" : "event"}</span>
            <h2 className="font-headline text-2xl font-extrabold mt-4">
              {session.status === "PROCESSING" ? "Recording is processing" : "Session has not started"}
            </h2>
            <p className="text-ink-muted mt-2">
              {session.status === "PROCESSING" ? "Your teacher will publish the recording shortly." : `Scheduled for ${scheduled.toLocaleString()}.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
