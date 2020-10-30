"use strict";
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : adopt(result.value).then(fulfilled, rejected);
            }
            step(
                (generator = generator.apply(thisArg, _arguments || [])).next()
            );
        });
    };
Object.defineProperty(exports, "__esModule", { value: true });
exports.themeMiddleware = exports.changeLessVars = exports.generaterAntd = exports.config = void 0;
const compile_less_1 = require("./compileLess/compile-less");
const path = require("path");
let option;
/**
 * express插件
 * @param options
 */
function themeMiddleware(options) {
    option = Object.assign(Object.assign(Object.assign({}, option), options), {
        config: true,
    });
    return function (req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { baseUrl } = options;
            if (
                req.originalUrl
                    .slice(0, baseUrl.length)
                    .includes(options.baseUrl)
            ) {
                switch (true) {
                    case req.query.generater: {
                        const result = yield generaterAntd();
                        res.json({ result });
                        break;
                    }
                    case !!req.query.vars: {
                        const result = yield changeLessVars({
                            compileAntd: req.query.compileAntd,
                            vars: req.query.vars,
                        });
                        res.json({ result });
                        break;
                    }
                    default:
                        res.json({ result: false });
                        break;
                }
            } else {
                next();
            }
        });
    };
}
exports.themeMiddleware = themeMiddleware;
/**
 * 设置插件配置
 */
function config(options) {
    option = Object.assign(Object.assign(Object.assign({}, option), options), {
        config: true,
    });
}
exports.config = config;
/**
 * 生成两个antd自带的主题配置 dark.css compact.css
 */
function generaterAntd() {
    return isSetConfig(function () {
        return __awaiter(this, void 0, void 0, function* () {
            const resultDark = yield generatorAntdTheme(option, "dark");
            const resultCompact = yield generatorAntdTheme(option, "compact");
            return {
                dark: resultDark,
                compact: resultCompact,
            };
        });
    });
}
exports.generaterAntd = generaterAntd;
/**
 * 改变less变量，生成css
 * @param vars 变量，键值对，如：{"@primary-color":"red"}
 * @param compileAntd 是否对antd编译，如果是否则编译index.less即自定义的样式，否则就对antd渲染
 */
function changeLessVars(params) {
    return isSetConfig(function () {
        return __awaiter(this, void 0, void 0, function* () {
            const indexPath = params.compileAntd
                ? path.resolve(option.antdDir, "lib/style/components.less")
                : path.resolve(option.indexDir, "index.less");
            const result = yield compile_less_1.compileLess(
                indexPath,
                path.resolve(
                    option.outputDir,
                    params.compileAntd ? "theme-antd.css" : "theme.css"
                ),
                !params.compileAntd,
                params.vars,
                params.compileAntd ? filterData : undefined
            );
            return result;
        });
    });
}
exports.changeLessVars = changeLessVars;
/**
 * 判断是否设置了插件配置
 */
function isSetConfig(fn) {
    if (option.config) {
        return fn();
    } else {
        throw Error("pleace set configuration frist");
    }
}
/**
 * 生成两个antd自带的主题
 * @param option
 * @param theme
 */
function generatorAntdTheme(option, theme) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield compile_less_1.compileLess(
            path.resolve(option.antdDir, "lib/style/components.less"),
            path.resolve(option.outputDir, `${theme}.css`),
            false,
            undefined,
            (data) => {
                data = filterData(data);
                data += `\n@import "./${theme}.less";`;
                return data;
            }
        );
    });
}
const hyphenateRE = /\B([A-Z])/g;
function hyphenate(str) {
    return str.replace(hyphenateRE, "-$1").toLowerCase();
}
/**
 * 从新生成样式，只引入需要改变样式的antd组件。默认会生成全部的组件
 */
function filterData(data) {
    if (option.antdRequired && option.antdRequired.length) {
        data = "";
        option.antdRequired.forEach((str) => {
            data += `\n@import "../${hyphenate(str)}/style/index.less";`;
        });
    }
    return data;
}
