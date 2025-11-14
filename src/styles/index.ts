export type Size = "small" | "medium" | "large";

export const sizeMap: Record<Size, number> = {
  small: 28,
  medium: 48,
  large: 64,
};

export const titleStyle = (
  size: Size = "medium"
): Phaser.Types.GameObjects.Text.TextStyle => {
  const sizeInPx = sizeMap[size];
  return {
    fontSize: `${sizeInPx}px`,
    color: "#E5C184",
    fontStyle: "bold",
    stroke: "#48691E",
    strokeThickness: 6,
    shadow: {
      offsetX: 2,
      offsetY: 2,
      color: "#000000",
      blur: 2,
      fill: true,
    },
  };
};

export const subtitleStyle = (
  size: Size = "small"
): Phaser.Types.GameObjects.Text.TextStyle => {
  const sizeInPx = sizeMap[size];
  return {
    fontFamily: "monospace",
    fontSize: `${sizeInPx}px`,
    color: "#E5C184", // warm beige to match title
    // fontStyle: "italic",
    stroke: "#2D2D2D", // subtle dark outline for contrast
    strokeThickness: 2,
    shadow: {
      offsetX: 1,
      offsetY: 1,
      color: "#000000",
      blur: 1,
      fill: true,
    },
  };
};
