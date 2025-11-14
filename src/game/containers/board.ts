import { SFSArray } from "sfs2x-api";

import { socket } from "../network/socket";
import { Edge } from "./edge";
import { NodeContainer } from "./node";
import { Player } from "./player";
import { EdgeConfigType, NodeConfigType } from "../configs/type";

export class Board extends Phaser.GameObjects.Container {
  edges: Edge[] = [];
  nodeMap: Map<number, NodeContainer> = new Map();

  players: Player[] = [];

  defaultStatingNodeId: number = 1;
  researchNodeId: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private config: {
      nodeConfig: NodeConfigType[];
      edgeConfig: EdgeConfigType[];
    }
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    this.createNodes();
    this.createEdges();

    this.setupPlayers();
    this.setupViruses();
  }

  private createNodes() {
    this.config.nodeConfig.forEach((nc) => {
      const type = nc.type === "research" ? "research" : "normal";
      if (type === "research") {
        this.researchNodeId = nc.id;
      }
      const node = new NodeContainer(this.scene, nc.x, nc.y, nc.id, type);
      this.nodeMap.set(nc.id, node);
      this.add(node);
    });
  }

  private createEdges() {
    this.config.edgeConfig.forEach(([a, b]) => {
      const nodeA = this.nodeMap.get(a);
      const nodeB = this.nodeMap.get(b);
      if (nodeA && nodeB) this.addEdge(nodeA, nodeB);
    });
  }

  // === Edge management ===
  addEdge(nodeA: NodeContainer, nodeB: NodeContainer): Edge {
    const edge = new Edge(this.scene, nodeA, nodeB);
    this.edges.push(edge);
    this.add(edge);
    this.sendToBack(edge); // Ensure edges are behind nodes
    return edge;
  }

  setupPlayers() {
    const players = socket.lastJoinedRoom.getPlayerList();
    const startingNode = this.nodeMap.get(this.defaultStatingNodeId);

    if (!startingNode) return;

    players.forEach((p) => {
      var character = p.getVariable("char").value as string;
      const playerObj = new Player(this.scene, 0, 0, p.name, character);
      this.players.push(playerObj);
      startingNode.addPlayer(playerObj);
    });
  }

  setupViruses() {
    const room = socket.lastJoinedRoom;
    const boardState = room.getVariable("boardState").value as SFSArray;
    for (var i = 0; i < boardState.size(); i++) {
      const node = boardState.getSFSObject(i);
      const virusCount = node.getInt("virusCount");
      if (virusCount > 0) {
        this.nodeMap.get(i + 1)?.setVirusCount(virusCount);
      }
    }
  }

  infectNode(nodeId: number, virusCount: number) {
    if (virusCount > 0) {
      this.nodeMap.get(nodeId)?.setVirusCount(virusCount);
    }
  }

  getConnectedNodes(nodeId: number, includeRoot: boolean = false) {
    const ids = this.config.edgeConfig
      .filter(([a, b]) => a === nodeId || b === nodeId)
      .map(([a, b]) => (a === nodeId ? b : a));

    if (includeRoot) {
      ids.push(nodeId);
    }

    return ids
      .map((id) => this.nodeMap.get(id))
      .filter((n): n is NodeContainer => !!n);
  }

  getAllNodesExcept(nodeId: number) {
    const nodes: NodeContainer[] = [];
    this.nodeMap.forEach((value, id) => {
      if (id !== nodeId) nodes.push(value);
    });

    return nodes;
  }

  getPlayerByName(name: string) {
    return this.players.find((p) => p.name === name);
  }

  clearHighlights() {
    this.nodeMap.forEach((node) => node.setHighlight(false));
  }
}
