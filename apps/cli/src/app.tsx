import React, { useState } from "react";
import type { GameSettings, GameResult } from "@en-kata/core";
import { Menu } from "./screens/Menu.js";
import { Game } from "./screens/Game.js";
import { Result } from "./screens/Result.js";

type Screen =
  | { type: "menu" }
  | { type: "game"; settings: GameSettings }
  | { type: "result"; result: GameResult; settings: GameSettings };

export function App() {
  const [screen, setScreen] = useState<Screen>({ type: "menu" });

  switch (screen.type) {
    case "menu":
      return (
        <Menu
          onStart={(settings) => setScreen({ type: "game", settings })}
        />
      );
    case "game":
      return (
        <Game
          settings={screen.settings}
          onFinish={(result) =>
            setScreen({ type: "result", result, settings: screen.settings })
          }
          onQuit={() => setScreen({ type: "menu" })}
        />
      );
    case "result":
      return (
        <Result
          result={screen.result}
          settings={screen.settings}
          onRetry={() => setScreen({ type: "game", settings: screen.settings })}
          onMenu={() => setScreen({ type: "menu" })}
        />
      );
  }
}
