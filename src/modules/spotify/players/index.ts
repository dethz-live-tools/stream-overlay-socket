const basedAPI = "https://api.spotify.com/v1/me/player/";

const stateHandler = (state: string, method: string) => {
  if (state === "queue") {
    if (method === "POST") {
      return true;
    }

    return false;
  }

  return true;
};

export const basedController = async (
  accessToken: string,
  method: string,
  state: string,
  device_id?: string,
  body?: {
    type: "uri" | "body";
    body: string;
  },
) => {
  var uri = "";

  if (state === "player") {
    uri = `${basedAPI}`;
  } else {
    uri = `${basedAPI}${state}${stateHandler(state, method) ? `?device_id=${device_id}${body?.type === "uri" ? `&${body.body}` : ""}` : ""}`;
  }

  const resp = await fetch(uri, {
    method: method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: body?.type === "body" ? body.body : undefined,
  });

  // ponytail: handle 204 No Content or empty bodies safely without throwing SyntaxError
  if (resp.status === 204 || resp.status === 205) {
    return null;
  }

  const text = await resp.text();
  if (!text || text.trim() === "") {
    return null;
  }

  if (state === "player") {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } else if (state === "queue") {
    if (method === "POST") {
      return text;
    } else {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }
  } else {
    return text;
  }
};
