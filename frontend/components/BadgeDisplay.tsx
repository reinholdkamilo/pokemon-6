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
            <span className="badge-token" aria-hidden="true">
              {index + 1}
            </span>
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
