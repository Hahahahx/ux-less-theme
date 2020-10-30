import { compileLess } from "./compileLess/compile-less";
import * as path from "path";
/**
 * @param antdDir antd文件夹
 * @param indexDir less样式入口文件，确保该文件夹下存在唯一的index.less
 * @param output 样式导出文件夹
 * @param antdRequired 由于没法识别到底使用了哪些antd组件，
 * 所以每添加一个组件在项目里都要在这里添加进去才能做到按需加载以至于不会打包全部的antd样式
 * 如在项目中，添加了Button和TreeSelect则 ["button","tree-select"]
 */
interface ThemeOptions {
    antdDir: string;
    indexDir: string;
    outputDir: string;
    antdRequired?: string[];
}

interface ReqParams {
    compileAntd?: boolean;
    vars?: { [K: string]: string };
}

let option: ThemeOptions & { config: boolean };

/**
 * 设置插件配置
 */
function config(options: ThemeOptions) {
    option = { ...option, ...options, config: true };
}

/**
 * 生成两个antd自带的主题配置 dark.css compact.css
 */
function generaterAntd() {
    return isSetConfig(async () => {
        const resultDark = await generatorAntdTheme(option, "dark");
        const resultCompact = await generatorAntdTheme(option, "compact");

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
 */
function changeLessVars(params: ReqParams) {
    return isSetConfig(async () => {
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
            params.compileAntd ? filterData : undefined
        );
        return result;
    });
}

export { config, generaterAntd, changeLessVars };

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
const generatorAntdTheme = async (
    option: ThemeOptions,
    theme: "compact" | "dark"
) => {
    return await compileLess(
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
};

const hyphenateRE = /\B([A-Z])/g;
function hyphenate(str: string) {
    str = str.replace(hyphenateRE, "-$1").toLowerCase();
    return str.slice(1);
}

/**
 * 从新生成样式，只引入需要改变样式的antd组件。默认会生成全部的组件
 */
function filterData(data: string) {
    if (option.antdRequired && option.antdRequired.length) {
        data = "";
        option.antdRequired.forEach((str) => {
            data += `@import "../${hyphenate(str)}/style/index.less";`;
        });
    }
    return data;
}
