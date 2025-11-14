import { Size } from ".";

const sizeMap: Record<Size, number> = {
  small: 18,
  medium: 22,
  large: 32
}

export const buttonHoverColors = {
  default: "#5C7E26",
  danger: "#D34C4C",
  disabled: "#777777",
};

export const buttonStyle = (
  size: Size
): Phaser.Types.GameObjects.Text.TextStyle => {
  return {
    fontSize: `${sizeMap[size]}px`,
    backgroundColor: "#48691E", // olive
    color: "#FFFFFF",
    padding: { x: 20, y: 10 },
    fontFamily: "monospace",
  };
};
