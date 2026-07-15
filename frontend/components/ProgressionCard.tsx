"use client";

import type { KeyboardEvent } from "react";
import { LocalSprite } from "@/components/LocalSprite";
import { BADGE_IMAGE_PATHS, getTrainerSprite } from "@/lib/imagePaths";
import {
  formatBattleOutcome,
  type BattleStatus,
  type OpponentMeta,
} from "@/lib/progression";
import type { OpponentBreakdown } from "@/types/pokemon";

export type ExplicitResultStamp =
  | {
      text: "DEFEATED" | "WIPED OUT";
      tone: "success" | "danger";
    }
  | null;

export type SpritePresentation = "standard" | "full-body" | "pixel-trainer";

type ProgressionCardProps = {
  meta: OpponentMeta;
  status: BattleStatus;
  breakdown?: OpponentBreakdown;
  showBadge?: boolean;
  isSelectable?: boolean;
  isLocked?: boolean;
  isSelected?: boolean;
  interactionRole?: "button" | "radio";
  className?: string;
  detailItems?: string[];
  selectActionLabel?: string;
  spriteSrc?: string;
  explicitResultStamp?: ExplicitResultStamp;
  suppressAutomaticStamp?: boolean;
  spritePresentation?: SpritePresentation;
  roleLabel?: string;
  summaryLabel?: string;
  locationLabel?: string;
  onSelect?: () => void;
};

export function ProgressionCard({
  meta,
  status,
  breakdown,
  showBadge = false,
  isSelectable = false,
  isLocked = false,
  isSelected = false,
  interactionRole = "button",
  className = "",
  detailItems,
  selectActionLabel = "Battle",
  spriteSrc,
  explicitResultStamp,
  suppressAutomaticStamp = false,
  spritePresentation = "standard",
  roleLabel,
  summaryLabel,
  locationLabel,
  onSelect,
}: ProgressionCardProps) {
  const automaticOutcome = suppressAutomaticStamp
    ? undefined
    : formatBattleOutcome(status, breakdown);
  const resultStamp = explicitResultStamp
    ? explicitResultStamp
    : automaticOutcome
      ? {
          text: automaticOutcome,
          tone: status === "failed" ? "danger" : "success",
        }
      : null;
  const displayName = meta.name === "Gary" ? "Champion" : meta.name;
  const cardDetails = detailItems ?? meta.pokemonTeam;
  const teamLayoutClass =
    cardDetails.length <= 3 ? "team-count-small" : "team-count-large";
  const championClass =
    meta.name === "Gary" ? "champion-progression-card" : "";

  const interactionClass = isLocked
    ? "trainer-card-locked"
    : isSelectable
      ? "trainer-card-selectable"
      : "";
  const selectedClass = isSelected ? "trainer-card-selected" : "";

  function selectTrainer() {
    if (!isSelectable || isLocked || !onSelect) {
      return;
    }

    onSelect();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!isSelectable || isLocked) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectTrainer();
    }
  }

  return (
    <article
      aria-disabled={isLocked}
      aria-checked={
        interactionRole === "radio" && isSelectable && !isLocked ? isSelected : undefined
      }
      aria-pressed={
        interactionRole === "button" && isSelectable && !isLocked ? isSelected : undefined
      }
      aria-label={
        isLocked
          ? `${displayName} locked`
          : isSelectable
            ? `${selectActionLabel} ${displayName}`
            : displayName
      }
      className={`progression-card ${status} progression-card--sprite-${spritePresentation} ${teamLayoutClass} ${championClass} ${interactionClass} ${selectedClass} ${className}`.trim()}
      onClick={selectTrainer}
      onKeyDown={handleKeyDown}
      role={isSelectable && !isLocked ? interactionRole : undefined}
      tabIndex={isSelectable && !isLocked ? 0 : undefined}
    >
      <div className="progression-card-top">
        <span className="progression-card-role">{roleLabel ?? displayName}</span>

        {showBadge && meta.badge ? (
          <LocalSprite
            alt={`${meta.badge} sprite`}
            className="trainer-card-badge-sprite"
            fallback={String(meta.number ?? "BD")}
            src={BADGE_IMAGE_PATHS[meta.badge]}
          />
        ) : null}
      </div>

      <strong className="trainer-card-name-label progression-card-name">{displayName}</strong>

      {resultStamp ? (
        <strong className={`result-stamp result-stamp--${resultStamp.tone}`}>
          {resultStamp.text}
        </strong>
      ) : null}

      <div className="progression-sprite-area">
        <LocalSprite
          alt={`${meta.name} sprite`}
          className="trainer-sprite stage-trainer-sprite"
          fallback={meta.fallback}
          src={spriteSrc ?? getTrainerSprite(meta.name)}
        />
      </div>

      {summaryLabel ? (
        <strong className="progression-card-summary">{summaryLabel}</strong>
      ) : (
        <ul className="trainer-team-list" aria-label={`${meta.name} Pokemon team`}>
          {cardDetails.map((detail, index) => (
            <li key={`${detail}-${index}`}>
              <span className="trainer-team-pokeball" aria-hidden="true" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      )}

      {locationLabel ? (
        <span className="progression-card-location">{locationLabel}</span>
      ) : null}
    </article>
  );
}
