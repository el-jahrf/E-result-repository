export const schoolTheme = {
  colors: {
    background: "#F7F1E7",
    surface: "#FFFFFF",

    primary: "#4A2C20",
    secondary: "#7A5038",
    accent: "#C8A878",

    text: "#2B211C",
    mutedText: "#6B5A50",
    border: "#C8A878",

    success: "#2E7D32",
    warning: "#B7791F",
    danger: "#B42318",
    info: "#2563EB",
  },

  school: {
    name: "RISING FOUNDATION ACADEMY",
    description: "School Result Management System",
  },
} as const;

export type SchoolTheme = typeof schoolTheme;