import { NodeConfigType, EdgeConfigType } from "./type";

export const NodeConfig: NodeConfigType[] = [
  { id: 1, x: 400, y: 240 }, // center
  { id: 2, x: 260, y: 180 },
  { id: 3, x: 300, y: 320 },
  { id: 4, x: 540, y: 180 },
  { id: 5, x: 520, y: 340 },
  { id: 6, x: 400, y: 400 },
  { id: 7, x: 180, y: 240 },
  { id: 8, x: 640, y: 240 },
  { id: 9, x: 700, y: 380 },
  { id: 10, x: 580, y: 420 },
  { id: 11, x: 280, y: 430 },
  { id: 12, x: 100, y: 320 },
  { id: 13, x: 800, y: 260, type: "research" },
];

export const EdgeConfig: EdgeConfigType[] = [
  [1, 2],
  [1, 3],
  [1, 4],
  [1, 5],
  [1, 6],
  [2, 3],
  [3, 6],
  [4, 5],
  [5, 6],
  [2, 7],
  [4, 8],
  [8, 9],
  [5, 9],
  [6, 10],
  [10, 9],
  [6, 11],
  [11, 12],
  [9, 13],
  [8, 13],
];
