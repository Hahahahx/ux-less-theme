import { isExpression } from "./utils";

/**
 * 过滤不被依赖的变量
 * 如@primary-color被改变
 * 但是@colorA @colorB 都依赖该@parimay-color
 * 那么这两个变量也会被收集
 * @param allVars 所有的变量，在第一次shaking的时候就会拿到
 * @param vars  需要更新的变量，由前端传值或者其他传值
 */
export const filterVars = (allVars: any[], vars: string[]) => {
    let flag = false;
    const result = [...vars];
    // 当依赖变量被收集的时候，还需要重新循环查找该变量是否也存在依赖它的变量
    do {
        allVars.forEach((item) => {
            if (isExpression(item, result)) {
                result.push(item.name);
                flag = true;
            }
        });
    } while (flag && (flag = false));
    // console.log(result)
    return result;
};
