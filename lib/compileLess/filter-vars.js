"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterVars = void 0;
const utils_1 = require("./utils");

exports.filterVars = (allVars, vars) => {
    let flag = false;
    const result = [...vars];
    
    do {
        allVars.forEach((item) => {
            if (utils_1.isExpression(item, result)) {
                result.push(item.name);
                flag = true;
            }
        });
    } while (flag && (flag = false));
    
    return result;
};
