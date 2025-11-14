import { SFSObject, SFSRoom, SFSUser } from "sfs2x-api";

export type ON_CONNECTION_EVENT_RESPONSE = {
  success: boolean;
};

export type ON_CONNECTION_LOST_EVENT_RESPONSE = {
  reason: string;
};

export type ON_LOGIN_EVENT_RESPONSE = {
  user: SFSUser;
  data: SFSObject;
};

export type ON_LOGIN_ERROR_EVENT_RESPONSE = {
  errorMessage: string;
  errorCode: number;
};

export type ON_ROOM_ADD_EVENT_RESPONSE = {
  room: SFSRoom;
};

export type ON_ROOM_CREATION_ERROR_EVENT_RESPONSE = {
  errorMessage: string;
  errorCode: number;
};

export type ON_USER_VARIABLES_UPDATE_EVENT_RESPONSE = {
  user: SFSUser;
  changedVars: string[];
};

export type ON_ROOM_JOIN_EVENT_RESPONSE = {
  room: SFSRoom;
};

export type ON_ROOM_JOIN_ERROR_EVENT_RESPONSE = {
  errorMessage: string;
  errorCode: number;
};

export type ON_USER_ENTER_ROOM_EVENT_RESPONSE = {
  user: SFSUser;
  room: SFSRoom;
};

export type ON_USER_EXIT_ROOM_EVENT_RESPONSE = {
  user: SFSUser;
  room: SFSRoom;
};

export type ON_EXTENSION_RESPONSE_EVENT_RESPONSE = {
  cmd: string;
  params: SFSObject;
  room: SFSRoom;
};

export type ON_ROOM_VARIABLES_UPDATE_EVENT_RESPONSE = {
  room: SFSRoom;
  changedVars: string[];
};
