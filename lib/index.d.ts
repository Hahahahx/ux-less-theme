declare module "ux-less-theme" {
    /**
     * @param antdDir antd文件夹目录
     * @param antdRequired 由于没法识别到底使用了哪些antd组件，
     * 所以每添加一个组件在项目里都要在这里添加进去才能做到按需加载以至于不会打包全部的antd样式
     * 如在项目中，添加了Button和TreeSelect则 ["button","tree-select"]
     * @param lessIndex less样式入口文件，确保项目有一个唯一的入口
     * @param url 项目启动本地服务器访问地址，如:"/less"
     */
    interface ThemeOptions {
        antdDir: string;
        antdRequired?: string[];
        lessFile: string;
        outputDir: string;
        url: string;
    }


    function ThemeMiddleware(option: ThemeOptions): void;
    export default ThemeMiddleware ;
}
