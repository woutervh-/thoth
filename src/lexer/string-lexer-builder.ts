import { Builder } from "../finite-state-machine/builder";
import { Accepter } from "./accepters/accepter";
import { FiniteStateMachineAccepter } from "./accepters/finite-state-machine-accepter";
import { FiniteStateMachineFragmentAccepter } from "./accepters/finite-state-machine-fragment-accepter";
import { UnicodeRangeFragment } from "./accepters/fragments/unicode-range-fragment";
import { SingleCharacterAccepter } from "./accepters/single-character-accepter";
import { Lexer } from "./lexer";
import { TokenResult } from "./token";

export class StringLexerBuilder {
    private tokens: Accepter<string>[] = [];

    public createTextToken(name: string, text: string) {
        if (text.length === 1) {
            this.tokens.push(new SingleCharacterAccepter(text, name));
        } else {
            this.tokens.push(new FiniteStateMachineAccepter(name, Builder.sequence(text.split("").map((character) => Builder.terminal(character))).build()));
        }
        return this;
    }

    public createRangeToken(name: string, infimum: string | number, supremum: string | number) {
        this.tokens.push(new FiniteStateMachineFragmentAccepter(name, Builder.terminal(new UnicodeRangeFragment(infimum, supremum)).build()));
        return this;
    }

    public build() {
        return new Lexer(this.tokens);
    }
}

const lexer = new StringLexerBuilder()
    .createTextToken("<plus>", "+")
    .createTextToken("<minus>", "-")
    .createTextToken("<if>", "if")
    .createRangeToken("<non-ascii>", 0x00c0, 0xffff)
    .build();

lexer.on("data", (token: TokenResult<string>) => {
    if (token.type === "matched") {
        console.log(token.accepter.name, token.inputs.join(""));
    } else {
        console.log(JSON.stringify(token));
    }
});
lexer.on("end", () => console.log("end"));

const text = "ππ+3.14-1";
for (const character of text) {
    lexer.write(character);
}
lexer.end();
