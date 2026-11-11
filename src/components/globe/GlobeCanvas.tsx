"use client";

import { Canvas } from "@react-three/fiber";
import { latLonToVector3 } from "@/lib/geo";
import GlobeScene, { type GlobeSceneProps } from "./GlobeScene";

type Props = GlobeSceneProps & { active: boolean };

/** The WebGL canvas. Loaded lazily (client-only) by <Globe />. */
export default function GlobeCanvas({ active, ...scene }: Props) {
  const { lat, lon, distance } = scene.defaultView;
  const position = latLonToVector3(lat, lon, 4.2 * distance).toArray();

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 35, near: 0.1, far: 50, position }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={(e) => e.type === "click" && scene.onSelect(null)}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ touchAction: "none" }}
    >
      <GlobeScene {...scene} />
    </Canvas>
  );
}
