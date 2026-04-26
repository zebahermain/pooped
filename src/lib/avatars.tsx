// Avatar registry shared by Onboarding + Profile.
// Image-based avatars are stored as their key string (e.g. "avocado") in
// localStorage / Supabase profiles.avatar. The legacy "💩" emoji avatar is
// kept for backwards compatibility with users who picked it before.

export type AvatarKey =
  | "avocado"
  | "pepper"
  | "ghost"
  | "alien"
  | "sprout"
  | "💩";

export interface AvatarOption {
  key: AvatarKey;
  label: string;
  /** Public image src — null means render the key string as text (emoji). */
  src: string | null;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { key: "avocado", label: "Avocado", src: "/avatars/avocado.png" },
  { key: "pepper", label: "Pepper", src: "/avatars/pepper.png" },
  { key: "ghost", label: "Ghostie", src: "/avatars/ghost.png" },
  { key: "alien", label: "Alien", src: "/avatars/alien.png" },
  { key: "sprout", label: "Sprout", src: "/avatars/sprout.png" },
  { key: "💩", label: "Classic", src: "/avatars/poop.png" },
];

export const getAvatar = (key: string): AvatarOption => {
  const found = AVATAR_OPTIONS.find((o) => o.key === key);
  return found ?? AVATAR_OPTIONS[AVATAR_OPTIONS.length - 1]; // fallback to 💩
};

interface AvatarDisplayProps {
  avatar: string;
  size?: number;
  className?: string;
}

export const AvatarDisplay = ({
  avatar,
  size = 64,
  className = "",
}: AvatarDisplayProps) => {
  const opt = getAvatar(avatar);
  if (opt.src) {
    return (
      <img
        src={opt.src}
        alt={opt.label}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={className}
      style={{ fontSize: size * 0.85, lineHeight: 1 }}
      aria-label={opt.label}
    >
      {opt.key}
    </span>
  );
};
