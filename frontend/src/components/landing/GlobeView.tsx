"use client";

import React, { useEffect, useRef, useState } from "react";

// ── Origin ────────────────────────────────────────────────────────────────────
const SRI_LANKA = { lat: 7.8731, lng: 80.7718 };

// ── Source markets ────────────────────────────────────────────────────────────
const MARKETS = [
  { name: "Germany",        lat: 51.1657,  lng: 10.4515,   color: "#10b981" },
  { name: "United Kingdom", lat: 55.3781,  lng: -3.4360,   color: "#06b6d4" },
  { name: "Australia",      lat: -25.2744, lng: 133.7751,  color: "#a855f7" },
  { name: "France",         lat: 48.8566,  lng: 2.3522,    color: "#3b82f6" },
  { name: "Italy",          lat: 41.9028,  lng: 12.4964,   color: "#6366f1" },
  { name: "Spain",          lat: 40.4168,  lng: -3.7038,   color: "#f97316" },
  { name: "United States",  lat: 40.7128,  lng: -74.0060,  color: "#ec4899" },
  { name: "Japan",          lat: 35.6762,  lng: 139.6503,  color: "#ef4444" },
  { name: "Netherlands",    lat: 52.3676,  lng: 4.9041,    color: "#f59e0b" },
  { name: "Canada",         lat: 56.1304,  lng: -106.3468, color: "#14b8a6" },
];

export default function GlobeView() {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const arcsRef  = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  // ── Mount detection ─────────────────────────────────────────────────────────
  useEffect(() => { setReady(true); }, []);

  // ── Globe init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mountRef.current) return;
    const el = mountRef.current;

    import("globe.gl").then(({ default: GlobeModule }) => {
      if (!el) return;

      // ── Points data ──────────────────────────────────────────────────────────
      // One entry per market + Sri Lanka origin
      const points = [
        { lat: SRI_LANKA.lat, lng: SRI_LANKA.lng, color: "#f59e0b", r: 0.5, name: "Sri Lanka (Destination)", isOrigin: true },
        ...MARKETS.map(m => ({ ...m, r: 0.35, isOrigin: false })),
      ];

      // ── Rings data ───────────────────────────────────────────────────────────
      const rings = [
        // Origin: gold ring
        { lat: SRI_LANKA.lat, lng: SRI_LANKA.lng, maxR: 3.5, speed: 1.8, period: 1200, color: "#f59e0b" },
        // Markets: coloured rings with staggered periods
        ...MARKETS.map((m, i) => ({
          lat: m.lat, lng: m.lng,
          maxR: 2.8,
          speed: 1.3,
          period: 1800 + i * 120,
          color: m.color,
        })),
      ];

      // ── Build globe ──────────────────────────────────────────────────────────
      const G = (GlobeModule as any)()(el)
        // Globe image
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .backgroundColor("rgba(0,0,0,0)")
        // Atmosphere
        .showAtmosphere(true)
        .atmosphereColor("#38bdf8")
        .atmosphereAltitude(0.2)
        // Dimensions
        .width(el.clientWidth)
        .height(el.clientHeight)
        // ── Points ──
        .pointsData(points)
        .pointColor("color")
        .pointAltitude(0.01)
        .pointRadius("r")
        .pointLabel("name")          // shows native tooltip on hover
        // ── Rings ──
        .ringsData(rings)
        .ringColor((d: any) => {
          // fade-out: opacity based on propagation ratio
          return (t: number) => {
            const hex = d.color;
            const r = parseInt(hex.slice(1,3),16);
            const g = parseInt(hex.slice(3,5),16);
            const b = parseInt(hex.slice(5,7),16);
            return `rgba(${r},${g},${b},${1 - t})`;
          };
        })
        .ringMaxRadius((d: any) => d.maxR)
        .ringPropagationSpeed((d: any) => d.speed)
        .ringRepeatPeriod((d: any) => d.period)
        // ── Arcs (flights) ──
        .arcsData([])
        .arcColor("color")
        .arcDashLength(0.35)
        .arcDashGap(1.8)
        .arcDashAnimateTime(1500)
        .arcStroke(1.4)
        .arcAltitudeAutoScale(0.4)
        // ── Click handler ──
        .onPointClick((point: any) => {
          if (point.isOrigin) return;   // clicking Sri Lanka does nothing
          launchFlight(point);
        });

      // ── Flight launcher ──────────────────────────────────────────────────────
      const launchFlight = (target: any) => {
        const arc = {
          startLat: SRI_LANKA.lat,
          startLng: SRI_LANKA.lng,
          endLat:   target.lat,
          endLng:   target.lng,
          // gradient: origin colour → target colour
          color: ["#f59e0b", target.color],
        };

        arcsRef.current = [...arcsRef.current, arc];
        G.arcsData(arcsRef.current);

        // Pan camera to midpoint
        const midLat = (SRI_LANKA.lat + target.lat) / 2;
        const midLng = (SRI_LANKA.lng + target.lng) / 2;
        G.pointOfView({ lat: midLat, lng: midLng, altitude: 1.6 }, 900);

        // Remove arc after full dash traversal + pause (3.5 s), then reset camera
        setTimeout(() => {
          arcsRef.current = arcsRef.current.filter(a => a !== arc);
          G.arcsData(arcsRef.current);
          G.pointOfView({ lat: 20, lng: 70, altitude: 1.85 }, 1000);
        }, 3500);
      };

      // ── Controls ─────────────────────────────────────────────────────────────
      const controls = G.controls();
      controls.enableZoom      = false;
      controls.autoRotate      = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableDamping   = true;
      controls.dampingFactor   = 0.05;

      // Initial camera — focus on Indian Ocean / South Asia
      G.pointOfView({ lat: 20, lng: 70, altitude: 1.85 }, 0);

      globeRef.current = G;

      // Resize
      const onResize = () => { if (el) G.width(el.clientWidth).height(el.clientHeight); };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        el.innerHTML = "";
      };
    });
  }, [ready]);

  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{ height: "680px" }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 60% 50%, rgba(14,165,233,0.07) 0%, transparent 70%)",
        }}
      />
      {/* Globe mount — fill entire parent */}
      <div
        ref={mountRef}
        className="w-full h-full"
        style={{ cursor: "grab" }}
      />
    </div>
  );
}
