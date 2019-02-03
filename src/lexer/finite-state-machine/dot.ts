import { FiniteStateMachine } from './finite-state-machine';

export class Dot<S, T> {
    private static dotHeader: string[] = [
        'digraph finite_state_machine {',
        'rankdir=LR;',
        'size="8,5"'
    ];

    private static dotMiddle: string[] = [
        'node [style = solid];',
        'node [shape = circle];'
    ];

    private static dotFooter: string[] = [
        '}'
    ];

    private stateToString: (state: S) => string;

    private actionToString: (action: T) => string;

    constructor(stateToString: (state: S) => string, actionToString: (action: T) => string) {
        this.stateToString = stateToString;
        this.actionToString = actionToString;
    }

    public toDot(fsm: FiniteStateMachine<S, T>): string {
        const acceptingStatesWithoutInitial = fsm.acceptingStates.filter((state) => state !== fsm.initialState);
        const transitionsStringified = fsm.transitions
            .map<[string, string, string]>(
                (transition) => [
                    this.stateToString(transition[0]),
                    this.actionToString(transition[1]),
                    this.stateToString(transition[2])]
            )
            .map((transition) => `${transition[0]} -> ${transition[2]} [ label = "${transition[1]}" ];`);

        return [
            ...Dot.dotHeader,
            `node [style = filled${fsm.acceptingStates.includes(fsm.initialState) ? ', shape = doublecircle' : ''}] ${this.stateToString(fsm.initialState)};`,
            `node [shape = doublecircle]; ${acceptingStatesWithoutInitial.map(this.stateToString).join(' ')};`,
            ...Dot.dotMiddle,
            ...transitionsStringified,
            ...Dot.dotFooter
        ].join('\n');
    }
}
