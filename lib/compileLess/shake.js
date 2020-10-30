"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shaking = void 0;
const filter_vars_1 = require("./filter-vars");
const type_event_1 = require("./type-event");
const utils_1 = require("./utils");
/**
 * 过滤不需要重新编译的样式
 */
// @ts-ignore
function shake(ruleset, getVars, vars) {
    /**
     * 递归遍历语法树
     * @param rule
     * @param callback 把检测到的结果传递到回调中，重定义结果必须放在外层函数中做，不然会报错。
     */
    function doRecursion(rule, callback) {
        if (rule.rules && rule.rules.length) {
            // 递归并删减无用（非用户需要改变的）样式
            const rules = shake(rule.rules, getVars, vars);
            if (rules.length) {
                callback(rules);
            }
        }
    }
    const results = [];
    ruleset.forEach((rule, index) => {
        try {
            const event = new type_event_1.TypeEvent(rule)
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
                .setMixinCall(() => {
                // 自定义函数的调用
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
                        if (utils_1.isExpression(rule, vars)) {
                            getVars && getVars(rule);
                        }
                    }
                    // results.push(rule);
                }
                else {
                    // 过滤所有字面量的样式
                    utils_1.isExpression(rule, vars) && results.push(rule);
                }
            })
                .setAtRule(() => {
                // 外层
                // 测试时列表中只会有一个，但不确定是否会有多个所以循环
                return rule.rules.some((ruleset) => {
                    // from、to...
                    return ruleset.rules.some((fromTo) => {
                        // 被from、to包裹的每一条样式
                        if (fromTo.rules) {
                            return fromTo.rules.some((decalration) => {
                                if (utils_1.isExpression(decalration, vars)) {
                                    results.push(rule);
                                    return true;
                                }
                            });
                        }
                        else {
                            if (utils_1.isExpression(fromTo, vars)) {
                                results.push(rule);
                                return true;
                            }
                        }
                    });
                });
            })
                .run();
        }
        catch (e) {
            console.log(rule);
            console.log(e);
        }
    });
    return results;
}
function shaking(rules, modifyVars) {
    // 拿到需要更新的变量的命名列表
    const vars = Object.keys(modifyVars);
    // 去除所有不需要的样式
    const allVars = {};
    // 回调函数用于获取所有拥有变量依赖的变量，第一次shaking掉所有不被变量依赖的样式，即字面量样式
    shake(rules, (v) => {
        allVars[v.name] = v;
    });
    // 判断依赖
    const newVars = filter_vars_1.filterVars(Object.values(allVars), vars);
    // 对所有不含依赖变量的样式进行shaking
    rules = shake(rules, undefined, newVars);
    return rules;
}
exports.shaking = shaking;