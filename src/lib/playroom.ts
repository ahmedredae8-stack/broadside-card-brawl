import { getParticipants, insertCoin, myPlayer, type PlayerState } from "playroomkit";

export type PlayroomParticipant = PlayerState;

export function getPlayroomGameId(): string | null {
  const value = import.meta.env["VITE_PLAYROOM_GAME_ID"]?.trim();
  return value || null;
}

export function isPlayroomConfigured(): boolean {
  return getPlayroomGameId() !== null;
}

export async function joinPlayroomRoom(options: {
  roomCode?: string;
  maxPlayersPerRoom: number;
  skipLobby?: boolean;
}): Promise<PlayerState> {
  const gameId = getPlayroomGameId();

  await insertCoin({
    ...(gameId ? { gameId } : {}),
    maxPlayersPerRoom: options.maxPlayersPerRoom,
    ...(options.roomCode ? { roomCode: options.roomCode } : {}),
    ...(options.skipLobby === undefined ? {} : { skipLobby: options.skipLobby }),
  });
  return myPlayer();
}

export function getPlayroomParticipants(): PlayerState[] {
  return Object.values(getParticipants());
}
