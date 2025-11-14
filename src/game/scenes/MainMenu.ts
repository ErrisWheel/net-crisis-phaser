import Phaser from "phaser";
import { titleStyle } from "../../styles";
import { TextButton } from "../../ui/TextButton";

export class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    const { width, height } = this.scale;

    // === Title ===
    const title = this.add.text(
      width / 2,
      height * 0.2,
      "NET CRISIS",
      titleStyle("large")
    );
    title.setOrigin(0.5);

    // === Virus Icon (next to title) ===
    const virusIcon = this.add.image(width / 2, height * 0.35, "virus"); // assumes 'virus' key is loaded
    virusIcon.setDisplaySize(80, 80);

    const buttons = [
      { label: "Create New Game", scene: "CreateGameScene" },
      { label: "Join Game", scene: "JoinGameScene" },
      // { label: "How to Play", scene: "HowToPlayScene" },
    ];

    buttons.forEach((btn, i) => {
      const y = height * 0.55 + i * 70;
      new TextButton(this, width / 2, y, btn.label, "medium", () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start(btn.scene);
        });
      });
    });
  }
}
