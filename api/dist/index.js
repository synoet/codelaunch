"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _express = _interopRequireDefault(require("express"));
const _ide = require("./ide");
const _auth = require("./auth");
const _cookieParser = _interopRequireDefault(require("cookie-parser"));
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
app.get("/", (req, res)=>{
    res.send("Hello World!");
});
app.get("/auth/github", (req, res)=>{
    const clientId = process.env.GITHUB_CLIENT_ID;
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user`);
});
app.get("/auth/callback", (req, res)=>(0, _auth.callbackHandler)(req, res));
app.get("/pod/create/:id", async (req, res)=>{
    await (0, _ide.initializeIDE)(req.params.id);
    res.status(200).send("OK");
});
app.listen(8000, ()=>{
    console.log("listening at port 8000");
});

//# sourceMappingURL=index.js.map