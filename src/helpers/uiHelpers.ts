/**
 * Create a styled HTML input box overlayed on Phaser canvas
 * @param scene - Phaser.Scene (used for canvas offset & cleanup hooks)
 * @param placeholder - placeholder text
 * @param top - top position (relative to canvas)
 * @param width - default 300px
 * @returns the created HTMLInputElement
 */
export function createTextInput(
  scene: Phaser.Scene,
  placeholder: string,
  top: number,
  width: number = 300
): HTMLInputElement {
  const { scale } = scene;
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;

  Object.assign(input.style, {
    position: "absolute",
    top: `${scale.canvas.offsetTop + top}px`,
    left: `${scale.canvas.offsetLeft + scale.width / 2 - width / 2}px`,
    width: `${width}px`,
    height: `40px`,
    fontSize: `20px`,
    textAlign: "center",
    border: "2px solid white",
    background: "#333",
    color: "#fff",
    outline: "none",
    zIndex: "1000",
  } as CSSStyleDeclaration);

  document.body.appendChild(input);

  return input;
}

/**
 * Helper to safely remove input elements
 */
export function cleanupInputs(inputs: (HTMLInputElement | null)[]) {
  inputs.forEach((input) => {
    if (input && input.parentNode) {
      input.parentNode.removeChild(input);
    }
  });
}
