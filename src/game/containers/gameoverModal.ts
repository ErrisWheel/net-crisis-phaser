export class GameOverDialog extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    result: "win" | "lose",
    onMainMenu: () => void
  ) {
    super(scene, scene.cameras.main.centerX, scene.cameras.main.centerY);
    scene.add.existing(this);

    const isWin = result === "win";
    const message = isWin ? "🎉 You Win!" : "💀 You Lost!";
    const bgColor = isWin ? 0x4caf50 : 0xeb5356; // green for win, red for lose
    const borderColor = isWin ? 0xffffff : 0x444444;

    const sound = isWin ? "victory" : "outbreak";

    scene.sound.play(sound);
    // Modal background
    const bg = scene.add
      .rectangle(0, 0, 280, 150, bgColor, 0.95)
      .setStrokeStyle(3, borderColor)
      .setOrigin(0.5);

    const text = scene.add
      .text(0, -30, message, {
        fontSize: "22px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 240 },
      })
      .setOrigin(0.5);

    // Main Menu button
    const btnBg = scene.add
      .rectangle(0, 40, 120, 40, 0x222222)
      .setStrokeStyle(2, 0xffffff)
      .setOrigin(0.5)
      .setInteractive();

    const btnText = scene.add
      .text(0, 40, "Main Menu", {
        fontSize: "18px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    btnBg.on("pointerover", () => btnBg.setFillStyle(0x444444));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0x222222));
    btnBg.on("pointerup", () => {
      scene.sound.play("button_click");
      window.location.reload()
      this.destroy();
      onMainMenu();
    });

    this.add([bg, text, btnBg, btnText]);

    // Dark overlay
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
}
