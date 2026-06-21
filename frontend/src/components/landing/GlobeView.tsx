"use client";

import React, { useEffect, useRef, useState } from "react";

const SRI_LANKA = { lat: 7.8731, lng: 80.7718 };

const MARKETS = [
  { name: "Germany",        lat: 51.1657,  lng: 10.4515,   color: "#10b981" },
  { name: "United Kingdom", lat: 55.3781,  lng: -3.4360,   color: "#06b6d4" },
  { name: "Australia",      lat: -25.2744, lng: 133.7751,  color: "#a855f7" },
  { name: "France",         lat: 48.8566,  lng: 2.3522,    color: "#3b82f6" },
  { name: "Italy",          lat: 41.9028,  lng: 12.4964,   color: "#6366f1" },
  { name: "Spain",          lat: 40.4168,  lng: -3.7038,   color: "#f97316" },
  { name: "United States",  lat: 40.7128,  lng: -74.0060,  color: "#ec4899" },
  { name: "Japan",          lat: 35.6762,  lng: 139.6503,  color: "#ef4444" },
  { name: "Netherlands",    lat: 52.3676,  lng: 4.9041,    color: "#eab308" },
  { name: "Canada",         lat: 56.1304,  lng: -106.3468, color: "#14b8a6" },
];

// Great-circle spherical interpolation (SLERP)
function slerp(lat1: number, lng1: number, lat2: number, lng2: number, t: number) {
  const D = Math.PI / 180;
  const φ1 = lat1 * D, λ1 = lng1 * D, φ2 = lat2 * D, λ2 = lng2 * D;
  const x1 = Math.cos(φ1) * Math.cos(λ1), y1 = Math.cos(φ1) * Math.sin(λ1), z1 = Math.sin(φ1);
  const x2 = Math.cos(φ2) * Math.cos(λ2), y2 = Math.cos(φ2) * Math.sin(λ2), z2 = Math.sin(φ2);
  const dot = Math.min(Math.max(x1 * x2 + y1 * y2 + z1 * z2, -1), 1);
  const Ω = Math.acos(dot);
  if (Math.abs(Ω) < 1e-6) return { lat: lat1, lng: lng1 };
  const s = Math.sin(Ω);
  const a = Math.sin((1 - t) * Ω) / s, b = Math.sin(t * Ω) / s;
  const x = a * x1 + b * x2, y = a * y1 + b * y2, z = a * z1 + b * z2;
  return { lat: Math.asin(z) / D, lng: Math.atan2(y, x) / D };
}

// ── 3D Jet Airplane Mesh Constructor ──────────────────────────────────────
function createAirplane(THREE: any) {
  const planeGroup = new THREE.Group();

  // Sleek metallic silver fuselage & wings
  const metallicMat = new THREE.MeshStandardMaterial({
    color: 0xf3f4f6,      // light gray silver
    metalness: 0.9,       // highly reflective metallic finish
    roughness: 0.15,      // glossy finish to catch sunlight
  });

  // Dark charcoal material for engine inlets and cockpit trim
  const engineTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.8,
    roughness: 0.2,
  });

  // 1. Fuselage
  const bodyGeom = new THREE.CylinderGeometry(0.7, 0.45, 5.0, 12);
  bodyGeom.rotateX(Math.PI / 2); // align nose along Z-axis
  const body = new THREE.Mesh(bodyGeom, metallicMat);
  planeGroup.add(body);

  // 2. Nose Cone
  const noseGeom = new THREE.ConeGeometry(0.7, 1.6, 12);
  noseGeom.rotateX(Math.PI / 2);
  noseGeom.translate(0, 0, 2.5); // align base at front of cylinder
  const nose = new THREE.Mesh(noseGeom, metallicMat);
  planeGroup.add(nose);

  // 3. Swept-back Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(3.4, -1.6);
  wingShape.lineTo(3.1, -2.1);
  wingShape.lineTo(0, -0.7);
  wingShape.lineTo(-3.1, -2.1);
  wingShape.lineTo(-3.4, -1.6);
  wingShape.lineTo(0, 0);

  const wingExtrude = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.08,
    bevelEnabled: false,
  });
  wingExtrude.rotateX(Math.PI / 2);
  wingExtrude.translate(0, -0.15, 0.4); // position slightly below fuselage centerline
  const wings = new THREE.Mesh(wingExtrude, metallicMat);
  planeGroup.add(wings);

  // 4. Vertical Tail Fin
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0, 1.2);
  finShape.lineTo(-0.7, 1.0);
  finShape.lineTo(-0.9, 0);
  finShape.lineTo(0, 0);

  const finExtrude = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.06,
    bevelEnabled: false,
  });
  finExtrude.rotateY(Math.PI / 2);
  finExtrude.translate(0, 0.15, -2.1); // sit on top at back
  const fin = new THREE.Mesh(finExtrude, metallicMat);
  planeGroup.add(fin);

  // 5. Horizontal Stabilizers
  const stabShape = new THREE.Shape();
  stabShape.moveTo(0, 0);
  stabShape.lineTo(1.1, -0.4);
  stabShape.lineTo(0.9, -0.7);
  stabShape.lineTo(0, -0.2);
  stabShape.lineTo(-0.9, -0.7);
  stabShape.lineTo(-1.1, -0.4);
  stabShape.lineTo(0, 0);

  const stabExtrude = new THREE.ExtrudeGeometry(stabShape, {
    depth: 0.05,
    bevelEnabled: false,
  });
  stabExtrude.rotateX(Math.PI / 2);
  stabExtrude.translate(0, 0, -2.2);
  const stabilizers = new THREE.Mesh(stabExtrude, metallicMat);
  planeGroup.add(stabilizers);

  // 6. Under-wing Jet Engines
  const engineGeom = new THREE.CylinderGeometry(0.28, 0.22, 1.1, 8);
  engineGeom.rotateX(Math.PI / 2);
  const leftEngine = new THREE.Mesh(engineGeom, engineTrimMat);
  leftEngine.position.set(1.1, -0.4, 0.25);
  const rightEngine = new THREE.Mesh(engineGeom, engineTrimMat);
  rightEngine.position.set(-1.1, -0.4, 0.25);
  planeGroup.add(leftEngine);
  planeGroup.add(rightEngine);

  // Scale down airplane so it sits beautifully on a 100-radius globe
  planeGroup.scale.set(0.65, 0.65, 0.65);

  return planeGroup;
}

export default function GlobeView() {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    if (!ready || !mountRef.current) return;
    const el = mountRef.current;
    let destroyed = false;

    // Load Three.js and Globe.gl concurrently
    Promise.all([
      import("three"),
      import("globe.gl")
    ]).then(([THREE, { default: GlobeModule }]) => {
      if (destroyed || !el) return;

      // ── Points data (Static visual beacons) ──────────────────────────────────
      const points = [
        { lat: SRI_LANKA.lat, lng: SRI_LANKA.lng, color: "#f59e0b", r: 0.6 },
        ...MARKETS.map(m => ({ lat: m.lat, lng: m.lng, color: m.color, r: 0.4 })),
      ];

      // ── Rings data (Continuous pulse) ───────────────────────────────────────
      const rings = [
        { lat: SRI_LANKA.lat, lng: SRI_LANKA.lng, maxR: 4, speed: 2, period: 1100, color: "#f59e0b" },
        ...MARKETS.map((m, i) => ({
          lat: m.lat, lng: m.lng, maxR: 3, speed: 1.4,
          period: 1600 + i * 100, color: m.color,
        })),
      ];

      // ── Build Globe ─────────────────────────────────────────────────────────
      const G = (GlobeModule as any)()(el)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor("#38bdf8")
        .atmosphereAltitude(0.2)
        .width(el.clientWidth)
        .height(el.clientHeight)
        // Visual points
        .pointsData(points)
        .pointColor("color")
        .pointAltitude(0.015)
        .pointRadius("r")
        // Pulsing rings
        .ringsData(rings)
        .ringColor((d: any) => (t: number) => {
          const c = d.color;
          const r = parseInt(c.slice(1,3),16);
          const g = parseInt(c.slice(3,5),16);
          const b = parseInt(c.slice(5,7),16);
          return `rgba(${r},${g},${b},${1 - t})`;
        })
        .ringMaxRadius((d: any) => d.maxR)
        .ringPropagationSpeed((d: any) => d.speed)
        .ringRepeatPeriod((d: any) => d.period)
        // Arcs config
        .arcsData([])
        .arcColor((d: any) => {
          // Color fading/gradient logic based on opacity
          const op = d.opacity !== undefined ? d.opacity : 1.0;
          const c1 = d.color[0];
          const c2 = d.color[1];
          const hexToRgba = (hex: string, a: number) => {
            const r = parseInt(hex.slice(1,3), 16);
            const g = parseInt(hex.slice(3,5), 16);
            const b = parseInt(hex.slice(5,7), 16);
            return `rgba(${r},${g},${b},${a})`;
          };
          return [hexToRgba(c1, op), hexToRgba(c2, op)];
        })
        .arcDashLength(1)
        .arcDashGap(0)
        .arcDashAnimateTime(0)
        .arcStroke(1.6)
        .arcAltitudeAutoScale(0.38)
        .arcsTransitionDuration(0) // Prevent transition delays during frame updates
        // HTML markers (Huge clickable overlays & custom tooltips)
        .htmlElementsData(MARKETS)
        .htmlElement((d: any) => {
          const wrap = document.createElement("div");
          wrap.style.cssText = `
            width: 54px;
            height: 54px;
            border-radius: 50%;
            cursor: pointer;
            pointer-events: auto !important;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            z-index: 10;
            transition: all 0.2s ease;
          `;

          // Hover visual halo
          const hoverRing = document.createElement("div");
          hoverRing.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px dashed ${d.color}00;
            position: absolute;
            transition: border-color 0.25s, transform 0.25s;
          `;
          wrap.appendChild(hoverRing);

          // Glassmorphic tooltip
          const tip = document.createElement("div");
          tip.innerHTML = `<span style="margin-right:6px">✈</span>Monitor ${d.name} Market`;
          tip.style.cssText = `
            position: absolute;
            bottom: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%);
            background: rgba(10, 10, 15, 0.94);
            border: 1px solid ${d.color}66;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            padding: 5px 12px;
            border-radius: 8px;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            font-family: inherit;
            box-shadow: 0 4px 16px rgba(0,0,0,0.65), 0 0 10px ${d.color}33;
          `;
          wrap.appendChild(tip);

          wrap.onmouseenter = () => {
            hoverRing.style.borderColor = `${d.color}77`;
            hoverRing.style.transform = "scale(1.05)";
            tip.style.opacity = "1";
          };
          wrap.onmouseleave = () => {
            hoverRing.style.borderColor = `${d.color}00`;
            hoverRing.style.transform = "scale(1.0)";
            tip.style.opacity = "0";
          };

          wrap.onclick = (e) => {
            e.stopPropagation();
            launchFlight(d);
          };

          return wrap;
        });

      // ── Create & Register 3D Airplane Mesh ──────────────────────────────────
      const airplane = createAirplane(THREE);
      airplane.visible = false;
      G.scene().add(airplane);

      // ── Controls ───────────────────────────────────────────────────────────
      const controls = G.controls();
      controls.enableZoom = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      G.pointOfView({ lat: 20, lng: 70, altitude: 1.85 }, 0);
      globeRef.current = G;

      // ── Flight launcher ─────────────────────────────────────────────────────
      const FLIGHT_MS = 2600;
      const FADE_MS = 800;

      function launchFlight(target: typeof MARKETS[0]) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        controls.autoRotate = false;

        // Initialize arc path
        const arc: any = {
          startLat: SRI_LANKA.lat, startLng: SRI_LANKA.lng,
          endLat: SRI_LANKA.lat, endLng: SRI_LANKA.lng,
          color: ["#f59e0b", target.color],
          opacity: 1.0,
        };
        G.arcsData([arc]);

        // Reveal and position airplane at origin
        airplane.visible = true;
        const startCoords = G.getCoords(SRI_LANKA.lat, SRI_LANKA.lng, 0.04);
        airplane.position.set(startCoords.x, startCoords.y, startCoords.z);

        // Smooth camera pan to midpoint
        const midLat = (SRI_LANKA.lat + target.lat) / 2;
        const midLng = (SRI_LANKA.lng + target.lng) / 2;
        G.pointOfView({ lat: midLat, lng: midLng, altitude: 1.65 }, 850);

        const startTime = performance.now();

        function tick(now: number) {
          const t = Math.min((now - startTime) / FLIGHT_MS, 1);
          const pos = slerp(SRI_LANKA.lat, SRI_LANKA.lng, target.lat, target.lng, t);

          // Grow arc trail progressively behind the airplane
          arc.endLat = pos.lat;
          arc.endLng = pos.lng;
          G.arcsData([arc]);

          // Position and orient 3D airplane
          const alt = 0.04;
          const coords = G.getCoords(pos.lat, pos.lng, alt);
          airplane.position.set(coords.x, coords.y, coords.z);

          // Rotate nose toward the next step on the flight path
          const nextT = Math.min(t + 0.015, 1);
          const nextPos = slerp(SRI_LANKA.lat, SRI_LANKA.lng, target.lat, target.lng, nextT);
          const nextCoords = G.getCoords(nextPos.lat, nextPos.lng, alt);
          const nextPos3 = new THREE.Vector3(nextCoords.x, nextCoords.y, nextCoords.z);

          // Align wings flat to surface, point nose forward
          const planePos = new THREE.Vector3(coords.x, coords.y, coords.z);
          airplane.up.copy(planePos).normalize();
          airplane.lookAt(nextPos3);

          if (t < 1) {
            rafRef.current = requestAnimationFrame(tick);
          } else {
            // Arrival: Hide airplane and trigger arc dissolving fade-out
            airplane.visible = false;
            const fadeStart = performance.now();

            function fadeTick(nowFade: number) {
              const ft = Math.min((nowFade - fadeStart) / FADE_MS, 1);
              arc.opacity = 1.0 - ft;
              G.arcsData([arc]);

              if (ft < 1) {
                rafRef.current = requestAnimationFrame(fadeTick);
              } else {
                // Done: Reset globe to default viewpoint
                G.arcsData([]);
                controls.autoRotate = true;
                G.pointOfView({ lat: 20, lng: 70, altitude: 1.85 }, 1000);
              }
            }
            rafRef.current = requestAnimationFrame(fadeTick);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      }

      const onResize = () => { if (el) G.width(el.clientWidth).height(el.clientHeight); };
      window.addEventListener("resize", onResize);

      return () => {
        destroyed = true;
        cancelAnimationFrame(rafRef.current);
        window.removeEventListener("resize", onResize);
        el.innerHTML = "";
      };
    });

    return () => { destroyed = true; };
  }, [ready]);

  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{ height: "700px" }}
    >
      {/* Ambient glow behind globe */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 60% 50%, rgba(14,165,233,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Globe canvas */}
      <div ref={mountRef} className="absolute inset-0" style={{ cursor: "grab" }} />
    </div>
  );
}
