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

    private inputToString: (input: T) => string;

    constructor(stateToString: (state: S) => string, inputToString: (input: T) => string) {
        this.stateToString = stateToString;
        this.inputToString = inputToString;
    }

    public toDot(fsm: FiniteStateMachine<S, T>): string {
        const acceptingStatesWithoutInitial = fsm.acceptingStates.filter((state) => state !== fsm.initialState);
        const lines: string[] = [];
        lines.push(...Dot.dotHeader);
        lines.push(`node [style = filled${fsm.acceptingStates.includes(fsm.initialState) ? ', shape = doublecircle' : ', shape = circle'}] ${this.stateToString(fsm.initialState)};`);
        if (acceptingStatesWithoutInitial.length >= 1) {
            lines.push(`node [shape = doublecircle, style = solid]; ${acceptingStatesWithoutInitial.map(this.stateToString).join(' ')};`);
        }
        lines.push(...Dot.dotMiddle);
        for (const transition of fsm.transitions) {
            const sourceString = this.stateToString(transition[0]);
            const inputString = this.inputToString(transition[1]);
            const targetString = this.stateToString(transition[2]);
            lines.push(`${sourceString} -> ${targetString} [ label = "${inputString}" ];`);
        }
        lines.push(...Dot.dotFooter);
        return lines.join('\n');
    }
}
