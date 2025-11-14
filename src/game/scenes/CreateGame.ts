import { subtitleStyle, titleStyle } from "../../styles";
import { cleanupInputs, createTextInput } from "../../helpers/uiHelpers";
import { TextButton } from "../../ui/TextButton";
import { connectToSocket } from "../network/socket";
import { CreateGameEvents } from "../network/createGameEvents";
import { BaseScene } from "./BaseScene";

export class CreateGameScene extends BaseScene {
  private nameInput: HTMLInputElement | null = null;
  private createGameEvents: CreateGameEvents;
  private actionButtons: TextButton[];
  private statusText!: Phaser.GameObjects.Text;

  playerName: string = "";

  constructor() {
    super({ key: "CreateGameScene" });
  }

  create() {
    this.createTitle();
    this.createSubtitle();
    this.createNameInput();
    this.createButtons();
    this.createStatusText();

    this.createGameEvents = new CreateGameEvents(this);
  }

  private createTitle() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.15, "NET CRISIS", titleStyle())
      .setOrigin(0.5);

    const virusIcon = this.add.image(width / 2, height * 0.25, "virus");
    virusIcon.setDisplaySize(60, 60);
  }

  private createSubtitle() {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height * 0.4, "Create New Game", subtitleStyle())
      .setOrigin(0.5);
  }

  private createNameInput() {
    this.nameInput = createTextInput(
      this,
      "Enter Name...",
      this.scale.height * 0.45
    );

    if (this.nameInput) {
      // Validation: only allow alphanumeric and limit to 8 characters
      this.nameInput.addEventListener("input", (e) => {
        const input = e.target as HTMLInputElement;
        // Remove non-alphanumeric characters and limit to 8 chars
        input.value = input.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
      });
    }
  }

  private createButtons() {
    const { width, height } = this.scale;

    const backBtn = new TextButton(this, 0, 0, "Back", "medium", () => {
      this.gotoScene("MainMenu");
    });

    const createBtn = new TextButton(
      this,
      0,
      0,
      "Create Game",
      "medium",
      () => {
        this.playerName = this.nameInput?.value.trim() ?? "";
        this.disableAllButtons();
        if (!this.playerName) {
          window.alert("Please enter your name first!");
          return;
        }
        this.setStatusMessage('Connecting to server...')
        connectToSocket(
          this.createGameEvents.loginPlayer.bind(this.createGameEvents)
        );
      }
    );

    this.actionButtons = [createBtn, backBtn];

    // Layout buttons using rexUI
    const buttonSizer = this.rexUI.add.sizer({
      orientation: "x",
      x: width / 2,
      y: height * 0.6,
      space: { item: 40 },
    });

    buttonSizer.add(backBtn, { expand: false, align: "center" });
    buttonSizer.add(createBtn, { expand: false, align: "center" });
    buttonSizer.layout();

    this.add.existing(buttonSizer);
  }

  private createStatusText() {
    const { width, height } = this.scale;
    this.statusText = this.add
      .text(width / 2, height * 0.7, "", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  }

  setStatusMessage(message: string) {
    this.statusText.setText(message);
  }

  disableAllButtons() {
    this.actionButtons.forEach((btn) => {
      btn.disableInteractive();
      btn.setAlpha(0.5);
    });
  }

  // === Cleanup ===
  cleanup() {
    cleanupInputs([this.nameInput]);
    this.nameInput = null;
    this.createGameEvents.reset();
  }
}
