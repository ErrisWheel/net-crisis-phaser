import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, "background");

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("assets");

    this.load.image("logo", "logo.png");

    this.load.image("node", "node.png");
    this.load.image("virus", "virus.png");
    this.load.image("player", "player.png");
    this.load.image("research_lab", "research_lab.png");
    this.load.image("flask", "flask.png");
    this.load.image("skull", "skull.png");
    this.load.image("check", "check.png");
    this.load.image("cross", "cross.png");
    this.load.image("crystal", "crystal.png");
    this.load.image("pawn", "pawn.png");
    this.load.image("knight", "knight.png");
    this.load.image("bishop", "bishop.png");
    this.load.image("rook", "rook.png");
    this.load.image("queen", "queen.png");

    // audio
    this.load.audio("button_click", "sounds/button_click.ogg");
    this.load.audio("countdown", "sounds/countdown.ogg");
    this.load.audio("new_phase", "sounds/new_phase.ogg");
    this.load.audio("outbreak", "sounds/outbreak.ogg");
    this.load.audio("research_up", "sounds/research_up.ogg");
    this.load.audio("begin", "sounds/begin.ogg");
    this.load.audio("infection", "sounds/infection.ogg");
    this.load.audio("victory", "sounds/victory.mp3");
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    // this.scene.start('LobbyScene', {
    //     roomCode: 'ABCD',
    //     playerName: 'Player1',
    //     isHost: true,
    //     players: [
    //         { name: 'Player1', ready: false, isHost: true },
    //         { name: 'Player2', ready: true },
    //         { name: 'Player3', ready: false },
    //     ]
    // });
    this.scene.start("MainMenu");
    // this.scene.start("TestScene");
  }
}
