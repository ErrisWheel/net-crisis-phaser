import * as SFS2X from "sfs2x-api";
import {
  ON_CONNECTION_EVENT_RESPONSE,
  ON_CONNECTION_LOST_EVENT_RESPONSE,
} from "../../types/sfs2x-event";

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST as string;
const SOCKET_PORT = parseInt(import.meta.env.VITE_SOCKET_PORT as string);
const SOCKET_USE_SSL = import.meta.env.VITE_SOCKET_USE_SSL as string;

// singleton socket instance
export const socket: SFS2X.SmartFox = new SFS2X.SmartFox({
  useSSL: false,
  zone: "NetCrisis",
  debug: true,
});

export const connectToSocket = (alreadyConnectedFn?: Function) => {
  if (!socket.isConnected) {
    const useSsl = SOCKET_USE_SSL === "true";
    socket.connect(SOCKET_HOST, SOCKET_PORT, useSsl);
  } else {
    if (alreadyConnectedFn) {
      console.log("✅ Socket: Already connected, executing callback");
      alreadyConnectedFn();
    }
  }
};

export const getRoomVariable = (varName: string) => {
  return socket.lastJoinedRoom.getVariable(varName);
};

export const getMyName = (): string => {
  return socket.mySelf.name;
};

const onConnection = (event: ON_CONNECTION_EVENT_RESPONSE) => {
  if (event.success) {
    console.log("✅ Connected to server");
  } else {
    console.log("❌ Connection failed");
  }
};

const reset = () => {
  socket.removeEventListener(SFS2X.SFSEvent.CONNECTION, onConnection);
  socket.removeEventListener(SFS2X.SFSEvent.CONNECTION_LOST, onConnectionLost);
};

const onConnectionLost = (event: ON_CONNECTION_LOST_EVENT_RESPONSE) => {
  console.log("❌ Disconnected from server", event.reason);
  reset();
};

socket.addEventListener(SFS2X.SFSEvent.CONNECTION, onConnection, this);
socket.addEventListener(SFS2X.SFSEvent.CONNECTION_LOST, onConnectionLost, this);
