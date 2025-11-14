export class Player extends Phaser.GameObjects.Container {
  nameText: Phaser.GameObjects.Text;
  evolveText: Phaser.GameObjects.Text;
  playerImage: Phaser.GameObjects.Image;
  name: string;
  character: string;

  promoteCost = 7;
  demoteCost = 3;

  // === State ===
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string = "Player",
    character: string
  ) {
    super(scene, x, y);
    this.character = character;

    this.playerImage = scene.add
      .image(0, 0, character)
      .setScale(0.25)
      .setOrigin(0.5);
    this.add(this.playerImage);

    this.name = name;
    this.nameText = scene.add
      .text(0, 16, this.name, {
        fontSize: "12px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);
    this.add(this.nameText);

    this.evolveText = scene.add.text(7, -12, "", {
      fontSize: "10px",
      color: "#ffffff",
    });
    this.add(this.evolveText);

    this.updatePromoteCounter(0);
  }

  updatePromoteCounter(count: number) {
    if (this.character === "queen" || this.character === "pawn") {
      console.log("updating evolveCounter", count);
      const cost =
        this.character === "queen" ? this.demoteCost : this.promoteCost;

      const text = cost - count;
      this.evolveText.setText(text.toString());
    }
  }

  updateCharacter(character: string) {
    const scene = this.scene;

    // Small bounce + flashing scale animation like Mario power-up
    scene.tweens.add({
      targets: this,
      scale: { from: 1.2, to: 0.8 },
      duration: 220,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // === Swap Character After Animation ===
        this.character = character;
        this.playerImage.setTexture(character);

        // === Apply Character-Specific Settings ===
        if (character === "queen") {
          this.evolveText.setText("2");
          this.setScale(1.2);
        }

        if (character === "pawn") {
          this.updatePromoteCounter(0);
          this.setScale(1);
        }

        // Smooth settle-back animation
        scene.tweens.add({
          targets: this,
          scale: this.scale,
          duration: 150,
          ease: "Back.Out",
        });
      },
    });
  }
}
