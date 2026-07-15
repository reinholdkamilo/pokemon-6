import type { ReactNode } from "react";
import { ArcadeBattleScreenPolish } from "./ArcadeBattleScreenPolish";
import "./arcade.css";

export default function ArcadeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ArcadeBattleScreenPolish />
      {children}
    </>
  );
}
