import { useState, useEffect } from "react";

declare const __VERSION__: string;

const PKG_NAME = "en-kata";

interface UpdateInfo {
  current: string;
  latest: string;
}

export function useUpdateCheck(): UpdateInfo | null {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`https://registry.npmjs.org/${PKG_NAME}/latest`, {
      signal: controller.signal,
    })
      .then((res) => res.json() as Promise<{ version?: string }>)
      .then((data) => {
        if (data.version && data.version !== __VERSION__) {
          setUpdate({ current: __VERSION__, latest: data.version });
        }
      })
      .catch(() => {
        // 네트워크 오류 시 조용히 무시
      });

    return () => controller.abort();
  }, []);

  return update;
}
