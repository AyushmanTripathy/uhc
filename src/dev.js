import { watch } from "chokidar";
import { createInterface } from "readline";
import { extname, resolve, basename } from "path";
import { existsSync, readFileSync } from "fs";
import { cyan, green, red, grey } from "btss";
import { createServer } from "http";
import handler from "serve-handler";
import * as core from "./core.js";
import { WebSocketServer } from "ws";

export default function (config_path) {
  core.loadConfig(config_path);
  compileOnChange(src);

  const port = 8080;
  const ws_port = 8882;
  const server = createServer((req, res) => {
    try {
      let filePath = req.url;
      if (filePath.endsWith("/")) filePath = filePath + "index.html";

      if (extname(filePath) != ".html")
        return handler(req, res, {
          public: build,
        });

      filePath = resolve(build, "." + filePath);
      if (!existsSync(filePath)) {
        log(red("GET ") + req.url);
        res.writeHead(404);
        res.end("Not Found " + req.url);
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        let file = readFileSync(filePath, "utf-8");
        const js = `<script defer>
          const ws = new WebSocket("ws://localhost:${ws_port}");
          console.log("%cUHC watching...",'font-weight: 800;')
          ws.addEventListener('message', ({ data }) => {
            if(data == "reload") window.location.reload();
          });
          </script>`;
        if (file.includes("</body>"))
          file = file.replace("</body>", js + "</body>");
        else if (file.includes("</html>"))
          file = file.replace("</html>", js + "</html>");
        else file += js;
        res.end(file);
      }
    } catch (e) {
      res.writeHead(500);
      res.end("Internal Server Error\n" + e);
    }
  });
  server.listen(port, () => log(cyan("Serving on http://localhost:" + port)));

  const wss = new WebSocketServer({ port: ws_port });
  watchDir(
    build,
    () => {
      wss.clients.forEach((ws) => ws.send("reload"));
      log(grey("reloading..."));
    },
    500
  );
}

export async function compileOnChange(path, load_config, config_path) {
  log(green('"r" to recompile or "q" to quit'));
  if (load_config) core.loadConfig(config_path);

  createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  }).on("line", (data) => {
    if (data == "r") core.default(true);
    else if (data == "q") process.exit();
  });

  await watchDir(path, (event, path) => {
    globalThis.template = readFileSync(resolve(src, config.template), "utf-8");
    log(green(event + " : " + basename(path)));
    core.default(true);
  });
}

async function watchDir(path, callback, wait = 400) {
  let react = false;
  watch(path)
    .on("all", (event, path) => {
      if (!react) return;
      callback(event, path);
      react = false;
      setTimeout(() => (react = true), wait);
    })
    .on("ready", () => (react = true));
}
