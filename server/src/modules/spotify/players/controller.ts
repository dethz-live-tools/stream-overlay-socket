// Merge controller thing to 1 function!
// Maybe god class

import { basedController } from ".";
import { ISpotifyPlayer } from "../../interfaces/spotify/player.interface";

const putStates = [
  "play",
  "pause",
  "repeat",
  "shuffle",
  "volume:up",
  "volume:down",
];
const postStates = ["next", "prev", "add"];

// 1, all, 0
const repeat = (state: "track" | "context" | "off") => {
  let stage = ["track", "context", "off"];

  let n = stage.indexOf(state) + 1;

  if (n >= stage.length) {
    n = 0;
  }

  return stage[n];
};

const volume = (level: number, state: "up" | "down") => {
  let vol = level;
  switch (state) {
    case "up":
      vol += 10;
      break;

    case "down":
      vol -= 10;
      break;
  }

  console.log(vol);

  if (vol < 0) {
    vol = 0;
  } else if (vol > 100) {
    vol = 100;
  }

  return vol;
};

export const spotifyController = async (
  state: string,
  token: string,
  body?: string,
  device_id?: string,
) => {
  if (state === "player") {
    const resp = (await basedController(
      token,
      "GET",
      "player",
    )) as ISpotifyPlayer;

    return resp;
  } else {
    let main_id: string | null = null;

    const player = (await basedController(
      token,
      "GET",
      "player",
    )) as ISpotifyPlayer;

    if (device_id !== undefined) {
      main_id = device_id;
    } else {
      if (player.device.id === null || player.device.id === undefined) {
        console.log("no device id");
        return null;
      } else {
        main_id = player.device.id;
      }
    }

    if (state === "player") {
      return player;
    }

    if (putStates.includes(state)) {
      switch (state) {
        case "play":
          return await basedController(token, "PUT", "play", main_id);

        case "pause":
          return await basedController(token, "PUT", "pause", main_id);

        case "repeat":
          return await basedController(token, "PUT", "repeat", main_id, {
            type: "uri",
            body: `state=${repeat(player.repeat_state)}`,
          });

        case "shuffle":
          return await basedController(token, "PUT", "shuffle", main_id, {
            type: "uri",
            body: `state=${!player.shuffle_state}`,
          });

        case "volume:up":
          return await basedController(token, "PUT", "volume", main_id, {
            type: "uri",
            body: `volume_percent=${volume(player.device.volume_percent, "up")}`,
          });

        case "volume:down":
          return await basedController(token, "PUT", "volume", main_id, {
            type: "uri",
            body: `volume_percent=${volume(player.device.volume_percent, "down")}`,
          });
      }
    }

    if (postStates.includes(state)) {
      switch (state) {
        case "next":
          return await basedController(token, "POST", "next", main_id);

        case "previous":
          return await basedController(token, "POST", "previous", main_id);

        case "add":
          return await basedController(token, "POST", "queue", main_id, {
            type: "uri",
            body: `uri=spotify:track:${body}`.replaceAll(":", "%3A"),
          });
      }
    }
  }

  return null;
};
