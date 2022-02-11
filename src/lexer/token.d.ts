import { Accepter } from "./accepters/accepter";

interface Matchedtoken<T> {
    type: "matched";
    accepter: Accepter<T>;
    position: number;
    inputs: T[];
}

interface ErrorToken<T> {
    type: "error";
    position: number;
    input: T | undefined;
}

export type TokenResult<T> = Matchedtoken<T> | ErrorToken<T>;
