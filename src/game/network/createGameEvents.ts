import {
  ON_CONNECTION_EVENT_RESPONSE,
  ON_LOGIN_ERROR_EVENT_RESPONSE,
  ON_LOGIN_EVENT_RESPONSE,
  ON_ROOM_JOIN_ERROR_EVENT_RESPONSE,
  ON_ROOM_JOIN_EVENT_RESPONSE,
} from "../../types/sfs2x-event";
import { CreateGameScene } from "../scenes/CreateGame";
import { socket } from "./socket";
import * as SFS2X from "sfs2x-api";

export class CreateGameEvents {
  constructor(private scene: CreateGameScene) {
    socket.addEventListener(SFS2X.SFSEvent.CONNECTION, this.onConnection, this);
    socket.addEventListener(
      SFS2X.SFSEvent.CONNECTION_LOST,
      this.onConnectionLost,
      this
    );
    socket.addEventListener(SFS2X.SFSEvent.LOGIN, this.onLogin, this);
    socket.addEventListener(
      SFS2X.SFSEvent.LOGIN_ERROR,
      this.onLoginError,
      this
    );

    socket.addEventListener(SFS2X.SFSEvent.ROOM_JOIN, this.onRoomJoin, this);
    socket.addEventListener(
      SFS2X.SFSEvent.ROOM_JOIN_ERROR,
      this.onRoomJoinError,
      this
    );
  }

  onConnection(event: ON_CONNECTION_EVENT_RESPONSE) {
    console.log("✅ Create Game: Connected to server", this.scene.playerName);
    // after connected, create and join the room

    if (event.success) {
      // login user
      console.log("logging in user:", this.scene.playerName);
      socket.send(new SFS2X.LoginRequest(this.scene.playerName));
    } else {
      console.log("❌ Connection failed");
    }
  }

  onConnectionLost(event: { reason: string }) {
    console.log("❌ Create Game: Disconnected from server", event.reason);
    this.reset();
    alert("Disconnected from server: " + event.reason);
    window.location.reload();
  }

  onLogin(event: ON_LOGIN_EVENT_RESPONSE) {
    console.log("✅ Create Game: Logged in as", event.user.name);
    // after login, create the game room
    const roomName = this.generateRoomName();
    console.log("Creating room with name:", roomName);
    const roomSettings = new SFS2X.RoomSettings(roomName);
    roomSettings.isGame = true;
    roomSettings.maxUsers = 8;
    roomSettings.maxVariables = 10;

    roomSettings.extension = new SFS2X.RoomExtension(
      "NetCrisisExtension",
      "room.js"
    );

    this.scene.setStatusMessage("Creating room...");
    socket.send(new SFS2X.CreateRoomRequest(roomSettings, true));
  }

  onLoginError(event: ON_LOGIN_ERROR_EVENT_RESPONSE) {
    console.log("❌ Create Game: Login error", event.errorMessage);
    alert("Login Error: " + event.errorMessage);
  }

  onRoomJoin(event: ON_ROOM_JOIN_EVENT_RESPONSE) {
    console.log("✅ Create Game: Room created successfully", event.room);
    this.scene.setStatusMessage("Successfully created the room!");
    this.scene.gotoScene("LobbyScene", {
      roomCode: event.room.name,
      players: event.room.getPlayerList(),
    });
  }

  onRoomJoinError(event: ON_ROOM_JOIN_ERROR_EVENT_RESPONSE) {
    console.log("❌ Create Game: Room creation error", event.errorMessage);
  }

  generateRoomName(): string {
    // generate 6 letters room name
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let roomName = "";
    for (let i = 0; i < 4; i++) {
      roomName += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return roomName;
  }

  loginPlayer() {
    this.scene.setStatusMessage("Logging in...");
    socket.send(new SFS2X.LoginRequest(this.scene.playerName));
  }

  reset() {
    socket.removeEventListener(SFS2X.SFSEvent.CONNECTION, this.onConnection);
    socket.removeEventListener(SFS2X.SFSEvent.LOGIN, this.onLogin);
    socket.removeEventListener(SFS2X.SFSEvent.LOGIN_ERROR, this.onLoginError);
    socket.removeEventListener(
      SFS2X.SFSEvent.CONNECTION_LOST,
      this.onConnectionLost
    );
    socket.removeEventListener(SFS2X.SFSEvent.ROOM_JOIN, this.onRoomJoin);
  }
}
