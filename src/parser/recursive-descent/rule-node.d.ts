export interface RuleNode {
    nonTerminal: string;
    sequenceIndex: number;
    termIndex: number;
    tokenIndex: number;
    children: RuleNode[] | null;
}
