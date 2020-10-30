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
exports.themeMiddleware = void 0;
const compileLess_1 = require("./compileLess/compileLess");
const path = require("path");
exports.themeMiddleware = (option) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (req.originUrl.slice(0, option.url.length) === option.url) {
            const urls = option.url.split("/");
            switch (urls[urls.length - 1]) {
                case "generater": {
                    const resultDark = yield generatorAntdTheme(option, "dark");
                    const resultCompact = yield generatorAntdTheme(option, "compact");
                    res.json({
                        dark: resultDark,
                        compact: resultCompact,
                    });
                    break;
                }
                case "changevars": {
                    const params = req.body;
                    if (params.compileAntd) {
                        const result = compileLess_1.compileLess(path.resolve(option.antdDir, "lib/style/components.less"), path.resolve(option.outputDir, `theme.css`), params.shaking, params.vars);
                        res.json({ result });
                    }
                    else {
                        const result = compileLess_1.compileLess(option.lessFile, path.resolve(option.outputDir, `theme.css`), params.shaking, params.vars);
                        res.json({ result });
                    }
                }
            }
        }
        next();
    });
};
/**
 * 生成两个antd自带的主题
 * @param option
 * @param theme
 */
const generatorAntdTheme = (option, theme) => __awaiter(void 0, void 0, void 0, function* () {
    return yield compileLess_1.compileLess(path.resolve(option.antdDir, "lib/style/components.less"), path.resolve(option.outputDir, `${theme}.css`), false, undefined, `\n@import "./${theme}.less";`);
});
//# sourceMappingURL=themeMiddleware.js.map