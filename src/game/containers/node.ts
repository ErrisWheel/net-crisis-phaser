import { Player } from "./player";

export class NodeContainer extends Phaser.GameObjects.Container {
  outline: Phaser.GameObjects.Graphics;
  nodeImage: Phaser.GameObjects.Image;
  nodeText: Phaser.GameObjects.Text;
  virusSprites: Phaser.GameObjects.Image[] = [];

  // === State ===
  players: Map<string, Player>; // placeholder for player IDs or sprites
  id: number;
  virusCount: number; // placeholder for viruses

  // visual config
  private nodeSize: number;
  private nodeTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    nodeId: number,
    type: "normal" | "research" = "normal"
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    let imgKey = "node";
    let displaySize = 32;
    let textOffsetY = 0;

    if (type === "research") {
      imgKey = "flask";
    }

    this.nodeSize = displaySize;

    // create outline graphics
    this.outline = scene.add.graphics();
    this.outline.setVisible(false);
    this.add(this.outline);

    // node image
    this.nodeImage = scene.add.image(0, 0, imgKey);
    this.nodeImage.setScale(0.5);
    this.add(this.nodeImage);

    // node id text
    this.nodeText = scene.add.text(0, textOffsetY, String(nodeId), {
      fontSize: "11px",
      fontFamily: "Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    });
    this.nodeText.setOrigin(0.5);
    this.add(this.nodeText);

    if (type === "research") {
      this.startFlaskPulse();
      this.nodeText.setVisible(false);
      this.applyResearchColor("#cb6eff");
    }

    this.players = new Map<string, Player>();
    this.virusCount = 0;
    this.id = nodeId;
  }

  applyResearchColor(hexColor: string) {
    // Tint the flask image
    this.nodeImage.setTint(
      Phaser.Display.Color.HexStringToColor(hexColor).color
    );

    // Remove ID text (research nodes usually have no number)
    this.nodeText.setVisible(false);

    // Add soft glow using outline
    const glow = this.outline;
    glow.clear();
    glow.lineStyle(
      4,
      Phaser.Display.Color.HexStringToColor(hexColor).color,
      0.8
    );
    glow.strokeCircle(0, 0, this.nodeSize * 0.65 + 6);
    glow.setVisible(true);

    // Glow pulse animation
    this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.5, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  addPlayer(player: Player) {
    console.log("Adding player to node:", player.name);
    this.players.set(player.name, player);

    // Position players in bottom semicircle
    const radius = 35; // distance from node center
    const startAngle = 0; // 0° (right)
    const endAngle = Math.PI; // 180° (left) → bottom half
    const step = (endAngle - startAngle) / (this.players.size + 1);

    let index = 0;
    this.players.forEach((p) => {
      index++;
      const angle = startAngle + step * index;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;

      p.x = px;
      p.y = py;

      console.log(
        `Positioning player ${p.name} at (${px.toFixed(2)}, ${py.toFixed(
          2
        )}) on node ${this.id}`
      );
      if (!this.list.includes(p)) {
        this.add(p); // Add to container if not already
      }
    });
  }

  removePlayer(playerName: string) {
    const player = this.players.get(playerName);
    player?.removeFromDisplayList();
    player?.removeFromUpdateList();
    this.players.delete(playerName);
  }

  setVirusCount(count: number) {
    this.virusCount = count;

    // Clear old virus sprites
    this.virusSprites.forEach((v) => v.destroy());
    this.virusSprites = [];

    if (count <= 0) return;

    // Position viruses along the top half-circle
    const radius = 35; // distance from node center
    const startAngle = Math.PI; // 180° (left)
    const endAngle = Phaser.Math.PI2; // 0° (right)
    const step = (endAngle - startAngle) / (count + 1);

    for (let i = 1; i <= count; i++) {
      const angle = startAngle + step * i;
      const vx = Math.cos(angle) * radius;
      const vy = Math.sin(angle) * radius;

      const virus = this.scene.add.image(vx, vy, "virus");
      virus.setScale(0.25);
      virus.setOrigin(0.5);
      this.add(virus);
      this.virusSprites.push(virus);

      // === Animate appearance (grow) ===
      virus.setScale(0);
      this.scene.tweens.add({
        targets: virus,
        scale: { from: 0, to: 0.25 },
        duration: 400,
        ease: "Back.Out",
        delay: i * 100,
        onComplete: () => {
          // === Pulse AFTER grow finishes ===
          this.scene.tweens.add({
            targets: virus,
            scale: { from: 0.25, to: 0.35 },
            yoyo: true,
            repeat: 0,
            duration: 200,
            ease: "Sine.easeInOut",
            onComplete: () => {
              virus.setDisplaySize(16, 16);
            },
          });
        },
      });
    }

    // === Shake the node container itself ===
    this.scene.tweens.add({
      targets: this,
      x: this.x + 5,
      duration: 80,
      yoyo: true,
      repeat: 3,
      ease: "Sine.easeInOut",
      onComplete: () => {
        // nothing special (position resets automatically by yoyo)
      },
    });
  }

  setHighlight(active: boolean, color: number = 0xffff00) {
    // stop existing outline tweens
    this.scene?.tweens?.killTweensOf(this.outline);
    this.outline.clear();

    if (active) {
      const radius = this.nodeSize * 0.6 + 6; // tweak visually
      this.outline.lineStyle(4, color, 1);
      this.outline.strokeCircle(0, 0, radius);
      this.outline.setVisible(true);

      // subtle pulse on outline alpha for attention
      this.outline.setAlpha(0.9);
      this.scene.tweens.add({
        targets: this.outline,
        alpha: { from: 0.6, to: 1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // make node clickable via its image (proxy)
      this.setInteractive();
    } else {
      this.outline.clear();
      this.outline.setVisible(false);
      this.disableInteractive();
    }
  }

  // ✅ New function
  updateImage(key: "flask" | "node") {
    // Stop any existing flask pulse animation
    if (this.nodeTween) {
      this.nodeTween.stop();
      this.nodeTween = undefined;
      this.nodeImage.setScale(0.5);
    }

    // Update image texture
    this.nodeImage.setTexture(key);

    if (key === "flask") {
      this.applyResearchColor("#cb6eff");
      // Slightly larger display for flask and pulse effect
      this.nodeSize = 35;
      this.startFlaskPulse();
      this.nodeText.setVisible(false);
    } else {
      this.applyResearchColor("#ffffff");
      // Normal node
      this.nodeSize = 32;
      this.nodeText.setVisible(true);
    }
  }

  private startFlaskPulse() {
    this.nodeTween = this.scene.tweens.add({
      targets: this.nodeImage,
      scale: { from: 0.3, to: 0.4 },
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: "Sine.easeInOut",
    });
  }

  /**
   * Proxy interactivity to the internal image so callers can do node.setInteractive()
   * and listen for pointer events directly on the NodeContainer instance.
   */
  setInteractive(): this {
    // default circular hit area centered at (0,0)
    const radius = Math.max(32, this.nodeSize);
    // this.nodeImage.setInteractive(
    //   new Phaser.Geom.Circle(0, 0, radius),
    //   Phaser.Geom.Circle.Contains
    // );

    // this.nodeText.setInteractive(
    //   new Phaser.Geom.Circle(0, 0, radius),
    //   Phaser.Geom.Circle.Contains
    // );
    super.setInteractive(
      new Phaser.Geom.Circle(0, 0, radius),
      Phaser.Geom.Circle.Contains
    );
    return this;
  }
}
