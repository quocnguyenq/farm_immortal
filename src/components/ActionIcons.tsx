export type ActionIconId = "seed" | "water" | "fert" | "harvest" | "warehouse" | "shop" | "unlock" | "fish";

export function ActionIcon({ id }: { id: ActionIconId }) {
  const common = { viewBox: "0 0 48 48", className: "h-7 w-7" as const };
  switch (id) {
    case "seed":
      return (
        <svg {...common}>
          <path d="M16 34 c0 8 16 8 16 0 c0 -12 -8 -22 -8 -22 s-8 10 -8 22Z" fill="#8d6e63" stroke="#5d4037" strokeWidth="1.5" />
          <ellipse cx="24" cy="18" rx="5" ry="7" fill="#f6d365" stroke="#c9a227" strokeWidth="1.2" />
          <path d="M24 12 C18 8 16 4 18 4" stroke="#66bb6a" strokeWidth="2" fill="none" />
        </svg>
      );
    case "water":
      return (
        <svg {...common}>
          <rect x="10" y="18" width="18" height="14" rx="3" fill="#90caf9" stroke="#1565c0" strokeWidth="1.6" />
          <path d="M28 22 h10 l2 6 -12 2" fill="#64b5f6" stroke="#1565c0" strokeWidth="1.6" />
          <path d="M36 30 c0 6 -6 10 -6 10" stroke="#29b6f6" strokeWidth="2.2" fill="none" />
          <circle cx="16" cy="24" r="2" fill="#e3f2fd" />
        </svg>
      );
    case "fert":
      return (
        <svg {...common}>
          <rect x="14" y="14" width="20" height="24" rx="4" fill="#8d6e63" stroke="#5d4037" strokeWidth="1.6" />
          <rect x="18" y="8" width="12" height="8" rx="2" fill="#a1887f" />
          <path d="M20 22 h8 M20 28 h8 M20 34 h6" stroke="#d7ccc8" strokeWidth="2" />
        </svg>
      );
    case "harvest":
      return (
        <svg {...common}>
          <path d="M12 32 c12 -16 24 -16 26 0" fill="#90a4ae" stroke="#455a64" strokeWidth="1.6" />
          <path d="M14 32 c10 -10 20 -10 22 0" fill="#cfd8dc" />
          <rect x="22" y="30" width="4" height="12" fill="#6d4c41" />
        </svg>
      );
    case "warehouse":
      return (
        <svg {...common}>
          <path d="M8 24 L24 10 L40 24 v16 h-32Z" fill="#d7b07a" stroke="#8d6e3a" strokeWidth="1.6" />
          <rect x="20" y="28" width="8" height="12" fill="#6d4c41" />
          <path d="M8 24 L24 10 L40 24" fill="#c9954a" />
        </svg>
      );
    case "shop":
      return (
        <svg {...common}>
          <rect x="10" y="20" width="28" height="18" fill="#ffcc80" stroke="#ef6c00" strokeWidth="1.5" />
          <path d="M10 20 l4 -8 h20 l4 8" fill="#ffb74d" stroke="#ef6c00" strokeWidth="1.5" />
          <circle cx="16" cy="38" r="3" fill="#5d4037" />
          <circle cx="32" cy="38" r="3" fill="#5d4037" />
        </svg>
      );
    case "unlock":
      return (
        <svg {...common}>
          <rect x="12" y="22" width="24" height="18" rx="3" fill="#f9a825" stroke="#ef6c00" strokeWidth="1.8" />
          <path d="M17 22 v-6 a7 7 0 0 1 14 0" fill="none" stroke="#ef6c00" strokeWidth="3" />
        </svg>
      );
    case "fish":
      return (
        <svg {...common}>
          <path d="M8 24 c8 -10 22 -10 30 0 c-8 10 -22 10 -30 0Z" fill="#4fc3f7" stroke="#0277bd" strokeWidth="1.6" />
          <path d="M38 24 l6 -6 v12Z" fill="#29b6f6" stroke="#0277bd" strokeWidth="1.4" />
          <circle cx="15" cy="22" r="2" fill="#01579b" />
        </svg>
      );
  }
}
