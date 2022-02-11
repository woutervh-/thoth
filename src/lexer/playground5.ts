import { Builder } from "../finite-state-machine/builder";
import { FiniteStateMachineFragmentAccepter } from "./accepters/finite-state-machine-fragment-accepter";
import { Fragment } from "./accepters/fragments/fragment";
import { SingleCharacterFragment } from "./accepters/fragments/single-character-fragment";
import { UnicodeRangeFragment } from "./accepters/fragments/unicode-range-fragment";
import { SingleCharacterAccepter } from "./accepters/single-character-accepter";
import { Lexer } from "./lexer";
import { TokenResult } from "./token";

const leftSquareBracket = new SingleCharacterAccepter("[");
const rightSquareBracket = new SingleCharacterAccepter("]");
const leftCurlyBracket = new SingleCharacterAccepter("{");
const rightCurlyBracket = new SingleCharacterAccepter("}");
const leftParenthesis = new SingleCharacterAccepter("(");
const rightParenthesis = new SingleCharacterAccepter(")");
const plus = new SingleCharacterAccepter("+");
const asterisk = new SingleCharacterAccepter("*");
const minus = new SingleCharacterAccepter("-");
const verticalLine = new SingleCharacterAccepter("|");
const dot = new SingleCharacterAccepter(".");
const comma = new SingleCharacterAccepter(",");
const questionMark = new SingleCharacterAccepter("?");
const exclamationMark = new SingleCharacterAccepter("!");
const circumflex = new SingleCharacterAccepter("^");
const dollar = new SingleCharacterAccepter("$");
const equals = new SingleCharacterAccepter("=");

const upperCaseLatin = new UnicodeRangeFragment("A", "Z");
const lowerCaseLatin = new UnicodeRangeFragment("a", "z");
const digits = new UnicodeRangeFragment("0", "9");
const nonAscii = new UnicodeRangeFragment(0x00c0, 0xffff);

const name = new FiniteStateMachineFragmentAccepter(
    "name",
    Builder
        .sequence([
            Builder
                .alternatives([
                    Builder.terminal(upperCaseLatin),
                    Builder.terminal(lowerCaseLatin),
                    Builder.terminal(nonAscii)
                ]),
            Builder
                .alternatives([
                    Builder.terminal(upperCaseLatin),
                    Builder.terminal(lowerCaseLatin),
                    Builder.terminal(digits),
                    Builder.terminal(nonAscii)
                ])
                .zeroOrMore()
        ])
        .build()
);

const numberAccepter = new FiniteStateMachineFragmentAccepter(
    "number",
    Builder
        .sequence<Fragment<string>>([
            Builder.alternatives([Builder.terminal(new SingleCharacterFragment("-")), Builder.terminal(new SingleCharacterFragment("+"))]).optional(),
            Builder.terminal(digits).zeroOrMore(),
            Builder.terminal(new SingleCharacterFragment(".")).optional(),
            Builder.terminal(digits).oneOrMore(),
            Builder
                .sequence<Fragment<string>>([
                    Builder.alternatives([Builder.terminal(new SingleCharacterFragment("e")), Builder.terminal(new SingleCharacterFragment("E"))]),
                    Builder.alternatives([Builder.terminal(new SingleCharacterFragment("-")), Builder.terminal(new SingleCharacterFragment("+"))]).optional(),
                    Builder.terminal(digits).oneOrMore()
                ])
                .optional()
        ])
        .build()
);

const lexer = new Lexer([
    leftSquareBracket,
    rightSquareBracket,
    leftCurlyBracket,
    rightCurlyBracket,
    leftParenthesis,
    rightParenthesis,
    plus,
    asterisk,
    minus,
    verticalLine,
    dot,
    comma,
    questionMark,
    exclamationMark,
    circumflex,
    dollar,
    equals,
    name,
    numberAccepter
]);

lexer.on("data", (token: TokenResult<string>) => {
    if (token.type === "matched") {
        console.log(token.accepter.name, token.inputs.join(""));
    } else {
        console.log(JSON.stringify(token));
    }
});
lexer.on("end", () => console.log("end"));

const text = "π = 3.14";
for (const character of text) {
    lexer.write(character);
}
lexer.end();
