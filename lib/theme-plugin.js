"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeLessVars = exports.generaterAntd = exports.config = void 0;
const compile_less_1 = require("./compileLess/compile-less");
const path = require("path");
let option;
function config(options) {
    option = Object.assign(Object.assign(Object.assign({}, option), options), { config: true });
}
exports.config = config;
function generaterAntd() {
    return isSetConfig(() => __awaiter(this, void 0, void 0, function* () {
        const resultDark = yield generatorAntdTheme(option, "dark");
        const resultCompact = yield generatorAntdTheme(option, "compact");
        return {
            dark: resultDark,
            compact: resultCompact,
        };
    }));
}
exports.generaterAntd = generaterAntd;
function changeLessVars(params) {
    return isSetConfig(() => __awaiter(this, void 0, void 0, function* () {
        const indexPath = params.compileAntd
            ? path.resolve(option.antdDir, "lib/style/components.less")
            : path.resolve(option.indexDir, "index.less");
        const result = yield compile_less_1.compileLess(indexPath, path.resolve(option.outputDir, params.compileAntd ? "theme-antd.css" : "theme.css"), !params.compileAntd, params.vars, params.compileAntd ? filterData : undefined);
        return result;
    }));
}
exports.changeLessVars = changeLessVars;
function isSetConfig(fn) {
    if (option.config) {
        return fn();
    }
    else {
        throw Error("pleace set configuration frist");
    }
}
const generatorAntdTheme = (option, theme) => __awaiter(void 0, void 0, void 0, function* () {
    return yield compile_less_1.compileLess(path.resolve(option.antdDir, "lib/style/components.less"), path.resolve(option.outputDir, `${theme}.css`), false, undefined, (data) => {
        data = filterData(data);
        data += `\n@import "./${theme}.less";`;
        return data;
    });
});
const hyphenateRE = /\B([A-Z])/g;
function hyphenate(str) {
    str = str.replace(hyphenateRE, "-$1").toLowerCase();
    return str.slice(1);
}
function filterData(data) {
    if (option.antdRequired && option.antdRequired.length) {
        data = "";
        option.antdRequired.forEach((str) => {
            data += `@import "../${hyphenate(str)}/style/index.less";`;
        });
    }
    return data;
}