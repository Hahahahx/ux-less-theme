import { compileLess } from "./compileLess/compileLess";
import * as path from "path";
/**
 * @param antdDir antd文件夹目录
 * @param antdRequired 由于没法识别到底使用了哪些antd组件，
 * 所以每添加一个组件在项目里都要在这里添加进去才能做到按需加载以至于不会打包全部的antd样式
 * 如在项目中，添加了Button和TreeSelect则 ["button","tree-select"]
 * @param lessIndex less样式入口文件，确保项目有一个唯一的入口
 * @param url 项目启动本地服务器访问地址，如:"/less"
 */
interface ThemeOptions {
    antdDir?: string;
    antdRequired?: string[];
    lessFile?: string;
    outputDir?: string;
    url?: string;
}

interface ReqParams {
    compileAntd?: boolean;
    vars?: { [K: string]: string };
    shaking?: boolean;
}

async function generaterAntd(antdDir: string, outputDir: string) {
    const resultDark = await generatorAntdTheme(
        {
            antdDir,
            outputDir,
        },
        "dark"
    );
    const resultCompact = await generatorAntdTheme(
        {
            antdDir,
            outputDir,
        },
        "compact"
    );

    return {
        dark: resultDark,
        compact: resultCompact,
    };
}

async function changeLessVars(
    params: ReqParams,
    lessFile: string,
    antdDir: string,
    outputDir: string
) {
    if (params.compileAntd) {
        const result = await compileLess(
            path.resolve(antdDir, "lib/style/components.less"),
            path.resolve(outputDir, `theme.css`),
            params.shaking,
            params.vars
        );
        return result;
    } else {
        const result = await compileLess(
            lessFile,
            path.resolve(outputDir, `theme.css`),
            params.shaking,
            params.vars
        );
        return result;
    }
}

function themeMiddleware(option: ThemeOptions) {
    return async (req: any, res: any, next: any) => {
        const reqUrl = req.originalUrl;
        const baseUrl = option.url;
        if (reqUrl && reqUrl.slice(0, baseUrl.length) === baseUrl) {
            const urls = reqUrl.split("/");
            switch (urls[urls.length - 1]) {
                case "generater": {
                    const resultDark = await generatorAntdTheme(option, "dark");
                    const resultCompact = await generatorAntdTheme(
                        option,
                        "compact"
                    );
                    res.json({
                        dark: resultDark,
                        compact: resultCompact,
                    });
                    break;
                }
                case "changevars": {
                    const params: ReqParams = req.body;
                    if (params.compileAntd) {
                        const result = await compileLess(
                            path.resolve(
                                option.antdDir,
                                "lib/style/components.less"
                            ),
                            path.resolve(option.outputDir, `theme.css`),
                            params.shaking,
                            params.vars
                        );
                        res.json({ result });
                    } else {
                        const result = await compileLess(
                            option.lessFile,
                            path.resolve(option.outputDir, `theme.css`),
                            params.shaking,
                            params.vars
                        );
                        res.json({ result });
                    }
                }
            }
        }
        next();
    };
}

export { themeMiddleware, generaterAntd, changeLessVars };

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
        `\n@import "./${theme}.less";`
    );
};
