import { LeaveRoomRequest, LogoutRequest, SFSEvent } from "sfs2x-api";
import { LobbyScene } from "../scenes/Lobby";
import { socket } from "./socket";
import {
  ON_EXTENSION_RESPONSE_EVENT_RESPONSE,
  ON_USER_ENTER_ROOM_EVENT_RESPONSE,
  ON_USER_EXIT_ROOM_EVENT_RESPONSE,
  ON_USER_VARIABLES_UPDATE_EVENT_RESPONSE,
} from "../../types/sfs2x-event";

export class LobbyEvents {
  constructor(private scene: LobbyScene) {
    socket.addEventListener(
      SFSEvent.CONNECTION_LOST,
      this.onConnectionLost,
      this
    );
    socket.addEventListener(
      SFSEvent.USER_VARIABLES_UPDATE,
      this.onUserVariablesUpdate,
      this
    );
    socket.addEventListener(SFSEvent.USER_ENTER_ROOM, this.onUserEntered, this);
    socket.addEventListener(SFSEvent.USER_EXIT_ROOM, this.onUserExited, this);
    socket.addEventListener(
      SFSEvent.EXTENSION_RESPONSE,
      this.onExtensionResponse,
      this
    );
  }

  onConnectionLost(event: { reason: string }) {
    console.log("❌ Lobby: Disconnected from server", event.reason);
    this.reset();
  }

  onUserVariablesUpdate(event: ON_USER_VARIABLES_UPDATE_EVENT_RESPONSE) {
    console.log("🔄 Lobby: User variables updated", event);

    // Update the player list in the lobby scene
    this.scene.players = socket.lastJoinedRoom.getPlayerList();
    this.scene.updatePlayerList();
  }

  onUserEntered(event: ON_USER_ENTER_ROOM_EVENT_RESPONSE) {
    console.log("✅ Lobby: Player joined", event.room);
    this.scene.players = event.room.getPlayerList();
    this.scene.updatePlayerList();
  }

  onUserExited(event: ON_USER_EXIT_ROOM_EVENT_RESPONSE) {
    console.log("❌ Lobby: Player left", event.room);
    this.scene.players = event.room.getPlayerList();
    this.scene.updatePlayerList();
  }

  onExtensionResponse(event: ON_EXTENSION_RESPONSE_EVENT_RESPONSE) {
    if (event.cmd === "startGame") {
      console.log("🚀 Lobby: Starting game...", event);
      this.scene.startCountdown();
    }
  }

  leaveRoom() {
    socket.send(new LeaveRoomRequest());
    socket.send(new LogoutRequest());
    socket.disconnect();
  }

  reset() {
    socket.removeEventListener(SFSEvent.CONNECTION_LOST, this.onConnectionLost);
    socket.removeEventListener(
      SFSEvent.USER_VARIABLES_UPDATE,
      this.onUserVariablesUpdate
    );
    socket.removeEventListener(SFSEvent.USER_ENTER_ROOM, this.onUserEntered);
    socket.removeEventListener(SFSEvent.USER_EXIT_ROOM, this.onUserExited);
    socket.removeEventListener(
      SFSEvent.EXTENSION_RESPONSE,
      this.onExtensionResponse
    );
  }
}
