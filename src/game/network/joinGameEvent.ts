import {
  JoinRoomRequest,
  LoginRequest,
  LogoutRequest,
  SFSEvent,
} from "sfs2x-api";
import { JoinGameScene } from "../scenes/JoinGame";
import { socket } from "./socket";
import {
  ON_CONNECTION_EVENT_RESPONSE,
  ON_LOGIN_ERROR_EVENT_RESPONSE,
  ON_LOGIN_EVENT_RESPONSE,
  ON_ROOM_JOIN_ERROR_EVENT_RESPONSE,
  ON_ROOM_JOIN_EVENT_RESPONSE,
} from "../../types/sfs2x-event";

export class JoinGameEvents {
  constructor(private scene: JoinGameScene) {
    socket.addEventListener(SFSEvent.CONNECTION, this.onConnection, this);
    socket.addEventListener(
      SFSEvent.CONNECTION_LOST,
      this.onConnectionLost,
      this
    );
    socket.addEventListener(SFSEvent.LOGIN, this.onLogin, this);
    socket.addEventListener(SFSEvent.LOGIN_ERROR, this.onLoginError, this);
    socket.addEventListener(SFSEvent.ROOM_JOIN, this.onRoomJoined, this);
    socket.addEventListener(
      SFSEvent.ROOM_JOIN_ERROR,
      this.onRoomJoinError,
      this
    );
  }

  // event handler methods would go here
  onConnection(event: ON_CONNECTION_EVENT_RESPONSE) {
    console.log("✅ Join Game: Connected to server");
    if (event.success) {
      this.loginPlayer();
    } else {
      console.log("❌ Join Game: Connection failed");
    }
  }

  onConnectionLost(event: { reason: string }) {
    console.log("❌ Create Game: Disconnected from server", event.reason);
    this.reset();
    alert("Disconnected from server: " + event.reason);
    window.location.reload();
  }

  onLogin(event: ON_LOGIN_EVENT_RESPONSE) {
    console.log("✅ Join Game: Logged in as", event.user.name);
    // proceed with joining room
    const roomCode = this.scene.roomInput?.value.trim();
    console.log("Joining room with code:", roomCode);
    if (roomCode) {
      socket.send(new JoinRoomRequest(roomCode));
    }
  }

  onLoginError(event: ON_LOGIN_ERROR_EVENT_RESPONSE) {
    console.log("❌ Join Game: Login error", event.errorMessage);
    alert("Login Error: " + event.errorMessage);
  }

  onRoomJoined(event: ON_ROOM_JOIN_EVENT_RESPONSE) {
    console.log("✅ Join Game: Player joined successfully", event.room);
    this.scene.gotoScene("LobbyScene", {
      roomCode: event.room.name,
      players: event.room.getPlayerList(),
    });
  }

  onRoomJoinError(event: ON_ROOM_JOIN_ERROR_EVENT_RESPONSE) {
    console.log("❌ Join Game: Room join error", event.errorMessage);
    socket.send(new LogoutRequest());
    alert(event.errorMessage);
  }

  reset() {
    socket.removeEventListener(SFSEvent.CONNECTION, this.onConnection);
    socket.removeEventListener(SFSEvent.CONNECTION_LOST, this.onConnectionLost);
    socket.removeEventListener(SFSEvent.LOGIN, this.onLogin);
    socket.removeEventListener(SFSEvent.LOGIN_ERROR, this.onLoginError);
    socket.removeEventListener(SFSEvent.ROOM_JOIN, this.onRoomJoined);
  }

  loginPlayer() {
    // proceed with login or joining room
    const playerName = this.scene.nameInput?.value.trim();
    if (!playerName) {
      console.log("❌ Join Game: Player name is required");
      return;
    }
    console.log("logging in user:", playerName);
    try {
      socket.send(new LoginRequest(playerName));
    } catch (error) {
      console.error("❌ Join Game: Error logging in", error);
    }
  }
}
