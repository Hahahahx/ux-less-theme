"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeEvent = void 0;
const utils_1 = require("./utils");
class TypeEvent {
    constructor(rule) {
        this.rule = rule;
    }
    setImport(fn) {
        this.doImport = fn.bind(this, this.rule);
        return this;
    }
    setDeclaration(fn) {
        this.doDeclaration = fn.bind(this, this.rule);
        return this;
    }
    setAtRule(fn) {
        this.doAtRule = fn.bind(this, this.rule);
        return this;
    }
    setRuleset(fn) {
        this.doRuleset = fn.bind(this, this.rule);
        return this;
    }
    setMixinCall(fn) {
        this.doMixinCall = fn.bind(this, this.rule);
        return this;
    }
    run() {
        if (utils_1.isType(this.rule, "Import")) {
            this.doImport();
        }
        else if (utils_1.isType(this.rule, "MixinCall")) {
            this.doMixinCall();
        }
        else if (utils_1.isType(this.rule, "Declaration")) {
            this.doDeclaration();
        }
        else if (utils_1.isType(this.rule, "AtRule")) {
            this.doAtRule();
        }
        else {
            this.doRuleset();
        }
    }
}
exports.TypeEvent = TypeEvent;