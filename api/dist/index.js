"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _express = _interopRequireDefault(require("express"));
const _ide = require("./ide");
const _auth = require("./auth");
const _cookieParser = _interopRequireDefault(require("cookie-parser"));
const _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
const _cors = _interopRequireDefault(require("cors"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const dotenv = require("dotenv");
const app = (0, _express.default)();
dotenv.config();
app.use(_express.default.json());
app.use(_express.default.urlencoded({
    extended: true
}));
app.use((0, _cookieParser.default)());
app.use((0, _cors.default)());
app.get("/", (req, res)=>{
    res.send("Hello World!");
});
app.get("/auth/github", (req, res)=>{
    const clientId = process.env.GITHUB_CLIENT_ID;
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user`);
});
app.get("/auth/callback", (req, res)=>(0, _auth.callbackHandler)(req, res));
app.get("/auth/whoami", async (req, res)=>{
    let token = req.cookies.auth_token;
    if (!token) {
        return res.status(404).send("unauthorized");
    }
    token = _jsonwebtoken.default.verify(token, process.env.JWT_SECRET);
    if (!token) {
        return res.status(404).send("unauthorized");
    }
    return res.status(200).send(token);
});
app.get("/ide/create", async (req, res)=>{
    let token = req.cookies.auth_token;
    token = _jsonwebtoken.default.verify(token, process.env.JWT_SECRET);
    const ideResponse = await (0, _ide.initializeIDE)(token.id);
    if (ideResponse.status === "created" || ideResponse.status === "running") {
        if (ideResponse.clusterIP) {
            res.cookie("session_token", (0, _auth.createSessionToken)(ideResponse.clusterIP, token.id), {
                httpOnly: true,
                domain: ".codelaunch.sh"
            });
        }
    }
    res.status(200).send(ideResponse.status);
});
app.get("/ide/status", async (req, res)=>{
    let token = req.cookies.auth_token;
    token = _jsonwebtoken.default.verify(token, process.env.JWT_SECRET);
    if (!token) {
        return res.status(404).send("Unauthorized");
    }
    const isRunning = await (0, _ide.isIDERunning)(token.id);
    return res.status(200).send(isRunning);
});
app.listen(8000, ()=>{
    console.log("listening at port 8000");
});

//# sourceMappingURL=index.js.map