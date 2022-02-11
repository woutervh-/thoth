import { run } from "./playground-runner";
import { PushDownAutomaton } from "./pushdown-automaton";

const automaton: PushDownAutomaton<number, string, string> = {
    acceptingStates: [1],
    initialState: 0,
    transitions: [
        [0, "a", null, ["A"], 0],
        [0, "a", "A", ["A", "A"], 0],
        [0, "b", "A", [], 1],
        [1, "b", "A", [], 1]
    ]
};

console.log(run(automaton, ["a", "a", "b", "b"]));
