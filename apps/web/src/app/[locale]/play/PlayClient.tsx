"use client";

import { lazy, Suspense } from "react";

const CanvasPlayClient = lazy(() => import("./canvas/CanvasPlayClient"));

export default function PlayClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[var(--color-text-dim)]">
          Loading...
        </div>
      }
    >
      <CanvasPlayClient />
    </Suspense>
  );
}
