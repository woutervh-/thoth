import { Grammar } from "./grammar";

const grammar: Grammar<string> = {
    A: [
        { sequence: [{ type: "non-terminal", name: "C" }, { type: "terminal", terminal: "d" }] }
    ],
    B: [
        { sequence: [{ type: "non-terminal", name: "C" }, { type: "terminal", terminal: "e" }] }
    ],
    C: [
        { sequence: [{ type: "non-terminal", name: "A" }] },
        { sequence: [{ type: "non-terminal", name: "B" }] },
        { sequence: [{ type: "terminal", terminal: "f" }] }
    ],
    S: [
        { sequence: [{ type: "non-terminal", name: "S" }, { type: "terminal", terminal: "q" }] }
    ]
};
