import { EdgeConfig, NodeConfig } from "../configs/sea";
import { Board } from "../containers/board";
import { Hud } from "../containers/hud";

export class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: "TestScene" });
  }

  create() {
    new Hud(this, 0, 0);

    new Board(this, 0, 50, {
      nodeConfig: NodeConfig,
      edgeConfig: EdgeConfig,
    });
  }
}
