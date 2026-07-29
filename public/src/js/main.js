// deno-lint-ignore-file
var queryParam = new URLSearchParams(window.location.search);

var id = queryParam.get("id");

if (id !== undefined && id !== null) window.controllerRenderer(atob(id));
else window.connectRenderer();
