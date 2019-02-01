import { Accepter } from './accepters/accepter';
import { FiniteStateMachine } from './finite-state-machine/finite-state-machine';

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
        let i = 0;
        while (i < input.length) {
            const transition = this.transitionMap.get(currentState)!.find((transition) => transition[0].accept(input[i]));
            if (transition === undefined) {
                return null;
            }
            let acceptedLength = 1;
            if (transition[0].isGreedy) {
                while (transition[0].accept(input[i + acceptedLength])) {
                    acceptedLength += 1;
                }
            }
            i += acceptedLength;
            if (this.acceptingStates.has(transition[1])) {
                return i;
            }
            currentState = transition[1];
        }
        return null;
    }
}
