import { NodeContainer } from "./node";

export class Edge extends Phaser.GameObjects.Line {
  nodeA: NodeContainer;
  nodeB: NodeContainer;

  constructor(scene: Phaser.Scene, nodeA: NodeContainer, nodeB: NodeContainer) {
    const x1 = nodeA.x;
    const y1 = nodeA.y;
    const x2 = nodeB.x;
    const y2 = nodeB.y;

    super(scene, 0, 0, x1, y1, x2, y2, 0x444444, 1);
    // scene.add.existing(this);
    this.setOrigin(0, 0);
    this.setLineWidth(4, 4);

    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.setDepth(-1); // Ensure edges are behind nodes

  }

  update() {
    this.setTo(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y);
  }
}
