import { Runner } from '../runner';
import { FiniteStateMachine } from './finite-state-machine';

export class FiniteStateMachineRunner<S, T> implements Runner<T> {
    private initialState: S;

    private acceptingStates: Set<S>;

    private transitionMap: Map<S, Map<T, S>>;

    constructor(fsm: FiniteStateMachine<S, T>) {
        this.initialState = fsm.initialState;
        this.acceptingStates = new Set(fsm.acceptingStates);
        this.transitionMap = new Map();
        for (const transition of fsm.transitions) {
            if (!this.transitionMap.has(transition[0])) {
                this.transitionMap.set(transition[0], new Map());
            }
            this.transitionMap.get(transition[0])!.set(transition[1], transition[2]);
        }
    }

    public run(input: T[]): number | null {
        if (this.acceptingStates.has(this.initialState)) {
            return 0;
        }
        let currentState = this.initialState;
        for (let i = 0; i < input.length; i++) {
            const nextState = this.transitionMap.get(currentState)!.get(input[i]);
            if (nextState === undefined) {
                return null;
            }
            if (this.acceptingStates.has(nextState)) {
                return i + 1;
            }
            currentState = nextState;
        }
        return null;
    }
}
