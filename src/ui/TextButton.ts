import Phaser from "phaser";
import { buttonStyle, buttonHoverColors } from "../styles/buttonStyle";
import { Size } from "../styles";

export class TextButton extends Phaser.GameObjects.Text {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    size: Size = "medium",
    onClick: () => void
  ) {
    super(scene, x, y, label, buttonStyle(size));

    this.setOrigin(0.5);
    this.setInteractive({ useHandCursor: true });

    // Add to scene
    scene.add.existing(this);

    // === Hover effects ===
    this.on("pointerover", () => {
      this.setStyle({ backgroundColor: buttonHoverColors.default });
      scene.tweens.add({
        targets: this,
        scale: 1.05,
        duration: 100,
        ease: "Power1",
      });
    });

    this.on("pointerout", () => {
      this.setStyle({ backgroundColor: "#48691E" });
      scene.tweens.add({
        targets: this,
        scale: 1,
        duration: 80,
        ease: "Power1",
      });
    });

    // === Click effect ===
    this.on("pointerup", () => {
      if (scene.sound) scene.sound.play("button_click", { volume: 0.5 });
      onClick?.();
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeAllListeners();
      scene.tweens.killTweensOf(this);
    });
  }
}
