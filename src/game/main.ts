import { Boot } from "./scenes/Boot";
import { GameOver } from "./scenes/GameOver";
import { Game as MainGame } from "./scenes/Game";
import { MainMenu } from "./scenes/MainMenu";
import { AUTO, Game } from "phaser";
import { Preloader } from "./scenes/Preloader";
import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import { CreateGameScene } from "./scenes/CreateGame";
import { JoinGameScene } from "./scenes/JoinGame";
import { LobbyScene } from "./scenes/Lobby";
import { TestScene } from "./scenes/TestScene";

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1440,
  height: 900,
  parent: "game-container",
  backgroundColor: "#262626",
  fps: { target: 30, forceSetTimeOut: true },
  scale: {
    mode: Phaser.Scale.RESIZE, // Automatically resize the canvas to fit the available space
    autoCenter: Phaser.Scale.CENTER_BOTH, // Center the game canvas horizontally and vertically
  },
  scene: [
    Boot,
    Preloader,
    MainMenu,
    CreateGameScene,
    JoinGameScene,
    LobbyScene,
    MainGame,
    GameOver,
    TestScene
  ],
  plugins: {
    scene: [
      {
        key: "rexUI",
        plugin: RexUIPlugin,
        mapping: "rexUI", // you’ll use scene.rexUI
      },
    ],
  },
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
