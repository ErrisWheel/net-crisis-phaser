import * as SFS2X from "sfs2x-api";

export const socket: SFS2X.SmartFox = new SFS2X.SmartFox({
  useSSL: false,
  zone: "NetCrisis",
  debug: true,
});

const envHost = (import.meta.env.VITE_SOCKET_HOST as string) ?? "localhost";
const envPort = parseInt((import.meta.env.VITE_SOCKET_PORT as string) ?? "3000", 10);
const envUseSSL = (import.meta.env.VITE_SOCKET_USE_SSL as string) === "true";

export function connectToSocket(
  host: string = envHost,
  port: number = envPort,
  useSSL: boolean = envUseSSL,
  timeoutMs: number = 10000
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if ((socket as any).isConnected) {
        console.log("✅ SmartFox: already connected");
        return resolve();
      }

      console.log(`🔌 SmartFox: attempting connection -> ${host}:${port} (useSSL=${useSSL})`);

      const onConnection = (evt: any) => {
        if (evt && evt.success) {
          console.log("✅ SmartFox: connection established");
          cleanup();
          resolve();
        } else {
          console.warn("❌ SmartFox: connection failed", evt);
          cleanup();
          reject(new Error("Connection failed"));
        }
      };

      const onConnectionLost = (evt: any) => {
        console.warn("⚠️ SmartFox: connection lost", evt);
        cleanup();
        reject(new Error("Connection lost"));
      };

      let timer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        socket.removeEventListener(SFS2X.SFSEvent.CONNECTION, onConnection);
        socket.removeEventListener(SFS2X.SFSEvent.CONNECTION_LOST, onConnectionLost);
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };

      timer = setTimeout(() => {
        console.warn(`⏱ SmartFox: connection timed out after ${timeoutMs}ms`);
        try {
          socket.disconnect();
        } catch (e) {}
        cleanup();
        reject(new Error("Connection timeout"));
      }, timeoutMs);

      socket.addEventListener(SFS2X.SFSEvent.CONNECTION, onConnection);
      socket.addEventListener(SFS2X.SFSEvent.CONNECTION_LOST, onConnectionLost);

      socket.connect(host, port, useSSL);
    } catch (err) {
      reject(err);
    }
  });
}

export function connectionInfo(): { host: string; port: number; useSSL: boolean } {
  return { host: envHost, port: envPort, useSSL: envUseSSL };
}

export function getRoomVariable(room: SFS2X.Room, varName: string): any {
  try {
    const rv = (room as any).getVariable ? (room as any).getVariable(varName) : null;
    return rv ? rv.value ?? rv : undefined;
  } catch {
    return undefined;
  }
}
