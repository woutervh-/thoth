import { FiniteStateMachine } from "../../finite-state-machine/finite-state-machine";
import { Accepter } from "./accepter";
import { Fragment } from "./fragments/fragment";

export class FiniteStateMachineFragmentAccepter<S, T> implements Accepter<T> {
    public name: string;
    private initialState: S;
    private acceptingStates: Set<S>;
    private transitionMap: Map<S, [Fragment<T>, S][]>;
    private currentState: S | undefined;

    constructor(name: string, fsm: FiniteStateMachine<S, Fragment<T>>) {
        this.name = name;
        this.initialState = fsm.initialState;
        this.acceptingStates = new Set(fsm.acceptingStates);
        this.transitionMap = new Map();
        for (const transition of fsm.transitions) {
            if (!this.transitionMap.has(transition[0])) {
                this.transitionMap.set(transition[0], []);
            }
            this.transitionMap.get(transition[0])!.push([transition[1], transition[2]]);
        }
        this.currentState = this.initialState;
    }

    public consumeNextInput(input: T) {
        if (this.currentState === undefined) {
            throw new Error("Invalid state.");
        }
        const transitionMap = this.transitionMap.get(this.currentState);
        if (transitionMap === undefined) {
            throw new Error("Invalid input.");
        }
        const transition = transitionMap.find((transition) => transition[0].accepts(input));
        if (transition === undefined) {
            throw new Error("Invalid input.");
        }
        this.currentState = transition[1];
    }

    public isValidNextInput(input: T): boolean {
        if (this.currentState === undefined) {
            return false;
        } else {
            const transitionMap = this.transitionMap.get(this.currentState);
            if (transitionMap === undefined) {
                return false;
            } else {
                return transitionMap.some((transition) => transition[0].accepts(input));
            }
        }
    }

    public isAccepting(): boolean {
        if (this.currentState === undefined) {
            return false;
        } else {
            return this.acceptingStates.has(this.currentState);
        }
    }

    public reset(): void {
        this.currentState = this.initialState;
    }
}
