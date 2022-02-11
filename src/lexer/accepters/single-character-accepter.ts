import { Accepter } from "./accepter";

export class SingleCharacterAccepter implements Accepter<string> {
    public name: string;
    private character: string;
    private currentState: "pending" | "accepted";

    constructor(character: string, name?: string) {
        this.character = character;
        this.name = name === undefined ? character : name;
        this.currentState = "pending";
    }

    public consumeNextInput(input: string) {
        if (this.currentState === "accepted") {
            throw new Error("Invalid state.");
        }
        if (this.character !== input) {
            throw new Error("Invalid input.");
        }
        this.currentState = "accepted";
    }

    public isValidNextInput(input: string): boolean {
        return this.currentState === "pending" && this.character === input;
    }

    public isAccepting(): boolean {
        return this.currentState === "accepted";
    }

    public reset(): void {
        this.currentState = "pending";
    }
}
