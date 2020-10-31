import { compileLess } from "./compileLess/compile-less";
import * as path from "path";
/**
 * @param antdDir antd文件夹
 * @param indexDir less样式入口文件，确保该文件夹下存在唯一的index.less
 * @param output 样式导出文件夹
 * @param whiteList 由于没法识别到底使用了哪些antd组件，
 * 所以每添加一个组件在项目里都要在这里添加进去才能做到按需加载以至于不会打包全部的antd样式
 * 如在项目中，添加了Button和TreeSelect则 ["button","tree-select"]
 * @param blackList 出了白名单还有黑名单，白名单的优先级高于黑名单
 */
interface ThemeOptions {
    antdDir: string;
    indexDir: string;
    outputDir: string;
    whiteList?: string[];
    blackList?: string[];
}

interface ReqParams {
    compileAntd?: boolean;
    vars?: { [K: string]: string };
    theme?: "dark" | "compact";
}

let option: ThemeOptions & { config: boolean };

/**
 * express插件
 * @param options
 */
function themeMiddleware(options: {
    baseUrl: string;
    antdDir: string;
    indexDir: string;
    outputDir: string;
}) {
    option = { ...option, ...options, config: true };
    return async function (req: any, res: any, next: any) {
        const { baseUrl } = options;
        if (
            req.originalUrl.slice(0, baseUrl.length).includes(options.baseUrl)
        ) {
            req.query.whiteList && (option.whiteList = req.query.whiteList);
            req.query.blackList && (option.blackList = req.query.blackList);
            switch (true) {
                case !!req.query.generater: {
                    const result = await generaterAntd(req.query.theme);
                    res.json({ result });
                    break;
                }
                case !!req.query.vars: {
                    const result = await changeLessVars({
                        ...req.query,
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
    };
}

/**
 * 设置插件配置
 */
function config(options: ThemeOptions) {
    option = { ...option, ...options, config: true };
}

/**
 * 生成两个antd自带的主题配置 dark.css compact.css
 */
function generaterAntd(theme?: "dark" | "compact") {
    return isSetConfig(async function () {
        let resultDark = false;
        let resultCompact = false;
        if (theme) {
            const result = await generatorAntdTheme(option, theme);
            theme === "dark" ? (resultDark = result) : (resultCompact = result);
        } else {
            resultDark = await generatorAntdTheme(option, "dark");
            resultCompact = await generatorAntdTheme(option, "compact");
        }

        return {
            dark: resultDark,
            compact: resultCompact,
        };
    });
}

/**
 * 改变less变量，生成css
 * @param vars 变量，键值对，如：{"@primary-color":"red"}
 * @param compileAntd 是否对antd编译，如果是否则编译index.less即自定义的样式，否则就对antd渲染
 * @param theme 主题，只有在compileAntd为true时有效，可选项为dark|compact
 */
function changeLessVars(params: ReqParams) {
    return isSetConfig(async function () {
        const indexPath = params.compileAntd
            ? path.resolve(option.antdDir, "lib/style/components.less")
            : path.resolve(option.indexDir, "index.less");

        const result = await compileLess(
            indexPath,
            path.resolve(
                option.outputDir,
                params.compileAntd ? "theme-antd.css" : "theme.css"
            ),
            !params.compileAntd,
            params.vars,
            params.compileAntd ? filterData(params.theme) : undefined
        );
        return result;
    });
}

export { config, generaterAntd, changeLessVars, themeMiddleware };

/**
 * 判断是否设置了插件配置
 */
function isSetConfig(fn: Function) {
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
async function generatorAntdTheme(
    option: ThemeOptions,
    theme: "compact" | "dark"
) {
    return await compileLess(
        path.resolve(option.antdDir, "lib/style/components.less"),
        path.resolve(option.outputDir, `${theme}.css`),
        false,
        undefined,
        filterData(theme)
    );
}

const hyphenateRE = /\B([A-Z])/g;
function hyphenate(str: string) {
    return str.replace(hyphenateRE, "-$1").toLowerCase().trim();
}

/**
 * 从新生成样式，只引入需要改变样式的antd组件。默认会生成全部的组件
 */
function filterData(theme?: "dark" | "compact") {
    return function (data: string) {
        if (option.whiteList && option.whiteList.length) {
            data = "";
            option.whiteList.forEach((str) => {
                data += `\n@import "../${hyphenate(str)}/style/index.less";`;
            });
        } else if (option.blackList && option.blackList.length) {
            option.blackList.forEach((str) => {
                const declaration = `@import "../${hyphenate(
                    str
                )}/style/index.less";`;
                data.replace(declaration, "");
            });
        }
        if (theme) {
            data += `\n@import "./${theme}.less";`;
        }
        return data;
    };
}
