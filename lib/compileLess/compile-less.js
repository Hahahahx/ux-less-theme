"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileLess = void 0;
const path = require("path");
const less = require("less");
const fs = require("fs");
const shake_1 = require("./shake");

function compileLess(input, output, shake, modifyVars, setInputData) {
    return new Promise((resolve, reject) => {
        try {
            
            const dir = path.dirname(input);
            
            let data = fs.readFileSync(input, "utf-8");
            
            if (data && setInputData) {
                data = setInputData(data);
            }
            
            less.parse(data, {
                paths: [dir],
                compress: true,
                modifyVars,
                javascriptEnabled: true,
            }, (err, root, imports, options) => {
                if (!err) {
                    if (shake) {
                        root.rules = shake_1.shaking(root.rules, options.modifyVars);
                    }
                    
                    const parseTree = new less.ParseTree(root, imports);
                    const result = parseTree.toCSS(options);
                    fs.writeFileSync(output, result.css);
                    resolve(true);
                }
                else {
                    reject(false);
                }
            });
        }
        catch (e) {
            reject(false);
        }
    });
}
exports.compileLess = compileLess;
