"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExpression = exports.isType = void 0;
function isType(rule, type) {
    return Object.getPrototypeOf(rule).type === type;
}
exports.isType = isType;
function needCompare(delcaration, vars) {
    const a = isType(delcaration, "Variable");
    return vars ? a && vars.includes(delcaration.name) : a;
}

function haveVariable(item, vars) {
    
    if (needCompare(item, vars)) {
        return true;
    }
    else if (isType(item, "JavaScript")) {
        
        
        if (vars) {
            const match = item.expression.match(/\@{(.*)}/);
            if (match) {
                return vars.some((item) => item.includes(match[1]));
            }
            return false;
        }
        return true;
    }
    else if (isType(item, "Operation")) {
        
        return item.operands.some((oper) => needCompare(oper, vars));
    }
    else if (isType(item, "Call")) {
        
        return item.args.some((arg) => needCompare(arg, vars));
    }
    return false;
}

function isExpression(decalration, vars) {
    
    const value = decalration.value.value;
    if (Array.isArray(value)) {
        
        
        return value.some((expression) => {
            
            if (needCompare(expression, vars)) {
                return true;
            }
            if (expression.value) {
                
                
                
                return expression.value.some((val) => haveVariable(val, vars));
            }
        });
    }
    return false;
}
exports.isExpression = isExpression;
