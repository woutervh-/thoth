import { AccepterRunner } from './accepter-runner';
import { DigitAccepter } from './accepters/digit-accepter';
import { Builder } from './finite-state-machine/builder';
import { Converter } from './finite-state-machine/converter';
import { Deterministic } from './finite-state-machine/deterministic';
import { Minimizer } from './finite-state-machine/minimizer';

// class AccepterRunner {
//     private initialState: number;

//     private acceptingStates: Set<number>;

//     private transitionMap: Map<number, [Accepter<string>, number][]>;

//     constructor(fsm: FiniteStateMachine<number, Accepter<string>>) {
//         this.initialState = fsm.initialState;
//         this.acceptingStates = new Set(fsm.acceptingStates);
//         this.transitionMap = new Map();
//         for (const transition of fsm.transitions) {
//             if (!this.transitionMap.has(transition[0])) {
//                 this.transitionMap.set(transition[0], []);
//             }
//             this.transitionMap.get(transition[0])!.push([transition[1], transition[2]]);
//         }
//     }

//     public run(input: string[]): number | null {
//         if (this.acceptingStates.has(this.initialState)) {
//             return 0;
//         }
//         let currentState = this.initialState;
//         for (let i = 0; i < input.length; i++) {
//             const transition = this.transitionMap.get(currentState)!.find((transition) => transition[0].accept(input[i]));
//             if (transition === undefined) {
//                 return null;
//             }
//             if (this.acceptingStates.has(transition[1])) {
//                 return i + 1;
//             }
//             currentState = transition[1];
//         }
//         return null;
//     }
// }

// const aAccepter: Accepter<string> = new SingleString('a');
// const bAccepter: Accepter<string> = new SingleString('b');
// const cAccepter: Accepter<string> = new SingleString('c');

// const runner = new AccepterRunner(fsm);

const digitAccepter = new DigitAccepter();

const fsm = Builder
    .terminal(digitAccepter)
    .many()
    .build();

const accepterMachine = Converter.convertStateToNumbers(Minimizer.minimize(Deterministic.deterministic(fsm)));
const input = '123 a b 456';
const accepterRunner = new AccepterRunner(accepterMachine);
const run = accepterRunner.run([...input]);

console.log(JSON.stringify(accepterMachine));
console.log(input);
console.log(run);
