function isType(rule: any, type: string) {
    return Object.getPrototypeOf(rule).type === type;
}

function needCompare(delcaration: any, vars: string[]) {
    const a = isType(delcaration, "Variable");
    return vars ? a && vars.includes(delcaration.name) : a;
}

/**
 *
 * @param item Declaration对象
 * @param vars 用来比对的变量，也就是需要被更新的变量，它可能存在依赖关系
 * return 的含义是 是否需要添加到结果集中（即该对象一定包含变量）
 */
function haveVariable(item: any, vars: string[]) {
    // 判断是否需要跟传入的变量进行比对，以便过滤与传入的变量没有依赖关系的对象，Variable.name存放着变量名

    if (needCompare(item, vars)) {
        return true;
    } else if (isType(item, "JavaScript")) {
        // 脚本 太复杂了不做shake直接通过让其编译
        return true;
    } else if (isType(item, "Operation")) {
        // 计算表达式
        return item.operands.some((oper: any) => needCompare(oper, vars));
    } else if (isType(item, "Call")) {
        // less函数
        return item.args.some((arg: any) => needCompare(arg, vars));
    }
    return false;
}

/**
 *
 * @param item Declaration对象
 * @param vars 用来比对的变量，也就是需要被更新的变量，它可能存在依赖关系
 * return 的含义是 是否需要添加到结果集中（即该对象一定包含变量）
 */
function isExpression(decalration: any, vars: string[]): boolean {
    /**
     * 这里有很多个value，其中从Declaration开始，拥有一个属性value，
     * 该属性是一个Less的Value对象，Value对象中也有一个value属性，
     * 它是一个list，存放Expression对象，Expression对象中也有一个value属性
     * 也是一个list，其中可能存放着Variable对象，也就是我们的变量。
     */
    const value = decalration.value.value;
    if (Array.isArray(value)) {
        // 有可能是直接的结果，也有可能是Expression对象，对象就会被装在list里
        // 测试时列表中只会有一个，但不确定是否会有多个所以循环
        return value.some((expression) => {
            if (expression.value) {
                // 如果找到变量了那么直接跳出循环
                // 举个栗子，它可能是这样的 width: 10+1+1+1+1+1+@num+3+3+3
                // 找到变量多余的+3+3就可以不管他了，所以是在值里面去寻找变量
                return expression.value.some((val: any) =>
                    haveVariable(val, vars)
                );
            }
        });
    }
    return false;
}

export { isType, isExpression };
