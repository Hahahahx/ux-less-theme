declare module "ux-less-theme" {
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

    /**
     * 设置插件配置
     * @param antdDir antd文件夹
     * @param indexDir less样式入口文件，确保该文件夹下存在唯一的index.less
     * @param output 样式导出文件夹
     * @param whiteList 由于没法识别到底使用了哪些antd组件，
     * 所以每添加一个组件在项目里都要在这里添加进去才能做到按需加载以至于不会打包全部的antd样式
     * 如在项目中，添加了Button和TreeSelect则 ["button","tree-select"]
     * @param blackList 出了白名单还有黑名单，白名单的优先级高于黑名单
     */
    function config(options: ThemeOptions): void;
    /**
     * 生成两个antd自带的主题配置 dark.css compact.css
     */
    function generaterAntd(
        theme?: "dark" | "compact"
    ): Promise<{ dark: boolean; compact: boolean }>;
    /**
     * 改变less变量，生成css
     * @param vars 变量，键值对，{"@primary-color":"red"}
     * @param compileAntd 是否对antd编译，如果是否则编译index.less即自定义的样式，否则就对antd渲染
     * @param theme 主题，只有在compileAntd为true时有效，可选项为dark|compact
     */
    function changeLessVars(params: ReqParams): Promise<boolean>;

    /**
     * express插件
     * @param baseUrl 访问路由
     * @param antdDir antd文件夹
     * @param indexDir less样式入口文件，确保该文件夹下存在唯一的index.less
     * @param output 样式导出文件夹
     * @param whiteList 由于没法识别到底使用了哪些antd组件，
     * 如在项目中，添加了Button和TreeSelect则 ["Button","TreeSelect"]
     * 这样，在打包的时候就只会生成这两个组件的css。
     * @param blackList 出了白名单还有黑名单，白名单的优先级高于黑名单
     */
    function themeMiddleware(
        options: ThemeOptions & { baseUrl: string }
    ): (req, res, next) => void;

    export { config, generaterAntd, changeLessVars, themeMiddleware };
}
