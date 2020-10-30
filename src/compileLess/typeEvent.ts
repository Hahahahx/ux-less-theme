import { isType } from "./utils";

export type TypeFn = (rule: any) => void;

// 事件驱动
export class TypeEvent {
    rule: any;
    doImport: Function;
    doDeclaration: Function;
    doAtRule: Function;
    doRuleset: Function;
    doMixinCall: Function;

    constructor(rule: any) {
        this.rule = rule;
    }

    setImport(fn: TypeFn) {
        this.doImport = fn.bind(this, this.rule);
        return this;
    }

    setDeclaration(fn: TypeFn) {
        this.doDeclaration = fn.bind(this, this.rule);
        return this;
    }

    setAtRule(fn: TypeFn) {
        this.doAtRule = fn.bind(this, this.rule);
        return this;
    }

    setRuleset(fn: TypeFn) {
        this.doRuleset = fn.bind(this, this.rule);
        return this;
    }

    setMixinCall(fn: TypeFn) {
        this.doMixinCall = fn.bind(this, this.rule);
        return this;
    }

    run() {
        if (isType(this.rule, "Import")) {
            this.doImport();
        } else if (isType(this.rule, "MixinCall")) {
            this.doMixinCall();
        } else if (isType(this.rule, "Declaration")) {
            this.doDeclaration();
        } else if (isType(this.rule, "AtRule")) {
            this.doAtRule();
        } else {
            this.doRuleset();
        }
    }
}
