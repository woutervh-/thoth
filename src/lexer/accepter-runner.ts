import { Accepter } from './accepters/accepter';
import { FiniteStateMachine } from './finite-state-machine/finite-state-machine';

interface Accepted<T> {
    accepter: Accepter<T>;
    start: number;
    count: number;
}

export class AccepterRunner<S, T> {
    private initialState: S;

    private acceptingStates: S[];

    private transitionMap: Map<S, [Accepter<T>, S][]>;

    constructor(fsm: FiniteStateMachine<S, Accepter<T>>) {
        this.initialState = fsm.initialState;
        this.acceptingStates = fsm.acceptingStates;
        this.transitionMap = new Map();
        for (const transition of fsm.transitions) {
            if (!this.transitionMap.has(transition[0])) {
                this.transitionMap.set(transition[0], []);
            }
            this.transitionMap.get(transition[0])!.push([transition[1], transition[2]]);
        }
    }

    public run(input: T[]): Accepted<T>[] {
        let currentState = this.initialState;
        let i = 0;
        const accepted: Accepted<T>[] = [];
        while (i < input.length) {
            const transitions = this.transitionMap.get(currentState)!.filter((transition) => transition[0].accept(input[i]));
            if (transitions.length !== 1) {
                return [];
            }
            const transition = transitions[0];
            let acceptedLength = 1;
            if (transition[0].isGreedy) {
                while (transition[0].accept(input[i + acceptedLength])) {
                    acceptedLength += 1;
                }
            }
            accepted.push({ accepter: transition[0], start: i, count: acceptedLength });
            i += acceptedLength;
            currentState = transition[1];
        }
        if (this.acceptingStates.includes(currentState)) {
            return accepted;
        } else {
            return [];
        }
    }
}
