export const theme = {
  colors: {
    background: "#FFFFFF",
    sidebar: "#F5F5F7",
    sentBubble: "#0B93F6",
    receivedBubble: "#E9E9EB",
    text: "#1C1C1E",
    textLight: "#8E8E93",
    border: "#E5E5EA",
    danger: "#FF3B30",
    online: "#34C759",
  },
  fonts: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  borderRadius: {
    sm: "8px",
    md: "16px",
    lg: "20px",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 3px rgba(0,0,0,0.08)",
    md: "0 4px 12px rgba(0,0,0,0.10)",
  },
};

export type Theme = typeof theme;
