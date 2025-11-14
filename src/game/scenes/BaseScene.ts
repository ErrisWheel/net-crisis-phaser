export abstract class BaseScene extends Phaser.Scene {
  constructor(config: Phaser.Types.Scenes.SettingsConfig) {
    super(config);
  }

  abstract cleanup(): void;

  gotoScene(key: string, data?: any) {
    this.cleanup();

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(key, data);
    });
  }
}
