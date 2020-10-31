import { filterVars } from "./filter-vars";
import { TypeEvent } from "./type-event";
import { isExpression } from "./utils";

/**
 * 过滤不需要重新编译的样式
 */
// @ts-ignore
function shake(
    ruleset: any,
    getVars: ((v: any) => void) | null,
    vars?: string[]
) {
    /**
     * 递归遍历语法树
     * @param rule
     * @param callback 把检测到的结果传递到回调中，重定义结果必须放在外层函数中做，不然会报错。
     */
    function doRecursion(rule: any, callback: (rules: any) => void) {
        if (rule.rules && rule.rules.length) {
            // 递归并删减无用（非用户需要改变的）样式
            const rules = shake(rule.rules, getVars, vars);
            if (rules.length) {
                callback(rules);
            }
        }
    }
    const results: any[] = [];
    ruleset.forEach((rule: any, index: number) => {
        try {
            const event = new TypeEvent(rule)
                .setImport(() => {
                    // 有的Import对象可能没有这个root...
                    rule.root &&
                        rule.root.rules &&
                        doRecursion(rule.root, (rules) => {
                            rule.root.rules = rules;
                            results.push(rule);
                        });
                })
                .setRuleset(() => {
                    rule.rules &&
                        doRecursion(rule, (rules) => {
                            rule.rules = rules;
                            results.push(rule);
                        });
                })
                .setDefinition(() => {
                    // 自定义函数
                    let params = rule.params.map((item: any) => item.name);
                    // 由于要加上对参数中的变量的比对，所以没法向下传递，
                    // 除非是在vars直接push进函数里的变量，但是不知道会不会污染其他的判断，想来应该是会的。
                    // 当然也可以再加上一个量来判断，但是我怕搞混乱了，先这样，能跑起来，
                    // 代码段虽然大坨但是好理解一点。优化放在后面再说好了。。。
                    vars && (params = [...params, ...vars]);
                    const resultsDefinition: any[] = [];
                    rule.rules.forEach((item: any) => {
                        if (item.variable) {
                            resultsDefinition.push(item);
                            if (Array.isArray(item.value.value)) {
                                if (isExpression(item, params)) {
                                    getVars(item);
                                }
                            }
                        } else {
                            isExpression(item, params) &&
                                resultsDefinition.push(item);
                        }
                    });
                    rule.rules = resultsDefinition;
                    results.push(rule);
                })
                .setMixinCall(() => {
                    // 自定义函数的调用
                    rule.arguments.some((item: any) => {
                        if (isExpression(item, vars)) {
                            results.push(rule);
                            return true;
                        }
                    });
                })
                .setDeclaration(() => {
                    // 如果是变量的话直接忽略不做shake

                    if (rule.variable) {
                        // console.log(rule)
                        // 因为变量有较复杂的依赖关系，所以不做过滤。比如说在类名中也有可能存在变量 .@{var}-st
                        results.push(rule);
                        if (Array.isArray(rule.value.value)) {
                            // 寻找变量可能是被变量赋值的依赖关系
                            // 过滤less变量是字面量的
                            if (isExpression(rule, vars)) {
                                getVars && getVars(rule);
                            }
                        }
                        // results.push(rule);
                    } else {
                        // 过滤所有字面量的样式
                        isExpression(rule, vars) && results.push(rule);
                    }
                })
                .setAtRule(() => {
                    // 外层
                    // 测试时列表中只会有一个，但不确定是否会有多个所以循环
                    return rule.rules.some((ruleset: any) => {
                        // from、to...
                        return ruleset.rules.some((fromTo: any) => {
                            // 被from、to包裹的每一条样式
                            if (fromTo.rules) {
                                return fromTo.rules.some((decalration: any) => {
                                    if (isExpression(decalration, vars)) {
                                        results.push(rule);
                                        return true;
                                    }
                                });
                            } else {
                                if (isExpression(fromTo, vars)) {
                                    results.push(rule);
                                    return true;
                                }
                            }
                        });
                    });
                })
                .run();
        } catch (e) {
            console.log(rule);
            console.log(e);
        }
    });
    return results;
}

export function shaking(rules: any[], modifyVars: {}) {
    // 拿到需要更新的变量的命名列表
    const vars = Object.keys(modifyVars);
    // 去除所有不需要的样式
    const allVars: any = {};
    // 回调函数用于获取所有拥有变量依赖的变量，第一次shaking掉所有不被变量依赖的样式，即字面量样式
    shake(rules, (v) => {
        allVars[v.name] = v;
    });
    // 判断依赖
    const newVars = filterVars(Object.values(allVars), vars);
    // 对所有不含依赖变量的样式进行shaking
    rules = shake(rules, undefined, newVars);

    return rules;
}
