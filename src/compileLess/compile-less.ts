import * as path from "path";
import * as less from "less";
import * as fs from "fs";
import { shaking } from "./shake";

/**
 * tree Share
 *
 * 叶子接点为每行样式，如margin：10px 叶子节点类型Declaration
 * 删除所有叶子节点不为类型Variable的，只保留变量
 * 叶子节点类型为 Declaration
 *
 * less类型
 *
 * Import 导入
 * Circular 原生样式 被复用
 * Ruleset 无复用样式
 * Comment 注释
 * AtRulet 带 @ 的样式
 *
 *
 * 通用嵌套均为Ruleset -> rules -> [各个样式]
 *
 * 如果是进入Import -> root -> rules -> [各个样式]   root为Ruleset类型
 * @param input index.less文件
 * @param output 输出的css文件
 * @param shake 是否开启shaking功能
 * @param modifyVars 自定以的变量
 * @param addInput 在index.less后面增加新的样式字符串
 */
export function compileLess(
    input: string,
    output: string,
    shake: boolean,
    modifyVars?: object,
    setInputData?: (data: string) => string
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            // 获取index.less文件所在文件夹的路径，确保index.less中@import的相对路径都是从该目录开始的
            const dir = path.dirname(input);
            // 读取index.less文件内容
            let data = fs.readFileSync(input, "utf-8");
            // 增设内容
            if (data && setInputData) {
                data = setInputData(data);
            }
            // @ts-ignore
            less.parse(
                data,
                {
                    paths: [dir], // Specify search paths for @import directives
                    compress: true, // Minify CSS output
                    modifyVars,
                    javascriptEnabled: true,
                    // rootpath: imagesDir, //url替换路径
                },
                (err: any, root: any, imports: any, options: any) => {
                    if (!err) {
                        if (shake) {
                            root.rules = shaking(
                                root.rules,
                                options.modifyVars
                            );
                        }
                        // @ts-ignore
                        const parseTree = new less.ParseTree(root, imports);
                        const result = parseTree.toCSS(options);
                        fs.writeFileSync(output, result.css);
                        resolve(true);
                    } else {
                        reject(false);
                    }
                }
            );
        } catch (e) {
            reject(false);
        }
    });
}
