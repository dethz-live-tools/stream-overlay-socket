var param = new URLSearchParams(window.location.search);

var err = param.get("error");
var code = param.get("code");
var state = param.get("state");

var tokenFetch = async () => {
  let endpoint = atob(state);

  if (endpoint.includes("localhost:") || endpoint.includes("127.0.0.1:")) {
    endpoint = ``;
  } else {
    endpoint = `https://${endpoint}`;
  }

  const tokenResp = await (
    await fetch(`${endpoint}/api/spotify/callback`, {
      method: "POST",
      body: JSON.stringify({ code: code, state: state }),
    })
  ).json();

  if (tokenResp.status === "1" || tokenResp.status === 1) {
    if (tokenResp.payload.state === "1" || tokenResp.payload.state === 1) {
      if (tokenResp.payload.data.error !== undefined) {
        console.error(tokenResp.payload.data);
        Swal.fire({
          icon: "error",
          title: "Something went wrong",
          text: `${tokenResp.payload.data.error}: ${tokenResp.payload.data.error_description}`,
        });
        return;
      }

      if (tokenResp.payload.data) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Auth successfully!",
        }).then(() => {
          // socketConnector(atob(state), tokenResp.payload.data);

          if (window.location.href.split("://")[1].startsWith("127.0.0.1:")) {
            window.location.href = `http://localhost:3000/spotify/session/?token=${btoa(
              JSON.stringify(tokenResp.payload.data),
            )}&state=${state}`;
          } else {
            window.location.href = `/spotify/session/?token=${btoa(
              JSON.stringify(tokenResp.payload.data),
            )}&state=${state}`;
          }
        });
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: tokenResp.payload.message,
      });
    }
  } else {
    Swal.fire({
      icon: "error",
      title: "Something went wrong",
      text: tokenResp.message,
    });
  }
};

if (err !== null) {
  console.error(err);
} else {
  if (code !== undefined) {
    tokenFetch();
  }
}
