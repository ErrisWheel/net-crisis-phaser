import { SFSUser, SFSUserVariable, SetUserVariablesRequest } from "sfs2x-api";
import { subtitleStyle, titleStyle } from "../../styles";
import { TextButton } from "../../ui/TextButton";
import { socket } from "../network/socket";
import { LobbyEvents } from "../network/lobbyEvents";
import { BaseScene } from "./BaseScene";

interface LobbySceneData {
  roomCode: string;
  players: SFSUser[];
}

export class LobbyScene extends BaseScene {
  lobbyEvents!: LobbyEvents;

  roomCode!: string;
  players: SFSUser[] = [];

  private playerListSizer!: any;

  // buttons
  private readyBtn!: TextButton;
  private leaveBtn!: TextButton;

  countdownMax = 3;
  private countdownText!: Phaser.GameObjects.Text;
  private selectedCharacter: string = "";
  private characterIcons: { [key: string]: Phaser.GameObjects.Image } = {};

  constructor() {
    super({ key: "LobbyScene" });
  }

  create(data: LobbySceneData) {
    console.log("Entering LobbyScene with data:", data);
    this.roomCode = data.roomCode;
    this.players = data.players;

    this.createTitle();
    this.createRoomCode();
    this.createCharacterSelection();
    this.setCharacterSelection("pawn"); // set default

    this.createPlayerList();
    this.createButtons();
    this.createCountdown();

    this.lobbyEvents = new LobbyEvents(this);
  }

  private createTitle() {
    const { width, height } = this.scale;

    const title = this.add
      .text(width / 2 - 20, height * 0.1, "NET CRISIS", titleStyle())
      .setOrigin(0.5);

    const virusIcon = this.add.image(
      title.x + title.width / 2 + 50,
      height * 0.1,
      "virus"
    );
    virusIcon.setDisplaySize(60, 60);
  }

  private createRoomCode() {
    const { width } = this.scale;

    const roomCodeText = this.add
      .text(width / 2, this.scale.height * 0.2, `Room Code: ${this.roomCode}`, {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#E5C184", // warm gold like title
        backgroundColor: "#3B4D1C", // dark olive green panel
        padding: { x: 16, y: 8 },
        stroke: "#2D2D2D", // subtle dark outline
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#000000",
          blur: 2,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    roomCodeText.on("pointerup", () => {
      this.sound.play("button_click");
      navigator.clipboard.writeText(this.roomCode);
      const copied = this.add
        .text(width / 2, this.scale.height * 0.32, "Copied!", {
          fontSize: "16px",
          color: "#00ff00",
        })
        .setOrigin(0.5);

      this.time.delayedCall(1000, () => copied.destroy());
    });
  }

  private createPlayerList() {
    const { width, height } = this.scale;
    this.playerListSizer = this.rexUI.add.sizer({
      orientation: "y",
      x: width / 2,
      y: height * 0.38,
      space: { item: 10 },
    });

    this.players.forEach((p) => this.addPlayerEntry(p));

    this.playerListSizer.layout();
    this.add.existing(this.playerListSizer);
  }

  private createCharacterSelection() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.26, "Select Your Character", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#E5C184",
      })
      .setOrigin(0.5);

    const charSizer = this.rexUI.add.sizer({
      orientation: "x",
      x: width / 2,
      y: height * 0.3,
      space: { item: 20 },
    });

    const characters = ["pawn", "knight", "bishop", "rook"];

    characters.forEach((key) => {
      const icon = this.add.image(0, 0, key).setScale(0.4);
      icon.setInteractive({ useHandCursor: true });
      icon.setAlpha(0.5); // unselected look

      icon.on("pointerup", () => {
        this.sound.play("button_click");
        this.setCharacterSelection(key);
      });

      this.characterIcons[key] = icon;
      charSizer.add(icon);
    });

    charSizer.layout();
    this.add.existing(charSizer);
  }

  private setCharacterSelection(charKey: string) {
    if (this.selectedCharacter === charKey) return;

    this.selectedCharacter = charKey;

    // Set SmartFox variable
    const userVars = [];
    const charVar = new SFSUserVariable("char", charKey);
    userVars.push(charVar);

    socket.send(new SetUserVariablesRequest(userVars));

    // Update UI tint
    Object.entries(this.characterIcons).forEach(([key, img]) => {
      if (key === charKey) {
        img.setAlpha(1).setTint(0x4db8ff).setScale(0.45);
      } else {
        img.setAlpha(0.5).setTint(0xffffff).setScale(0.4);
      }
    });
  }

  private addPlayerEntry(player: SFSUser) {
    const row = this.rexUI.add.sizer({
      orientation: "x",
      space: { item: 10 },
    });

    // ✅ character icon
    const charKey = player.getVariable("char")?.value || "pawn"; // default pawn
    const charImg = this.add.image(0, 0, charKey).setScale(0.3);

    const nameText = this.add.text(0, 0, player.name, {
      fontSize: "20px",
      color: "#FFFFFF",
    });

    const isReady = player.getVariable("isReady")?.value || false;

    console.log(
      `Player ${player.name} isReady:`,
      isReady,
      player.getVariables()
    );

    const statusIcon = this.add.image(0, 0, isReady ? "check" : "cross");
    statusIcon.setTint(isReady ? 0x00ff00 : 0xff0000);
    statusIcon.setDisplaySize(20, 20);

    row.add(charImg);
    row.add(nameText, { expand: false });
    row.add(statusIcon, { align: "right" });

    this.playerListSizer.add(row, { expand: false });
  }

  updatePlayerList() {
    console.log("Updating player list in LobbyScene", this.players);
    this.playerListSizer.clear(true);
    this.players.forEach((p) => this.addPlayerEntry(p));
    this.playerListSizer.layout();
  }

  startCountdown() {
    const seconds = this.countdownMax;
    let timeLeft = seconds;

    this.countdownText.setVisible(true);
    this.countdownText.setText(`Starting in ${timeLeft}...`);

    this.time.addEvent({
      delay: 1000,
      repeat: seconds - 1,
      callback: () => {
        timeLeft--;
        if (timeLeft > 0) {
          this.sound.play("countdown");
          this.countdownText.setText(`Starting in ${timeLeft}...`);
        } else {
          this.sound.play("countdown");
          this.countdownText.setText("Crisis Begins!");
          this.time.delayedCall(1000, () => {
            this.sound.play("begin");
            this.gotoScene("Game");
          });
        }
      },
    });
  }

  cleanup(): void {
    this.lobbyEvents.reset();
  }

  private createButtons() {
    const { width, height } = this.scale;

    this.readyBtn = new TextButton(this, 0, 0, "Ready", "medium", () => {
      console.log(`toggled ready`);

      const isReady = socket.mySelf.getVariable("isReady")?.value || false;

      const newReadyState = new SFSUserVariable("isReady", !isReady);
      socket.send(new SetUserVariablesRequest([newReadyState]));

      this.readyBtn.setText(!isReady ? "Unready" : "Ready");
    });

    this.leaveBtn = new TextButton(this, 0, 0, "Leave", "medium", () => {
      this.lobbyEvents.leaveRoom();
      this.gotoScene("MainMenu");
    });

    const buttonSizer = this.rexUI.add.sizer({
      orientation: "x",
      x: width / 2,
      y: height * 0.85,
      space: { item: 40 },
    });

    buttonSizer.add(this.readyBtn);
    buttonSizer.add(this.leaveBtn);

    buttonSizer.layout();
    this.add.existing(buttonSizer);
  }

  private createCountdown() {
    const { width, height } = this.scale;
    this.countdownText = this.add
      .text(width / 2, height * 0.75, "", subtitleStyle())
      .setOrigin(0.5)
      .setVisible(false);
  }
}
