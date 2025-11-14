import { Board } from "../containers/board";
import { GameOverDialog } from "../containers/gameoverModal";
import { Hud } from "../containers/hud";
import { ConfirmDialog } from "../containers/modal";
import { NodeContainer } from "../containers/node";
import { GameEvents } from "../network/gameEvents";
import { getRoomVariable, socket } from "../network/socket";
import { BaseScene } from "./BaseScene";
// import { NodeConfig, EdgeConfig } from "../configs/cluster-web";
import { NodeConfig, EdgeConfig, mainX, mainY } from "../configs/sea";

export class Game extends BaseScene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  msg_text: Phaser.GameObjects.Text;
  board: Board;

  dialog: ConfirmDialog | null = null;
  gameOverDialog: GameOverDialog | null = null;

  gameEvents!: GameEvents;
  hud: Hud;

  constructor() {
    super({ key: "Game" });
  }

  create() {
    this.board = new Board(this, mainX, mainY, {
      nodeConfig: NodeConfig,
      edgeConfig: EdgeConfig,
    });
    this.gameEvents = new GameEvents(this);
    this.gameEvents.setPlayerInitialState();

    this.hud = new Hud(this, 0, 0);

    this.handleActionSelection();
  }

  private handleActionSelection() {
    this.board?.clearHighlights();
    this.events.on("actionSelected", (action: string) => {
      this.board?.clearHighlights();

      if (action === "Move") {
        this.handleMoveAction();
      }

      if (action === "Treat") {
        this.handleTreatAction();
      }

      if (action === "Research") {
        this.handleResearchAction();
      }

      if (action === "Charge") {
        this.handleCharge();
      }

      if (action.indexOf("Travel") >= 0) {
        this.handleTravel();
      }

      if (action.indexOf("Cleanse") >= 0) {
        this.handleCleanse();
      }

      if (action.indexOf("Bulldoze") >= 0) {
        this.handleBulldoze();
      }
    });
  }

  private handleMoveAction() {
    if (!this.board) return;

    const myNodePid = socket.mySelf.getVariable("nodePid").value as number;
    const connectedNodes = this.board.getConnectedNodes(myNodePid);

    connectedNodes.forEach((node) => {
      node.setHighlight(true);
      node.setInteractive();
      node.once("pointerup", () => {
        this.sound.play("button_click");
        this.confirmMove(node.id, connectedNodes);
      });
    });
  }

  private handleTravel() {
    const myNodePid = socket.mySelf.getVariable("nodePid").value as number;

    const nodes = this.board.getAllNodesExcept(myNodePid);

    nodes.forEach((node) => {
      node.setHighlight(true);
      node.setInteractive();
      node.once("pointerup", () => {
        this.sound.play("button_click");
        this.confirmMove(node.id, nodes, "Travel");
      });
    });
  }

  private handleCleanse() {
    const myNodePid = socket.mySelf.getVariable("nodePid").value as number;
    const nodes = this.board.getConnectedNodes(myNodePid, true);

    nodes.forEach((node) => {
      node.setHighlight(true);
      node.setInteractive();
      node.once("pointerup", () => {
        this.sound.play("button_click");
        this.confirmCleanse(node.id, nodes);
      });
    });
  }

  private handleBulldoze() {
    const myNodePid = socket.mySelf.getVariable("nodePid").value as number;
    const connectedNodes = this.board.getConnectedNodes(myNodePid);

    connectedNodes.forEach((node) => {
      node.setHighlight(true);
      node.setInteractive();
      node.once("pointerup", () => {
        this.sound.play("button_click");
        this.confirmBulldoze(node.id, connectedNodes);
      });
    });
  }

  handleTreatAction() {
    console.log("Treat action triggered");

    const currentNodeId = socket.mySelf.getVariable("nodePid").value as number;
    const currentNode = this.board.nodeMap.get(currentNodeId);

    currentNode?.setHighlight(true);
    currentNode?.setInteractive();
    currentNode?.once("pointerup", () => {
      this.sound.play("button_click");
      this.confirmTreat(currentNodeId);
    });
  }

  handleResearchAction() {
    console.log("Research action triggered");

    const currentNodeId = socket.mySelf.getVariable("nodePid").value as number;
    const currentNode = this.board.nodeMap.get(currentNodeId);

    currentNode?.setHighlight(true);
    currentNode?.setInteractive();
    currentNode?.once("pointerup", () => {
      this.sound.play("button_click");
      this.confirmResearch(currentNodeId);
    });
  }

  handleCharge() {
    this.sound.play("button_click");
    this.confirmCharge();
  }

  private confirmMove(
    targetNodeId: number,
    connectedNodes: NodeContainer[],
    moveType: string = "Move"
  ) {
    if (this.dialog) {
      this.dialog.destroy();
      this.dialog = null;
    }
    var phase = getRoomVariable("phase").value as string;

    this.dialog = new ConfirmDialog(
      this,
      `${moveType} to node ${targetNodeId}?`,
      () => {
        if (phase !== "action" || !this.hud || !this.board) {
          this.dialog?.close();
          return; // only allow move in action phase
        }

        this.hud.addLog(`Confirmed to move to node ${targetNodeId}`);
        this.gameEvents.emitPlayerAction(moveType.toLowerCase(), targetNodeId);

        this.board.clearHighlights();
        connectedNodes.forEach((node) => {
          node.nodeText.removeAllListeners();
          node.nodeImage.removeAllListeners();
          node.nodeText.disableInteractive();
          node.nodeImage.disableInteractive();
        });

        this.hud.disableAllButtons();
      },
      () => {
        console.log("Move cancelled");
        if (phase !== "action") {
          this.dialog?.close();
          return;
        }
        if (this.board) {
          this.board.clearHighlights();
        }
      }
    );
  }

  private confirmBulldoze(targetNodeId: number, nodes: NodeContainer[]) {
    if (this.dialog) {
      this.dialog.destroy();
      this.dialog = null;
    }
    var phase = getRoomVariable("phase").value as string;

    this.dialog = new ConfirmDialog(
      this,
      `Bulldoze node ${targetNodeId}?`,
      () => {
        if (phase !== "action" || !this.hud || !this.board) {
          this.dialog?.close();
          return;
        }

        this.hud.addLog(`Confirmed to bulldoze to node ${targetNodeId}`);
        this.gameEvents.emitPlayerAction("bulldoze", targetNodeId);

        this.board.clearHighlights();
        nodes.forEach((node) => {
          node.nodeText.removeAllListeners();
          node.nodeImage.removeAllListeners();
          node.nodeText.disableInteractive();
          node.nodeImage.disableInteractive();
        });

        this.hud.disableAllButtons();
      },
      () => {
        if (phase !== "action") {
          this.dialog?.close();
          return;
        }
        if (this.board) {
          this.board.clearHighlights();
        }
      }
    );
  }

  private confirmCleanse(targetNodeId: number, nodes: NodeContainer[]) {
    if (this.dialog) {
      this.dialog.destroy();
      this.dialog = null;
    }
    var phase = getRoomVariable("phase").value as string;

    this.dialog = new ConfirmDialog(
      this,
      `Cleanse node ${targetNodeId}?`,
      () => {
        if (phase !== "action" || !this.hud || !this.board) {
          this.dialog?.close();
          return; // only allow move in action phase
        }

        this.hud.addLog(`Confirmed to cleanse to node ${targetNodeId}`);
        this.gameEvents.emitPlayerAction("cleanse", targetNodeId);

        this.board.clearHighlights();
        nodes.forEach((node) => {
          node.nodeText.removeAllListeners();
          node.nodeImage.removeAllListeners();
          node.nodeText.disableInteractive();
          node.nodeImage.disableInteractive();
        });

        this.hud.disableAllButtons();
      },
      () => {
        if (phase !== "action") {
          this.dialog?.close();
          return;
        }
        if (this.board) {
          this.board.clearHighlights();
        }
      }
    );
  }

  private confirmTreat(targetNodeId: number) {
    if (this.dialog) {
      this.dialog.destroy();
      this.dialog = null;
    }

    this.dialog = new ConfirmDialog(
      this,
      `Treat this node ${targetNodeId}?`,
      () => {
        var phase = getRoomVariable("phase").value as string;

        if (phase !== "action") return;

        this.hud.addLog(`Confirmed to treat node ${targetNodeId}`);
        this.gameEvents.emitPlayerAction("treat", targetNodeId);

        this.board.clearHighlights();

        const node = this.board.nodeMap.get(targetNodeId);
        if (node) {
          node.nodeText.removeAllListeners();
          node.nodeImage.removeAllListeners();
          node.nodeText.disableInteractive();
          node.nodeImage.disableInteractive();
        }

        this.hud.disableAllButtons();
      },
      () => {
        console.log("Treat action cancelled");
        if (this.board) {
          this.board.clearHighlights();
        }
      }
    );
  }

  private confirmResearch(targetNodeId: number) {
    if (this.dialog) {
      this.dialog.destroy();
      this.dialog = null;
    }

    this.dialog = new ConfirmDialog(
      this,
      `Research for the cure?`,
      () => {
        var phase = getRoomVariable("phase").value as string;

        if (phase !== "action") return;

        this.hud.addLog(`Confirmed to research for the cure`);

        const node = this.board.nodeMap.get(targetNodeId);
        this.gameEvents.emitPlayerAction("research", targetNodeId);

        this.board.clearHighlights();

        if (node) {
          node.nodeText.removeAllListeners();
          node.nodeImage.removeAllListeners();
          node.nodeText.disableInteractive();
          node.nodeImage.disableInteractive();
        }

        this.hud.disableAllButtons();
      },
      () => {
        console.log("Research action cancelled");
        if (this.board) {
          this.board.clearHighlights();
        }
      }
    );
  }

  private confirmCharge() {
    if (this.dialog) {
      this.dialog.destroy();
      this.dialog = null;
    }

    this.dialog = new ConfirmDialog(
      this,
      `Charge to increase mana?`,
      () => {
        var phase = getRoomVariable("phase").value as string;
        if (phase !== "action") return;
        this.hud.addLog(`Confirmed to charge`);

        this.gameEvents.emitPlayerAction("charge");

        this.board.clearHighlights();

        this.hud.disableAllButtons();
      },
      () => {
        console.log("Research action cancelled");
        if (this.board) {
          this.board.clearHighlights();
        }
      }
    );
  }

  resolveMoveAction(
    playerName: string,
    currentNodeId: number,
    targetNodeId: number
  ) {
    console.log("Resolving move action by:" + playerName);
    const currentNode = this.board.nodeMap.get(currentNodeId);
    const player = currentNode?.players?.get(playerName);
    const targetNode = this.board.nodeMap.get(targetNodeId);

    if (player && targetNode) {
      // move player
      this.hud.addLog(`${player.name} moves to ${targetNodeId}`);
      const start = player.getWorldPoint();
      const end = targetNode.getWorldPoint();
      this.children.add(player);
      player.setPosition(start.x, start.y);

      this.tweens.add({
        targets: player,
        x: end.x,
        y: end.y,
        duration: 500,
        ease: "Linear",
        onComplete: () => {
          currentNode?.removePlayer(playerName);
          targetNode?.addPlayer(player);
        },
      });
    }
  }

  cleanup(): void {
    // Clean up resources, listeners, etc. here
    this.gameEvents.reset();
    this.board.clearHighlights();
    this.hud.disableInteractive();
  }
}
