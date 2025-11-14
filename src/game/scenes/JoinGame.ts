import { subtitleStyle, titleStyle } from "../../styles";
import { TextButton } from "../../ui/TextButton";
import { cleanupInputs, createTextInput } from "../../helpers/uiHelpers";
import { SFSRoom } from "sfs2x-api";
import { JoinGameEvents } from "../network/joinGameEvent";
import { connectToSocket } from "../network/socket";
import { BaseScene } from "./BaseScene";

export class JoinGameScene extends BaseScene {
  roomInput: HTMLInputElement | null = null;
  nameInput: HTMLInputElement | null = null;
  actionButtons: TextButton[];
  joinGameEvents: JoinGameEvents;

  constructor() {
    super({ key: "JoinGameScene" });
  }

  create() {
    this.createTitle();
    this.createSubtitle();
    this.createInputs();
    this.createButtons();

    this.joinGameEvents = new JoinGameEvents(this);
  }

  // === UI Sections ===
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
      .text(width / 2, height * 0.4, "Join Game", subtitleStyle())
      .setOrigin(0.5);
  }

  private createInputs() {
    const { height } = this.scale;
    this.roomInput = createTextInput(this, "Enter Room Code...", height * 0.45);
    this.nameInput = createTextInput(this, "Enter Your Name...", height * 0.55);

    if (this.nameInput) {
      // Validation: only allow alphanumeric and limit to 8 characters
      this.nameInput.addEventListener("input", (e) => {
        const input = e.target as HTMLInputElement;
        // Remove non-letters and limit to 8 chars
        input.value = input.value.replace(/[^a-zA-Z]/g, "").slice(0, 8);
      });
    }

    if (this.roomInput) {
      // Validation: only allow uppercase letters, limit to 6 characters
      this.roomInput.addEventListener("input", (e) => {
        const input = e.target as HTMLInputElement;
        // Keep only letters, convert to uppercase, and limit to 6 chars
        input.value = input.value
          .replace(/[^A-Z]/gi, "")
          .toUpperCase()
          .slice(0, 6);
      });
    }
  }

  private createButtons() {
    const { width, height } = this.scale;

    const backBtn = new TextButton(this, 0, 0, "Back", "medium", () =>
      this.gotoScene("MainMenu")
    );

    const joinBtn = new TextButton(this, 0, 0, "Join Game", "medium", () => {
      const roomCode = this.roomInput?.value.trim() ?? "";
      const playerName = this.nameInput?.value.trim() ?? "";

      if (!roomCode || !playerName) {
        window.alert("Please enter both Room Code and Name!");
        return;
      }

      connectToSocket(
        this.joinGameEvents.loginPlayer.bind(this.joinGameEvents)
      );
    });

    this.actionButtons = [backBtn, joinBtn];

    // Layout
    const buttonSizer = this.rexUI.add.sizer({
      orientation: "x",
      x: width / 2,
      y: height * 0.7,
      space: { item: 40 },
    });

    buttonSizer.add(backBtn, { expand: false, align: "center" });
    buttonSizer.add(joinBtn, { expand: false, align: "center" });
    buttonSizer.layout();

    this.add.existing(buttonSizer);
  }

  gotoLobby(room: SFSRoom) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("LobbyScene", {
        roomCode: room.name,
        players: room.getPlayerList(),
      });
    });
  }

  disableAllButtons() {
    this.actionButtons.forEach((btn) => {
      btn.disableInteractive();
      btn.setAlpha(0.5);
    });
  }

  // === Cleanup ===
  cleanup() {
    cleanupInputs([this.roomInput, this.nameInput]);
    this.roomInput = null;
    this.nameInput = null;

    this.joinGameEvents.reset();
  }
}
