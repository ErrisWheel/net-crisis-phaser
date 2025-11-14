import { SFSUserVariable } from "sfs2x-api";
import { socket } from "./socket";
import * as SFS2X from "sfs2x-api";
import { Game } from "../scenes/Game";
import {
  ON_EXTENSION_RESPONSE_EVENT_RESPONSE,
  ON_ROOM_VARIABLES_UPDATE_EVENT_RESPONSE,
  ON_USER_VARIABLES_UPDATE_EVENT_RESPONSE,
} from "../../types/sfs2x-event";
import { GameOverDialog } from "../containers/gameoverModal";

export class GameEvents {
  maxPlayerAction = 2;

  constructor(private scene: Game) {
    socket.addEventListener(
      SFS2X.SFSEvent.ROOM_VARIABLES_UPDATE,
      this.onRoomVariablesUpdate,
      this
    );

    socket.addEventListener(
      SFS2X.SFSEvent.EXTENSION_RESPONSE,
      this.onExtensionResponse,
      this
    );

    socket.addEventListener(
      SFS2X.SFSEvent.USER_VARIABLES_UPDATE,
      this.onUserVariablesUpdate,
      this
    );
  }

  setPlayerInitialState() {
    const isInGameVar = new SFSUserVariable("isInGame", true);
    const nodePid = new SFSUserVariable("nodePid", 1);
    const actionCount = new SFSUserVariable("actionCount", 0);
    const mana = new SFSUserVariable("mana", 0);
    socket.send(
      new SFS2X.SetUserVariablesRequest([
        isInGameVar,
        nodePid,
        actionCount,
        mana,
      ])
    );
  }

  onRoomVariablesUpdate(event: ON_ROOM_VARIABLES_UPDATE_EVENT_RESPONSE) {
    console.log("onRoomVariablesUpdate:", event);
    const room = event.room;
    const changedVars = event.changedVars;

    if (changedVars.indexOf("phase") >= 0) {
      const phase = room.getVariable("phase").value as string;
      switch (phase) {
        case "action":
          this.scene.hud.setPhaseMessage(`${phase.toUpperCase()} phase`);
          this.doActionPhase();
          break;
        case "infection":
          this.scene.hud.setPhaseMessage(`${phase.toUpperCase()} phase`);
          this.doInfectionPhase();
          break;
      }
    }

    if (changedVars.indexOf("round") >= 0) {
      const round = room.getVariable("round").value as number;
      this.scene.hud.setPhaseMessage(`Round ${round}`);
      this.scene.hud.setRoundText(round);
    }

    if (changedVars.indexOf("researchNodeId") >= 0) {
      const currentResearchNodeId = this.scene.board.researchNodeId;
      const newResearchNodeId = room.getVariable("researchNodeId")
        .value as number;

      this.scene.board.nodeMap.get(currentResearchNodeId)?.updateImage("node");
      this.scene.board.nodeMap.get(newResearchNodeId)?.updateImage("flask");
      this.scene.board.researchNodeId = newResearchNodeId;
    }

    if (changedVars.indexOf("researchCount") >= 0) {
      console.log("resolving research action");
      const researchCount = room.getVariable("researchCount").value as number;
      this.scene.hud.resolveResearchAction(researchCount);
      this.doActionPhase();
    }
  }

  onExtensionResponse(event: ON_EXTENSION_RESPONSE_EVENT_RESPONSE) {
    console.log("game: extension response", event);
    const { cmd, params, room } = event;

    switch (cmd) {
      case "countdownTick":
        this.doCountdownTick(params, room);
        break;
      case "treatResolve":
        this.doTreatResolve(params, room);
        break;
      case "cleanseResolve":
        this.doTreatResolve(params, room, "cleanse");
        break;
      case "bulldozeResolve":
        this.doTreatResolve(params, room, "bulldoze");
        break;
      case "infect":
        this.doInfect(params, room);
        break;
      case "outbreak":
        this.doOutbreak(params, room);
        break;
      case "gameLost":
        this.doGameLost();
        break;
      case "gameWon":
        this.doGameWon();
        break;
    }
  }

  onUserVariablesUpdate(event: ON_USER_VARIABLES_UPDATE_EVENT_RESPONSE) {
    const { user, changedVars } = event;

    if (
      changedVars.indexOf("nodePid") >= 0 &&
      changedVars.indexOf("previousNodePid") >= 0
    ) {
      const previousNodePid = user.getVariable("previousNodePid").value;
      const newNodePid = user.getVariable("nodePid").value;
      // move player
      this.scene.resolveMoveAction(user.name, previousNodePid, newNodePid);
      this.doActionPhase();
    }

    if (changedVars.indexOf("mana") >= 0) {
      const myName = socket.mySelf.name;
      const userName = user.name;

      if (myName === userName) {
        this.scene.hud.updateMana(user.getVariable("mana").value as number);
      }

      this.doActionPhase();
    }

    if (changedVars.indexOf("promoteCount") >= 0) {
      const player = this.scene.board.getPlayerByName(user.name);
      console.log(player);
      player?.updatePromoteCounter(
        user.getVariable("promoteCount").value as number
      );
    }

    if (changedVars.indexOf("char") >= 0) {
      var character = user.getVariable("char").value as string;
      const player = this.scene.board.getPlayerByName(user.name);
      player?.updateCharacter(character);
    }
  }

  doActionPhase() {
    this.scene.sound.play("new_phase");
    const mySelf = socket.mySelf;
    const actionCount = mySelf.getVariable("actionCount").value as number;

    if (actionCount < this.maxPlayerAction) {
      console.log("yyyyy");
      const myNodePid = mySelf.getVariable("nodePid").value as number;
      const myNode = this.scene.board.nodeMap.get(myNodePid);

      this.scene.hud.updateActionButtons({
        hasVirus: myNode ? myNode.virusCount > 0 : false,
        isResearchNode: myNode
          ? myNode.nodeImage.texture.key === "flask"
          : false,
      });
    }
  }

  doInfectionPhase() {
    this.scene.hud.updateTimer(0, "infection");
    this.scene.hud.disableAllButtons();
  }

  doCountdownTick(params: SFS2X.SFSObject, room: SFS2X.SFSRoom) {
    const timeRemaining = params.getInt("remaining");
    const phase = room.getVariable("phase").value;
    this.scene.hud.updateTimer(timeRemaining, phase);
  }

  doTreatResolve(
    params: SFS2X.SFSObject,
    _room: SFS2X.SFSRoom,
    type: string = "treat"
  ) {
    const targetNodeId = params.getInt("targetNodeId");
    const virusCount = params.getInt("virusCount");

    const targetNode = this.scene.board.nodeMap.get(targetNodeId);

    if (!targetNode) return;

    let log = "";

    if (type === "cleanse") {
      log = `Viruses cleansed on node ${targetNodeId}`;
    } else if (type === "bulldoze") {
      log = `Viruses bulldozed on node ${targetNodeId}`;
    } else {
      log = `Virus treated on node ${targetNodeId}`;
    }

    this.scene.hud.addLog(log);
    targetNode.setVirusCount(virusCount);

    if (virusCount >= 0) {
      this.scene.tweens.add({
        targets: targetNode.nodeImage,
        scale: { from: 0.6, to: 0.5 },
        duration: 500,
        ease: "Back.Out",
      });

      // Quick flash outline
      targetNode.setHighlight(true, 0x00ff00);
      this.scene.time.delayedCall(500, () => {
        targetNode.setHighlight(false);
      });
    }

    this.doActionPhase();
  }

  doInfect(params: SFS2X.SFSObject, _room: SFS2X.SFSRoom) {
    const nodeId = params.getInt("nodeId");
    const virusCount = params.getInt("virusCount");

    this.scene.board.infectNode(nodeId, virusCount);
    this.scene.hud.setPhaseMessage(`Infecting #${nodeId}`);
  }

  doOutbreak(params: SFS2X.SFSObject, _room: SFS2X.SFSRoom) {
    const nodeId = params.getInt("nodeId");
    const outbreakCount = params.getInt("outbreakCount");

    this.scene.hud.resolveOutbreak(outbreakCount);
    this.scene.hud.setPhaseMessage(`Outbreak at #${nodeId}!`);
  }

  doGameLost() {
    // TODO:
    this.scene.gameOverDialog = new GameOverDialog(this.scene, "lose", () => {
      this.reset();
    });
  }

  doGameWon() {
    // TODO:
    this.scene.gameOverDialog = new GameOverDialog(this.scene, "win", () => {
      this.scene.gotoScene("MainMenu");
    });
  }

  emitPlayerAction(type: string, targetNodeId?: number) {
    const params = new SFS2X.SFSObject();
    params.putUtfString("type", type);
    if (targetNodeId) {
      params.putInt("targetNodeId", targetNodeId);
    }

    socket.send(
      new SFS2X.ExtensionRequest("playerAction", params, socket.lastJoinedRoom)
    );
  }

  reset() {
    socket.removeEventListener(
      SFS2X.SFSEvent.ROOM_VARIABLES_UPDATE,
      this.onRoomVariablesUpdate
    );
    socket.removeEventListener(
      SFS2X.SFSEvent.EXTENSION_RESPONSE,
      this.onExtensionResponse
    );
    socket.removeEventListener(
      SFS2X.SFSEvent.USER_VARIABLES_UPDATE,
      this.onUserVariablesUpdate
    );
  }
}
