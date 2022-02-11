import { Builder } from "./builder";
import { run } from "./playground-runner";

const pda = Builder
    .named(
        "S",
        Builder.succession(
            Builder.terminal("a"),
            Builder.succession(
                Builder.reference("S"),
                Builder.terminal("b")
            )
        )
    )
    .build();

console.log(JSON.stringify(pda));
console.log(run(pda, ["a"]));
console.log(run(pda, ["a", "b"]));
console.log(run(pda, ["a", "b", "c"]));
