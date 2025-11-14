import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin";
import Sizer from "phaser3-rex-plugins/templates/ui/sizer/Sizer";
import { TextButton } from "../../ui/TextButton";
import { socket } from "../network/socket";

export class Hud extends Phaser.GameObjects.Container {
  roundText: Phaser.GameObjects.Text;
  timerText: Phaser.GameObjects.Text;
  phaseText: Phaser.GameObjects.Text;

  // log box
  logBox: any;
  logPanel: Sizer;

  researchIcons: Phaser.GameObjects.Image[] = [];
  virusIcons: Phaser.GameObjects.Image[] = [];
  manaIcons: Phaser.GameObjects.Image[] = [];
  actionButtons: Phaser.GameObjects.Text[] = [];

  rexUI: RexUIPlugin;

  // config
  maxResearch: number = 10;
  maxOutbreak: number = 5;
  travelCost: number = 5;
  cleanseCost: number = 3;
  bulldozeCost: number = 3;
  evolveCost: number = 5;

  researchCounter: number = 0;
  outbreakCounter: number = 0;
  manaCounter: number = 0;

  playerCount: number;
  lastCountdown: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.rexUI = scene.rexUI;
    this.createBackground();
    this.setupCharacterAbilities();
    this.createRoundTracker();
    this.createManaTracker();
    this.createTimer();
    this.createResearchTracker();
    this.createVirusTracker();
    this.createPhaseText();
    this.createLogBox();
    this.createActionButtons();
    this.disableAllButtons();

    scene.add.existing(this);
  }

  private createBackground() {
    const { width } = this.scene.scale;
    const bg = this.scene.add.rectangle(
      width / 2,
      40,
      width,
      90,
      0x1f2b10,
      0.6
    );
    bg.setStrokeStyle(2, 0x5c7e26, 0.8);
    this.add(bg);
  }

  private createRoundTracker() {
    this.roundText = this.scene.add.text(30, 20, "Round: 1 / 20", {
      fontSize: "16px",
      color: "#E5C184",
      fontFamily: "monospace",
      stroke: "#000000",
      strokeThickness: 3,
    });
    this.add(this.roundText);
  }

  private createManaTracker() {
    const sizer = this.rexUI.add.sizer({
      orientation: "x",
      x: 95,
      y: 60, // place below round tracker
      space: { item: 5 },
    });

    this.manaIcons = [];

    for (let i = 0; i < 5; i++) {
      const icon = this.scene.add
        .image(0, 0, "crystal")
        .setScale(0.35) // adjust based on asset size
        .setAlpha(0.3) // start semi-transparent
        .setTint(0x4db8ff);

      sizer.add(icon);
      this.manaIcons.push(icon);
    }

    sizer.layout();
    this.add(sizer);
  }

  private createTimer() {
    this.timerText = this.scene.add.text(
      this.scene.scale.width - 100,
      20,
      "⏱ --",
      {
        fontSize: "20px",
        color: "#E5C184",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 3,
      }
    );
    this.add(this.timerText);
  }

  private createResearchTracker() {
    const sizer = this.rexUI.add.sizer({
      orientation: "x",
      x: this.scene.scale.width / 2,
      y: 35,
      space: { item: 5 },
    });

    for (let i = 0; i < this.maxResearch; i++) {
      const icon = this.scene.add
        .image(0, 0, "flask")
        .setAlpha(0.5)
        .setScale(0.3);
      sizer.add(icon);
      this.researchIcons.push(icon);
    }

    sizer.layout();
    this.add(sizer);
  }

  // === Virus Tracker ===
  private createVirusTracker() {
    const sizer = this.rexUI.add.sizer({
      orientation: "x",
      x: this.scene.scale.width / 2,
      y: 65,
      space: { item: 5 },
    });

    for (let i = 0; i < this.maxOutbreak; i++) {
      const icon = this.scene.add
        .image(0, 0, "virus")
        .setScale(0.3)
        .setAlpha(0.5);
      sizer.add(icon);
      this.virusIcons.push(icon);
    }

    sizer.layout();
    this.add(sizer);
  }

  private createPhaseText() {
    this.phaseText = this.scene.add.text(this.scene.scale.width / 2, 150, "", {
      fontSize: "24px",
      color: "#ffe66d",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });

    this.phaseText.setOrigin(0.5).setAlpha(0);
    this.add(this.phaseText);
  }

  // === Log Box ===
  private createLogBox() {
    this.logPanel = this.rexUI.add.sizer({
      orientation: "y", // vertical stacking
      space: { item: 4 }, // spacing between log lines
    });

    const panelContainer = this.rexUI.add.sizer({ orientation: "y" });
    panelContainer.add(this.logPanel, { expand: true });

    this.logBox = this.rexUI.add
      .scrollablePanel({
        x: this.scene.scale.width - 160, // shift a little left if box is wider
        y: 166,
        width: 320, // ⬅️ wider log box
        height: 145, // ⬅️ taller if you want more lines visible
        scrollMode: 0,
        background: this.scene.add.rectangle(0, 0, 320, 200, 0x000000, 0.4),
        panel: {
          child: panelContainer,
          mask: { padding: 2 },
        },
        slider: {
          track: this.scene.add.rectangle(0, 0, 10, 200, 0x888888),
          thumb: this.scene.add.rectangle(0, 0, 10, 30, 0xffffff),
        },
        space: { left: 5, right: 5, top: 5, bottom: 5 },
      })
      .layout();

    // Mask fix
    const maskShape = this.scene.add
      .rectangle(this.logBox.x, this.logBox.y, 320, 145, 0xffffff, 0)
      .setOrigin(0.5);
    const mask = maskShape.createGeometryMask();
    this.logBox.getElement("panel").setMask(mask);

    this.add(this.logBox);
    this.logPanel.add(
      this.scene.add.text(0, 0, "📜 Event Log:", {
        fontSize: "16px",
        color: "#E5C184",
        fontStyle: "bold",
      })
    );

    this.addLog("Game started...");
  }

  private createActionButtons() {
    const actions = [
      "Move",
      "Treat",
      "Research",
      "Charge",
      `Travel (${this.travelCost}♦)`,
    ];

    this.addCharacterSkill(actions);

    const sizer = this.rexUI.add.sizer({
      orientation: "x",
      x: this.scene.scale.width / 2,
      y: this.scene.scale.height - 60,
      space: { item: 30 },
    });

    actions.forEach((label) => {
      const btn = new TextButton(this.scene, 0, 0, label, "small", () => {
        this.scene.events.emit("actionSelected", label);
      });

      sizer.add(btn);
      this.actionButtons.push(btn);
    });

    sizer.layout();
    this.add(sizer);
  }

  addCharacterSkill(actions: string[]) {
    const character = socket.mySelf.getVariable("char").value as string;

    switch (character) {
      case "bishop":
        actions.push(`Cleanse (${this.cleanseCost}♦)`);
        break;
      case "rook":
        actions.push(`Bulldoze (${this.bulldozeCost}♦)`);
        break;
    }
  }

  resolveResearchAction(count: number) {
    if (this.researchCounter >= this.maxResearch) return;

    this.addLog(`Research to cure increased`);

    this.scene.sound.play("research_up");
    const index = count - 1;
    this.researchCounter = count;

    const icon = this.researchIcons[index];

    // Animate the icon
    icon.setAlpha(1).setScale(0); // start hidden & shrunk

    this.scene.tweens.add({
      targets: icon,
      scale: { from: 0.0, to: 0.7 },
      duration: 1500,
      ease: "Back.Out",
      onComplete: () => {
        // shrink back to normal size with a little bounce
        this.scene.tweens.add({
          targets: icon,
          scale: 0.3,
          duration: 500,
          ease: "Bounce.Out",
        });

        icon.setAlpha(1);
      },
    });
  }

  resolveOutbreak(count: number) {
    if (this.outbreakCounter >= this.maxOutbreak) return;

    // TODO: outbreak sound
    const index = count - 1;
    this.outbreakCounter = count;

    const icon = this.virusIcons[index];
    if (!icon) return;

    icon.setAlpha(1).setScale(0); // start hidden & shrunk

    this.scene.tweens.add({
      targets: icon,
      scale: { from: 0.0, to: 0.7 },
      duration: 1500,
      ease: "Back.Out",
      onComplete: () => {
        // shrink back to normal size with a little bounce
        this.scene.tweens.add({
          targets: icon,
          scale: 0.3,
          duration: 500,
          ease: "Bounce.Out",
        });

        icon.setAlpha(1);
      },
    });
  }

  setRoundText(round: number) {
    this.roundText.setText(`Round: ${round} / 20`);
  }

  // === Utility Methods ===
  addLog(message: string) {
    const logLine = this.scene.add.text(0, 0, message, {
      fontSize: "14px",
      color: "#ffffff",
      wordWrap: { width: 280 },
    });

    this.logPanel.add(logLine, { align: "left" });

    this.logPanel.layout();
    this.logBox.layout();
    this.logBox.scrollToBottom();
  }

  disableAllButtons() {
    this.actionButtons.forEach((btn) => {
      btn.disableInteractive();
      btn.setAlpha(0.5);
    });
  }

  updateActionButtons(options: { hasVirus: boolean; isResearchNode: boolean }) {
    this.actionButtons.forEach((btn) => {
      const label = btn.text;

      if (label === "Charge") {
        if (this.manaCounter < 5) {
          btn.setInteractive({ useHandCursor: true });
          btn.setAlpha(1);
        } else {
          btn.disableInteractive();
          btn.setAlpha(0.5);
        }
      } else if (label === "Move") {
        btn.setInteractive({ useHandCursor: true });
        btn.setAlpha(1);
      } else if (label === "Treat") {
        if (options.hasVirus) {
          btn.setInteractive({ useHandCursor: true });
          btn.setAlpha(1);
        } else {
          btn.disableInteractive();
          btn.setAlpha(0.5);
        }
      } else if (label === "Research") {
        if (options.isResearchNode) {
          btn.setInteractive({ useHandCursor: true });
          btn.setAlpha(1);
        } else {
          btn.disableInteractive();
          btn.setAlpha(0.5);
        }
        return;
      } else if (label.indexOf("Travel") >= 0) {
        if (this.manaCounter >= this.travelCost) {
          btn.setInteractive({ useHandCursor: true });
          btn.setAlpha(1);
        } else {
          btn.disableInteractive();
          btn.setAlpha(0.5);
        }
      } else if (label.indexOf("Cleanse") >= 0) {
        if (this.manaCounter >= this.cleanseCost) {
          btn.setInteractive({ useHandCursor: true });
          btn.setAlpha(1);
        } else {
          btn.disableInteractive();
          btn.setAlpha(0.5);
        }
      } else if (label.indexOf("Bulldoze") >= 0) {
        if (this.manaCounter >= this.bulldozeCost) {
          btn.setInteractive({ useHandCursor: true });
          btn.setAlpha(1);
        } else {
          btn.disableInteractive();
          btn.setAlpha(0.5);
        }
      } else if (label.indexOf("Evolve") >= 0) {
        if (this.manaCounter >= this.evolveCost) {
          btn.setInteractive({ useHandCursor: true });
          btn.setAlpha(1);
        } else {
          btn.disableInteractive();
          btn.setAlpha(0.5);
        }
      }
    });
  }

  updateTimer(timeRemaining: number, phase: string) {
    if (phase === "action") {
      this.timerText.setText(`⏱ ${timeRemaining}`);

      if (timeRemaining <= 3 && timeRemaining !== this.lastCountdown) {
        this.lastCountdown = timeRemaining;
        this.phaseText.setText(`${timeRemaining}`).setAlpha(0);
        this.scene.sound.play("countdown");
        this.scene.tweens.add({
          targets: this.phaseText,
          alpha: { from: 0, to: 1 },
          duration: 500,
          yoyo: true,
        });
      }
    } else {
      this.timerText.setText(`⏱`);
    }
  }

  updateMana(count: number) {
    this.manaCounter = count;
    this.manaIcons.forEach((icon, index) => {
      const alpha = index < count ? 1 : 0.3;
      icon.setAlpha(alpha);
      this.scene.tweens.add({
        targets: icon,
        scale: { from: 0, to: 0.8 },
        duration: 500,
        ease: "Back.Out",
        onComplete: () => {
          this.scene.tweens.add({
            targets: icon,
            scale: 0.35,
            duration: 300,
            ease: "Bounce.Out",
          });
        },
      });
    });
  }

  setPhaseMessage(message: string) {
    this.phaseText.setText(message).setAlpha(0);

    this.scene.tweens.add({
      targets: this.phaseText,
      alpha: { from: 0, to: 1 },
      duration: 1000,
      yoyo: true,
      hold: 1500,
      onComplete: () => this.phaseText.setAlpha(0),
    });

    this.addLog(`${message}`);
  }

  setupCharacterAbilities() {
    const mySelf = socket.mySelf;
    const character = mySelf.getVariable("char").value as string;

    if (character === "knight") {
      this.travelCost = 3;
    }
  }
}
