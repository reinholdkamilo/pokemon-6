import { LocalSprite } from "@/components/LocalSprite";
import { BADGE_IMAGE_PATHS } from "@/lib/imagePaths";

const KANTO_BADGES = [
  "Boulder Badge",
  "Cascade Badge",
  "Thunder Badge",
  "Rainbow Badge",
  "Soul Badge",
  "Marsh Badge",
  "Volcano Badge",
  "Earth Badge",
];

type BadgeDisplayProps = {
  earnedBadges?: string[];
};

export function BadgeDisplay({ earnedBadges = [] }: BadgeDisplayProps) {
  const earnedBadgeSet = new Set(earnedBadges);

  return (
    <div className="badge-grid" aria-label="Kanto badges">
      {KANTO_BADGES.map((badgeName, index) => {
        const isEarned = earnedBadgeSet.has(badgeName);

        return (
          <div
            className={`badge-item ${isEarned ? "earned" : "locked"}`}
            key={badgeName}
          >
            <LocalSprite
              alt={`${badgeName} sprite`}
              className="badge-token badge-sprite"
              fallback={String(index + 1)}
              src={BADGE_IMAGE_PATHS[badgeName]}
            />
            <div>
              <strong>{badgeName}</strong>
              <span>{isEarned ? "Earned" : "Locked"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
