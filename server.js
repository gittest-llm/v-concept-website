const http = require("http");
const fs = require("fs");
const path = require("path");
const { StringDecoder } = require("string_decoder");

const publicDir = path.join(__dirname, "public");
const leads = [];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".otf": "font/otf",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req, callback) {
  const decoder = new StringDecoder("utf8");
  let buffer = "";

  req.on("data", (chunk) => {
    buffer += decoder.write(chunk);
    if (buffer.length > 1_000_000) {
      req.destroy();
    }
  });

  req.on("end", () => {
    buffer += decoder.end();
    try {
      callback(null, buffer ? JSON.parse(buffer) : {});
    } catch (error) {
      callback(error);
    }
  });
}

function resolvePublicPath(url = "/") {
  const cleanPath = decodeURIComponent(url.split("?")[0]);
  const requested = cleanPath === "/" ? "/index.html" : cleanPath;
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, normalized);

  return filePath.startsWith(publicDir) ? filePath : null;
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, error.code === "ENOENT" ? 404 : 500, {
        error: error.code === "ENOENT" ? "Not found" : "Server error"
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=86400"
    });
    res.end(content);
  });
}

function handleConsultation(req, res) {
  readBody(req, (error, body = {}) => {
    if (error) {
      sendJson(res, 400, { error: "Invalid JSON payload" });
      return;
    }

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const need = String(body.need || "").trim();

    if (!name || phone.length < 8 || !need) {
      sendJson(res, 422, {
        error: "Vui lòng nhập họ tên, số điện thoại và nhu cầu tư vấn."
      });
      return;
    }

    const lead = {
      id: `vc_${Date.now()}`,
      name,
      phone,
      need,
      area: String(body.area || "").trim(),
      budget: String(body.budget || "").trim(),
      createdAt: new Date().toISOString()
    };

    leads.push(lead);
    console.log("V-Concept consultation lead:", lead);

    sendJson(res, 201, {
      ok: true,
      message: "Cam on ban. V-Concept se lien he lai trong thoi gian som nhat."
    });
  });
}

function requestHandler(req, res) {
  if (req.method === "POST" && req.url === "/api/consultation") {
    handleConsultation(req, res);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const filePath = resolvePublicPath(req.url);
  if (!filePath) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  sendFile(res, filePath);
}

function start(port, attemptsLeft = 20) {
  const server = http.createServer(requestHandler);

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      start(port + 1, attemptsLeft - 1);
      return;
    }

    console.error(error);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`V-Concept website running at http://localhost:${port}`);
  });
}

const preferredPort = Number(process.env.PORT || 3001);
start(Number.isFinite(preferredPort) ? preferredPort : 3001);
