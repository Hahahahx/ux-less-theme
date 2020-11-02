import { filterVars } from "./filter-vars";
import { TypeEvent } from "./type-event";
import { isExpression, isType } from "./utils";

/**
 * 过滤不需要重新编译的样式
 */
// @ts-ignore
function shake(
    isShaking: boolean,
    ruleset: any,
    getVars: ((v: any) => void) | null,
    vars?: string[],
    map?: Map<string, boolean[]>
) {
    /**
     * 递归遍历语法树
     * @param rule
     * @param callback 把检测到的结果传递到回调中，重定义结果必须放在外层函数中做，不然会报错。
     */
    function doRecursion(rule: any, callback: (rules: any) => void) {
        if (rule.rules && rule.rules.length) {
            // 递归并删减无用（非用户需要改变的）样式
            const rules = shake(isShaking, rule.rules, getVars, vars, map);
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
                    // 函数定义
                    const args = map && map.get(rule.name);
                    // 查找出的形参应该只作用于该函数以及其叶子节点
                    const oldVars = vars;
                    // 如果实参存在与依赖变量的关系，那么查找出对应位置的形参
                    // 该形参也应该被作用，不能被shaking所移除。
                    if (vars && args) {
                        const params = rule.params.filter(
                            (item: any, index: number) => {
                                return args[index];
                            }
                        );
                        vars = [
                            ...vars,
                            ...params.map((item: any) => item.name),
                        ];
                    }
                    rule.rules &&
                        doRecursion(rule, (rules) => {
                            rule.rules = rules;
                        });
                    // 查找出的形参应该只作用于该函数以及其叶子节点
                    vars = oldVars;
                    results.push(rule);
                })
                .setMixinCall(() => {
                    // 自定义函数的调用
                    if (vars) {
                        const funcName = rule.selector.elements[0].value;
                        // 找出依赖变量的实参，将其的序号存放到map中，因为无法确认形参中与实参的命名，
                        // 所以只对他们的序号对应关系做判断，如函数.btn-color(@color,@width,@colorC)
                        // 其中@color与@colorC都依赖于我们所需要修改的变量，那么map为[true,false,true]
                        // 那么在函数.btn-color的声明中，所有与@color、@colorC依赖的样式也会被保留。
                        let args = rule.arguments.map((item: any) => {
                            return (
                                item &&
                                isType(item.value, "Expression") &&
                                isExpression(item, vars)
                            );
                        });
                        // 如果其中有找到依赖变量就存放到map里，如果没有就直接忽略。
                        if (args.includes(true)) {
                            const params = map.get(funcName);
                            // 因为声明是唯一的，而函数存在多次调用，不能保证此刻调用的实参与依赖变量的关系是否在下次也是如此
                            // 所以，向上兼容，只会扩充关系。如上述的函数.btn-color，此时的实参发生改变：
                            // .btn-color(@none,@colorB,@none)，只有@colorB与依赖变量有关系，那么判断出的对应
                            // 位置关系应该为[false,true,false]。可是如此，就覆盖了上一次的结果。
                            // 所以结果应该是[true,true,true]。这样虽然存在一点多余的可能性，但确保了不会出错。
                            if (params) {
                                args = params.map(
                                    (item: any, index: number) =>
                                        item || args[index]
                                );
                            }
                            map.set(funcName, args);
                        }
                    }

                    results.push(rule);
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
    // 收集函数中的变量
    const map = new Map();

    // 第一次遍历找出所有的变量
    shake(
        false,
        rules,
        (v) => {
            allVars[v.name] = v;
        },
        undefined,
        map
    );

    // 判断变量依赖
    const newVars = filterVars(Object.values(allVars), vars);
    // 第二次变量找到所有函数形参与实参的关系，判断哪些实参与变量存在依赖，在函数中应该保留这些依赖。
    // 比如改变了变量@primary-color，在函数.btn-color()中形参叫做@color，而实参则是@primary-color，
    // 如果直接按着已经查找出的依赖变量做shaking，就会检测不到@color与@primary-color的关系
    // 所以需要保留这个关系，但是却不能把它直接添加到全部变量中，因为不确保全部变量中是否存在@color，
    // 污染到全局数据，所以存放在map中，用到的时候再做判断
    shake(false, rules, undefined, newVars, map);

    // 第一此与第二次均为查找变量的过程，第三次真正的shaking，剔除所有与依赖变量无关的叶子节点。
    shake(true, rules, undefined, newVars, map);

    return rules;
}
