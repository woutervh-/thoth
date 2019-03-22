import { FiniteStateMachine } from './finite-state-machine';

export class Runner<S, T> {
    private initialState: S;
    private acceptingStates: Set<S>;
    private transitionMap: Map<S, Map<T, S>>;
    private currentState: S | undefined;

    constructor(fsm: FiniteStateMachine<S, T>) {
        this.initialState = fsm.initialState;
        this.acceptingStates = new Set(fsm.acceptingStates);
        this.transitionMap = new Map();
        for (const transition of fsm.transitions) {
            if (!this.transitionMap.has(transition[0])) {
                this.transitionMap.set(transition[0], new Map());
            }
            if (this.transitionMap.get(transition[0])!.has(transition[1])) {
                throw new Error('Undeterministic transition.');
            }
            this.transitionMap.get(transition[0])!.set(transition[1], transition[2]);
        }
        this.currentState = this.initialState;
    }

    public reset() {
        this.currentState = this.initialState;
    }

    public accepts(input: T) {
        if (this.currentState === undefined) {
            return false;
        } else {
            return this.transitionMap.get(this.currentState)!.has(input);
        }
    }

    public accept(input: T) {
        if (this.currentState !== undefined) {
            this.currentState = this.transitionMap.get(this.currentState)!.get(input);
        }
    }

    public isAcceptingState() {
        if (this.currentState === undefined) {
            return false;
        } else {
            return this.acceptingStates.has(this.currentState);
        }
    }
}
