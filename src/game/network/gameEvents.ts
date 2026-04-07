import { SFSUserVariable } from "sfs2x-api";
import { socket } from "./socket";
import * as SFS2X from "sfs2x-api";
import { Game } from "../scenes/Game";
import {
  ON_EXTENSION_RESPONSE_EVENT_RESPONSE,
  ON_ROOM_VARIABLES_UPDATE_EVENT_RESPONSE,
  ON_USER_VARIABLES_UPDATE_EVENT_RESPONSE,
} from "../../types/sfs2x-event";
import { PlayerScore } from "../scenes/GameOver";

export class GameEvents {
  maxPlayerAction = 2;
  actionTurnSeconds = 20;

  private roomVarsUpdateHandler: (event: ON_ROOM_VARIABLES_UPDATE_EVENT_RESPONSE) => void;
  private extensionResponseHandler: (event: ON_EXTENSION_RESPONSE_EVENT_RESPONSE) => void;
  private userVarsUpdateHandler: (event: ON_USER_VARIABLES_UPDATE_EVENT_RESPONSE) => void;

  constructor(private scene: Game) {
    // Create bound callback functions
    this.roomVarsUpdateHandler = (event: ON_ROOM_VARIABLES_UPDATE_EVENT_RESPONSE) => this.onRoomVariablesUpdate(event);
    this.extensionResponseHandler = (event: ON_EXTENSION_RESPONSE_EVENT_RESPONSE) => this.onExtensionResponse(event);
    this.userVarsUpdateHandler = (event: ON_USER_VARIABLES_UPDATE_EVENT_RESPONSE) => this.onUserVariablesUpdate(event);

    // Register listeners
    socket.addEventListener(
      SFS2X.SFSEvent.ROOM_VARIABLES_UPDATE,
      this.roomVarsUpdateHandler
    );

    socket.addEventListener(
      SFS2X.SFSEvent.EXTENSION_RESPONSE,
      this.extensionResponseHandler
    );

    socket.addEventListener(
      SFS2X.SFSEvent.USER_VARIABLES_UPDATE,
      this.userVarsUpdateHandler
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
    console.log("🔵 ROOM VARIABLES UPDATE:", event.changedVars, event);
    const room = event.room;
    const changedVars = event.changedVars;

    if (changedVars.indexOf("phase") >= 0) {
      const phase = room.getVariable("phase").value as string;
      console.log("📋 Phase changed to:", phase);
      this.scene.hud.addLog(`Phase changed to ${phase}`);
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
      console.log("🔄 Round changed to:", round);
      this.scene.hud.setPhaseMessage(`Round ${round}`);
      this.scene.hud.setRoundText(round);
    }

    if (changedVars.indexOf("researchNodeId") >= 0) {
      const currentResearchNodeId = this.scene.board.researchNodeId;
      const newResearchNodeId = room.getVariable("researchNodeId")
        .value as number;

      console.log("🔬 Research node changed to:", newResearchNodeId);
      this.scene.board.nodeMap.get(currentResearchNodeId)?.updateImage("node");
      this.scene.board.nodeMap.get(newResearchNodeId)?.updateImage("flask");
      this.scene.board.researchNodeId = newResearchNodeId;
    }

    if (changedVars.indexOf("researchCount") >= 0) {
      console.log("📊 Research count changed");
      const researchCount = room.getVariable("researchCount").value as number;
      this.scene.hud.resolveResearchAction(researchCount);
      this.doActionPhase();
    }

    if (changedVars.indexOf("activePlayerName") >= 0) {
      const activePlayerName = room.getVariable("activePlayerName")
        .value as string;
      this.scene.hud.addLog(`Turn: ${activePlayerName}`);
      this.doActionPhase();
    }
  }

  onExtensionResponse(event: ON_EXTENSION_RESPONSE_EVENT_RESPONSE) {
    console.log("🔵 EXTENSION RESPONSE RECEIVED:", event.cmd, event);
    const { cmd, params, room } = event;

    switch (cmd) {
      case "countdownTick":
        console.log("⏱️ Countdown tick:", params.getInt("remaining"), "phase:", params.getUtfString("phase"));
        this.doCountdownTick(params, room);
        break;
      case "treatResolve":
        console.log("✅ Treat resolved");
        this.doTreatResolve(params, room);
        break;
      case "cleanseResolve":
        console.log("✅ Cleanse resolved");
        this.doTreatResolve(params, room, "cleanse");
        break;
      case "bulldozeResolve":
        console.log("✅ Bulldoze resolved");
        this.doTreatResolve(params, room, "bulldoze");
        break;
      case "infect":
        console.log("🦠 Infect");
        this.doInfect(params, room);
        break;
      case "outbreak":
        console.log("💥 Outbreak");
        this.doOutbreak(params, room);
        break;
      case "gameLost":
        console.log("💀 Game lost");
        this.doGameLost(params);
        break;
      case "gameWon":
        console.log("🏆 Game won");
        this.doGameWon(params);
        break;
      default:
        console.log("❓ Unknown extension response:", cmd);
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
      this.scene.hud.addLog(`${user.name} moved to ${newNodePid}`);
      this.scene.resolveMoveAction(user.name, previousNodePid, newNodePid);
      this.doActionPhase();
    }

    if (changedVars.indexOf("mana") >= 0) {
      const myName = socket.mySelf.name;
      const userName = user.name;

      const mana = user.getVariable("mana").value as number;

      if (myName === userName) {
        this.scene.hud.updateMana(mana);
        this.scene.hud.addLog(`Mana is now ${mana}`);
      }

      if (myName === userName) {
        this.doActionPhase();
      }
    }

    if (changedVars.indexOf("actionCount") >= 0) {
      const mySelf = socket.mySelf;
      if (mySelf && user.name === mySelf.name) {
        const actionCount = user.getVariable("actionCount").value as number;
        this.scene.hud.updateActionCount(actionCount);
        this.scene.hud.addLog(`Actions remaining: ${2 - actionCount}/2`);

        const room = socket.lastJoinedRoom;
        if (room) {
          const phaseVar = room.getVariable("phase");
          const phase = phaseVar ? (phaseVar.value as string) : "action";

          if (phase === "action") {
            this.doActionPhase();
          } else if (phase === "infection") {
            this.scene.hud.disableAllButtons();
          }
        }
      }
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
    const mySelf = socket.mySelf;
    if (!mySelf) {
      return;
    }

    const room = socket.lastJoinedRoom;
    if (!room) {
      return;
    }

    // Only update buttons if we're actually in the action phase
    const phaseVar = room.getVariable("phase");
    const phase = phaseVar ? (phaseVar.value as string) : undefined;
    if (phase !== "action") {
      return;
    }

    const activePlayerVar = room.getVariable("activePlayerName");
    const activePlayerName = activePlayerVar
      ? (activePlayerVar.value as string)
      : "";
    if (activePlayerName && activePlayerName !== mySelf.name) {
      this.scene.hud.disableAllButtons();
      return;
    }

    this.scene.sound.play("new_phase");

    if (!this.scene.hud.countdownEvent) {
      this.scene.hud.updateTimer(this.actionTurnSeconds, "action");
    }

    const actionCountVar = mySelf.getVariable("actionCount");
    const nodePidVar = mySelf.getVariable("nodePid");
    const manaVar = mySelf.getVariable("mana");
    const actionCount = actionCountVar ? (actionCountVar.value as number) : 0;
    const mana = manaVar ? (manaVar.value as number) : 0;

    // Keep HUD in sync even if a specific variable update event was missed.
    this.scene.hud.updateActionCount(actionCount);
    this.scene.hud.updateMana(mana);

    if (actionCount < this.maxPlayerAction) {
      const myNodePid = nodePidVar ? (nodePidVar.value as number) : 1;
      const myNode = this.scene.board.nodeMap.get(myNodePid);

      this.scene.hud.updateActionButtons({
        hasVirus: myNode ? myNode.virusCount > 0 : false,
        isResearchNode: myNode
          ? myNode.nodeImage.texture.key === "flask"
          : false,
      });
    } else {
      this.scene.hud.disableAllButtons();
    }
  }

  doInfectionPhase() {
    this.scene.hud.updateTimer(0, "infection");
    this.scene.hud.disableAllButtons();
  }

  doCountdownTick(params: SFS2X.SFSObject, room: SFS2X.SFSRoom) {
    const timeRemaining = params.getInt("remaining");
    let phase = room.getVariable("phase").value as string;

    try {
      phase = params.getUtfString("phase");
    } catch {
      // Fall back to room variable when older server payloads do not include phase.
    }

    this.scene.hud.addLog(`${phase} timer: ${timeRemaining}`);
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

  private collectScores(): PlayerScore[] {
    const room = socket.lastJoinedRoom;
    if (!room) return [];
    const scores: PlayerScore[] = [];
    const users = room.getUserList();
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const pointsVar = user.getVariable("points");
      const points = pointsVar ? (pointsVar.value as number) : 0;
      scores.push({ name: user.name, points });
    }
    return scores;
  }

  private parseScoresFromParams(params?: SFS2X.SFSObject): PlayerScore[] {
    if (!params) return [];
    try {
      const scoreArray = params.getSFSArray("scores");
      if (!scoreArray) return [];

      const scores: PlayerScore[] = [];
      for (let i = 0; i < scoreArray.size(); i++) {
        const item = scoreArray.getSFSObject(i);
        if (!item) continue;
        scores.push({
          name: item.getUtfString("name"),
          points: item.getInt("points"),
        });
      }
      return scores;
    } catch {
      return [];
    }
  }

  doGameLost(params?: SFS2X.SFSObject) {
    const scores = this.parseScoresFromParams(params);
    this.reset();
    this.scene.gotoScene("GameOver", {
      result: "lose",
      scores: scores.length > 0 ? scores : this.collectScores(),
    });
  }

  doGameWon(params?: SFS2X.SFSObject) {
    const scores = this.parseScoresFromParams(params);
    this.reset();
    this.scene.gotoScene("GameOver", {
      result: "win",
      scores: scores.length > 0 ? scores : this.collectScores(),
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
      this.roomVarsUpdateHandler
    );
    socket.removeEventListener(
      SFS2X.SFSEvent.EXTENSION_RESPONSE,
      this.extensionResponseHandler
    );
    socket.removeEventListener(
      SFS2X.SFSEvent.USER_VARIABLES_UPDATE,
      this.userVarsUpdateHandler
    );
  }
}
