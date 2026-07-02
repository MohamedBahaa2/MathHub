"use client";

import { useEffect, useRef, useState } from "react";
import { zoom } from "@/lib/api";

const ZOOM_SDK_SCRIPTS = [
  "https://source.zoom.us/6.2.0/lib/vendor/react.min.js",
  "https://source.zoom.us/6.2.0/lib/vendor/react-dom.min.js",
  "https://source.zoom.us/6.2.0/zoomus-websdk-embedded.umd.min.js",
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing?.dataset.loaded === "true") return resolve();
    const script = existing || document.createElement("script");
    const handleLoad = () => { script.dataset.loaded = "true"; resolve(); };
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("Unable to load Zoom Meeting SDK.")), { once: true });
    if (!existing) {
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  });
}

async function loadZoomSdk() {
  if (window.ReactWidgets?.createClient) return window.ReactWidgets;
  for (const src of ZOOM_SDK_SCRIPTS) await loadScript(src);
  if (!window.ReactWidgets?.createClient) throw new Error("Zoom Meeting SDK did not initialize.");
  return window.ReactWidgets;
}

export default function ZoomPlayer({ sessionId }) {
  const hostRef = useRef(null);
  const zoomRootRef = useRef(null);
  const watermarkRef = useRef(null);
  const clientRef = useRef(null);
  const [status, setStatus] = useState("joining");
  const [error, setError] = useState("");
  const [identity, setIdentity] = useState("MathHub Student");

  useEffect(() => {
    let active = true;
    let mutationObserver;
    let resizeObserver;

    function ensureWatermark() {
      const watermark = watermarkRef.current;
      const host = document.fullscreenElement || hostRef.current;
      if (!watermark || !host) return;
      if (watermark.parentElement !== host) host.appendChild(watermark);
      Object.assign(watermark.style, {
        display: "grid",
        visibility: "visible",
        opacity: "0.16",
        position: "absolute",
        inset: "0",
        zIndex: "2147483647",
        pointerEvents: "none",
      });
    }

    async function joinMeeting() {
      try {
        const credentials = await zoom.getSignature(sessionId);
        if (!active || !zoomRootRef.current) return;
        setIdentity(`${credentials.userName} · ${credentials.watermarkId} · MathHub`);

        const ZoomMtgEmbedded = await loadZoomSdk();
        if (!active || !zoomRootRef.current) return;
        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;
        await client.init({
          zoomAppRoot: zoomRootRef.current,
          language: "en-US",
          patchJsMedia: true,
          leaveOnPageUnload: true,
          customize: {
            video: {
              isResizable: true,
              viewSizes: {
                default: { width: 1050, height: 600 },
                ribbon: { width: 320, height: 180 },
              },
            },
          },
        });
        await client.join({
          signature: credentials.signature,
          meetingNumber: credentials.meetingNumber,
          password: credentials.passcode || "",
          userName: credentials.userName,
          userEmail: credentials.userEmail,
        });
        if (active) setStatus("joined");
        ensureWatermark();
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to join the live classroom.");
          setStatus("error");
        }
      }
    }

    mutationObserver = new MutationObserver(ensureWatermark);
    mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["class", "style", "hidden"],
    });
    resizeObserver = new ResizeObserver(ensureWatermark);
    if (hostRef.current) resizeObserver.observe(hostRef.current);
    document.addEventListener("fullscreenchange", ensureWatermark);
    void joinMeeting();

    return () => {
      active = false;
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      document.removeEventListener("fullscreenchange", ensureWatermark);
      try { clientRef.current?.leaveMeeting?.(); } catch {}
    };
  }, [sessionId]);

  return (
    <div ref={hostRef} className="relative min-h-[620px] rounded-3xl overflow-hidden bg-[#101313] shadow-elevated isolate">
      <div ref={zoomRootRef} className="w-full min-h-[620px]" />

      <div
        ref={watermarkRef}
        id="mathhub-watermark"
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-3 grid-rows-5 -rotate-12 scale-110 select-none overflow-hidden"
        style={{ zIndex: 2147483647, pointerEvents: "none", opacity: 0.16 }}
      >
        {Array.from({ length: 15 }, (_, index) => (
          <span key={index} className="grid place-items-center whitespace-nowrap text-white font-extrabold text-sm tracking-wide drop-shadow-md">
            {identity}
          </span>
        ))}
      </div>

      {status === "joining" && (
        <div className="absolute inset-0 z-[2147483646] grid place-items-center bg-[#101313] text-white">
          <div className="text-center">
            <span className="inline-block w-9 h-9 border-4 border-white/20 border-t-primary rounded-full animate-spin" />
            <p className="font-headline font-bold mt-4">Joining secure classroom…</p>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 z-[2147483646] grid place-items-center bg-[#101313] text-white p-8">
          <div className="max-w-md text-center">
            <span className="material-symbols-outlined text-5xl text-danger">error</span>
            <h3 className="font-headline text-xl font-bold mt-3">Could not join Zoom</h3>
            <p className="text-white/65 text-sm mt-2">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
