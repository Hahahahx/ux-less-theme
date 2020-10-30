"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shaking = void 0;
const filter_vars_1 = require("./filter-vars");
const type_event_1 = require("./type-event");
const utils_1 = require("./utils");
function shake(ruleset, getVars, vars) {
    function doRecursion(rule, callback) {
        if (rule.rules && rule.rules.length) {
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
                results.push(rule);
            })
                .setDeclaration(() => {
                if (rule.variable) {
                    results.push(rule);
                    if (Array.isArray(rule.value.value)) {
                        if (utils_1.isExpression(rule, vars)) {
                            getVars && getVars(rule);
                        }
                    }
                }
                else {
                    utils_1.isExpression(rule, vars) && results.push(rule);
                }
            })
                .setAtRule(() => {
                return rule.rules.some((ruleset) => {
                    return ruleset.rules.some((fromTo) => {
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
    const vars = Object.keys(modifyVars);
    const allVars = {};
    shake(rules, (v) => {
        allVars[v.name] = v;
    });
    const newVars = filter_vars_1.filterVars(Object.values(allVars), vars);
    rules = shake(rules, undefined, newVars);
    return rules;
}
exports.shaking = shaking;