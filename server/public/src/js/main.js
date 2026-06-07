// deno-lint-ignore-file
const queryParam = new URLSearchParams(window.location.search);

const id = queryParam.get("id");

if (id !== undefined && id !== null) controllerRenderer(atob(id));
else connectRenderer();
