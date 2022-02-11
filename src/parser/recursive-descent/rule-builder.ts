import { Step } from "./step";

export class RuleBuilder<T> {
    private rules: Map<string, Step<T>> = new Map();

    public rule(name: string, step: Step<T>) {
        this.rules.set(name, step);
        return this;
    }

    public build() {
        return this.rules;
    }
}
