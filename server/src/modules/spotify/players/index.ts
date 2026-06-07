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

  // const json_body = await resp.json();

  if (state === "player") {
    return await resp.json();
  } else if (state === "queue") {
    if (method === "POST") {
      return await resp.text();
    } else {
      return await resp.json();
    }
  } else {
    return await resp.text();
  }
};
