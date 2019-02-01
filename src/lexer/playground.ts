import { Accepter } from './accepter';
import { SingleString } from './accepters/single-string';
import { FiniteStateMachine } from './finite-state-machine/finite-state-machine';
import { Minimizer } from './finite-state-machine/minimizer';

class AccepterRunner {
    private initialState: number;

    private acceptingStates: Set<number>;

    private transitionMap: Map<number, [Accepter<string>, number][]>;

    constructor(fsm: FiniteStateMachine<number, Accepter<string>>) {
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

    public run(input: string[]): number | null {
        if (this.acceptingStates.has(this.initialState)) {
            return 0;
        }
        let currentState = this.initialState;
        for (let i = 0; i < input.length; i++) {
            const transition = this.transitionMap.get(currentState)!.find((transition) => transition[0].accept(input[i]));
            if (transition === undefined) {
                return null;
            }
            if (this.acceptingStates.has(transition[1])) {
                return i + 1;
            }
            currentState = transition[1];
        }
        return null;
    }
}

const aAccepter: Accepter<string> = new SingleString('a');
const bAccepter: Accepter<string> = new SingleString('b');
const cAccepter: Accepter<string> = new SingleString('c');

// tslint:disable-next-line:max-classes-per-file
class FiniteStateMachineBuilder<T> {
    private stateCounter: number = 1;
    private acceptingStates: number[] = [0];
    private initialState: number = 0;
    private transitions: [number, T, number][] = [];

    public withTerminal(accepter: T) {
        this.transitions = [
            ...this.transitions,
            ...this.acceptingStates.map<[number, T, number]>((state) => [state, accepter, this.stateCounter])
        ];
        this.acceptingStates = [this.stateCounter++];
        return this;
    }

    public withAlternative(alternative: FiniteStateMachineBuilder<T>) {
        const leftStateMapping: Map<number, number> = new Map();
        for (const transition of this.transitions) {
            leftStateMapping.set(transition[0], transition[0]);
            leftStateMapping.set(transition[2], transition[2]);
        }
        leftStateMapping.set(this.initialState, this.stateCounter + alternative.stateCounter);
        const rightStateMapper: Map<number, number> = new Map();
        for (const transition of alternative.transitions) {
            rightStateMapper.set(transition[0], transition[0] + this.stateCounter);
            rightStateMapper.set(transition[2], transition[2] + this.stateCounter);
        }
        rightStateMapper.set(alternative.initialState, this.stateCounter + alternative.stateCounter);

        this.transitions = [
            ...this.transitions
                .map<[number, T, number]>(
                    (transition) => [leftStateMapping.get(transition[0])!, transition[1], leftStateMapping.get(transition[2])!]
                ),
            ...alternative.transitions
                .map<[number, T, number]>(
                    (transition) => [rightStateMapper.get(transition[0])!, transition[1], rightStateMapper.get(transition[2])!]
                )
        ];
        this.acceptingStates = [
            ...this.acceptingStates
                .map<number>(
                    (state) => leftStateMapping.get(state)!
                ),
            ...alternative.acceptingStates
                .map<number>(
                    (state) => rightStateMapper.get(state)!
                )
        ];
        this.stateCounter += alternative.stateCounter;
        this.initialState = this.stateCounter++;

        return this;
    }

    public build(): FiniteStateMachine<number, T> {
        return {
            acceptingStates: this.acceptingStates,
            initialState: this.initialState,
            transitions: this.transitions
        };
    }
}

const fsm = new FiniteStateMachineBuilder<Accepter<string>>()
    .withTerminal(aAccepter)
    .withAlternative(new FiniteStateMachineBuilder<Accepter<string>>().withTerminal(bAccepter))
    .withTerminal(cAccepter)
    .build();

const runner = new AccepterRunner(fsm);

Builder
    .alternatives([
        Builder.word('const'),
        Builder.word('class'),
        Builder.range('a-z').oneOrMore()
    ])
    .alternative()
    ;

console.log(JSON.stringify(fsm));
console.log(JSON.stringify(Minimizer.minimize(fsm)));

console.log(runner.run([]));
console.log(runner.run(['a']));
console.log(runner.run(['b']));
console.log(runner.run(['a', 'b']));
console.log(runner.run(['c']));
console.log(runner.run(['c', 'a']));
