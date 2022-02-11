import { Builder } from "../finite-state-machine/builder";
import { FiniteStateMachineAccepter } from "./accepters/finite-state-machine-accepter";
import { Lexer } from "./lexer";
import { TokenResult } from "./token";

const letterI = Builder.terminal("i");
const letterF = Builder.terminal("f");
const letterS = Builder.terminal("s");
const semicolon = Builder.terminal(";");
const ifBuilder = Builder.sequence([letterI, letterF]);
const identifierBuilder = Builder.alternatives([letterI, letterF, letterS]).oneOrMore();

const ifToken = new FiniteStateMachineAccepter("IF", ifBuilder.build());
const semicolonToken = new FiniteStateMachineAccepter("SEMICOLON", semicolon.build());
const identifierToken = new FiniteStateMachineAccepter("IDENTIFIER", identifierBuilder.build());
const lexer = new Lexer([ifToken, identifierToken, semicolonToken]);

lexer.write("i");
lexer.write(";");
lexer.write("i");
lexer.write("f");
lexer.write(";");
lexer.write("i");
lexer.write("f");
lexer.write("i");
lexer.write(":");
lexer.write("i");
lexer.write("f");
lexer.write(";");
lexer.write("i");
lexer.write("\n");
lexer.end();

lexer.on("data", (token: TokenResult<string>) => {
    console.log(JSON.stringify(token));
});

lexer.on("end", () => console.log("end"));
