import { Builder } from './finite-state-machine/builder';

export class TokenBuilder {
    public static word(word: string) {
        const terms: Builder<string>[] = [];
        for (let i = 0; i < word.length; i++) {
            terms[i] = Builder.terminal(word[i]);
        }
        return new TokenBuilder(Builder.sequence(terms));
    }

    private builder: Builder<string>;

    private constructor(builder: Builder<string>) {
        this.builder = builder;
    }

    public build() {
        return this.builder.build();
    }
}
