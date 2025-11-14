export class ConfirmDialog extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) {
    super(scene, scene.cameras.main.centerX, scene.cameras.main.centerY);
    scene.add.existing(this);

    const bg = scene.add
      .rectangle(0, 0, 300, 160, 0x1f2b10, 0.95)
      .setStrokeStyle(3, 0x5c7e26) // border
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(9999);

    scene.tweens.add({
      targets: bg,
      alpha: { from: 0.8, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Title/message text
    const text = scene.add
      .text(0, -30, message, {
        fontSize: "16px",
        fontFamily: "monospace",
        color: "#E5C184",
        align: "center",
        wordWrap: { width: 240 },
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10000);

    // === Shared button style ===
    const createButton = (label: string, x: number, onClick: () => void) => {
      const btnBg = scene.add
        .rectangle(x, 40, 100, 40, 0x2e3b17, 1)
        .setStrokeStyle(2, 0x5c7e26)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      const btnText = scene.add
        .text(x, 40, label, {
          fontSize: "16px",
          fontFamily: "monospace",
          color: "#E5C184",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5);

      // Hover animations
      btnBg.on("pointerover", () => {
        btnBg.setFillStyle(0x405322);
        scene.tweens.add({
          targets: btnBg,
          scale: { from: 1, to: 1.1 },
          duration: 150,
          ease: "Back.Out",
        });
      });

      btnBg.on("pointerout", () => {
        btnBg.setFillStyle(0x2e3b17);
        scene.tweens.add({
          targets: btnBg,
          scale: 1,
          duration: 150,
        });
      });

      btnBg.on("pointerup", () => {
        scene.sound.play("button_click");
        this.destroy();
        onClick();
      });

      return [btnBg, btnText];
    };

    // Yes button (styled)
    const [yesBtnBg, yesBtnText] = createButton("Yes", -60, onConfirm);

    // No button (styled)
    const [noBtnBg, noBtnText] = createButton(
      "No",
      60,
      onCancel ? onCancel : () => {}
    );


    this.add([bg, text, yesBtnBg, yesBtnText, noBtnBg, noBtnText]);

    // Dark transparent overlay
    const overlay = scene.add
      .rectangle(
        scene.cameras.main.centerX,
        scene.cameras.main.centerY,
        scene.cameras.main.width,
        scene.cameras.main.height,
        0x000000,
        0.5
      )
      .setScrollFactor(0)
      .setDepth(9998)
      .setInteractive();
    scene.add.existing(overlay);

    this.setDepth(9999);
    this.once("destroy", () => overlay.destroy());
  }

  close() {
    this.destroy(true);
  }
}
