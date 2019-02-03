import { Accepter } from './accepters/accepter';
import { FiniteStateMachine } from './finite-state-machine/finite-state-machine';

interface Accepted<T> {
    accepter: Accepter<T>;
    start: number;
    count: number;
}

export class AccepterRunner<S, T> {
    private initialState: S;
    private acceptingStates: Set<S>;
    private transitionMap: Map<S, [Accepter<T>, S][]>;

    constructor(fsm: FiniteStateMachine<S, Accepter<T>>) {
        this.initialState = fsm.initialState;
        this.acceptingStates = new Set(fsm.acceptingStates);
        this.transitionMap = new Map();
        for (const transition of fsm.transitions) {
            if (!this.transitionMap.has(transition[0])) {
                this.transitionMap.set(transition[0], []);
            }
            this.transitionMap.get(transition[0])!.push([transition[1], transition[2]]);
        }
    }

    public run(input: T[]): number | null {
        if (this.acceptingStates.has(this.initialState)) {
            return 0;
        }
        let currentState = this.initialState;
        for (let i = 0; i < input.length; i++) {
            const transitions = this.transitionMap.get(currentState)!.filter((transition) => transition[0].accept(input[i]));
            if (transitions.length !== 1) {
                return null;
            }
            const transition = transitions[0];
            currentState = transition[1];
            if (this.acceptingStates.has(currentState)) {
                return i + 1;
            }
        }
        return null;
    }
}
