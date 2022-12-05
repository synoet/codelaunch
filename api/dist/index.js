"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _express = _interopRequireDefault(require("express"));
const _ide = require("./ide");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const app = (0, _express.default)();
app.get("/", (req, res)=>{
    res.send("Hello World!");
});
app.get("/pod/create/:id", async (req, res)=>{
    await (0, _ide.initializeIDE)(req.params.id);
    res.status(200).send("OK");
});
app.listen(8000, ()=>{
    console.log("listening at port 8000");
});

//# sourceMappingURL=index.js.map