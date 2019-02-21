import { Builder } from './builder';
import { PushDownAutomaton } from './pushdown-automaton';

const automaton: PushDownAutomaton<number, string, string> = {
    acceptingStates: [1],
    initialState: 0,
    transitions: [
        [0, 'a', null, ['A'], 0],
        [0, 'a', 'A', ['A', 'A'], 0],
        [0, 'b', 'A', [], 1],
        [1, 'b', 'A', [], 1]
    ]
};

function run<S, T, U>(automaton: PushDownAutomaton<S, T, U>, input: T[]): boolean {
    const stack: U[] = [];
    let currentState = automaton.initialState;
    for (const action of input) {
        const top = stack.length >= 1
            ? stack.pop()!
            : null;
        const transitions = automaton.transitions.filter((transition) =>
            transition[0] === currentState
            && transition[1] === action
            && transition[2] === top
        );
        if (transitions.length >= 2) {
            throw new Error('Encountered underterministic choice.');
        }
        if (transitions.length !== 1) {
            return false;
        }
        const transition = transitions[0];
        stack.push(...transition[3]);
        currentState = transition[4];
    }
    return stack.length === 0 && automaton.acceptingStates.includes(currentState);
}

console.log(run(automaton, ['a', 'a', 'b', 'b']));

const pda = Builder
    .succession(
        Builder.terminal('a'),
        Builder.terminal('b')
    )
    .build();

// Builder.named(
//     'foo',
//     Builder.succession(
//         Builder.terminal('a'),
//         Builder.named('foo'),
//         Builder.terminal('b')
//     )
// )

console.log(JSON.stringify(pda));
console.log(run(pda, ['a']));
console.log(run(pda, ['a', 'b']));
console.log(run(pda, ['a', 'b', 'c']));
