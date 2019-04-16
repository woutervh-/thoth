interface PrefixOperator {
    type: 'prefix';
    token: string;
    precedence: number;
}

interface InfixOperator {
    type: 'infix';
    token: string;
    precedence: number;
    associativity: 'left' | 'right';
}

interface PostfixOperator {
    type: 'postfix';
    token: string;
    precedence: number;
}

interface StatementOperator {
    type: 'statement';
    token: string;
    precedence: number;
}

interface BracketOperator {
    type: 'bracket';
    openToken: string;
    closeToken: string;
}

interface NullaryOperator {
    type: 'nullary';
    token: string;
}

type Operator = PrefixOperator | InfixOperator | PostfixOperator | StatementOperator | BracketOperator | NullaryOperator;

// A -> a B
const prefixOperators: PrefixOperator[] = [
    { type: 'prefix', token: '+', precedence: 70 },
    { type: 'prefix', token: '-', precedence: 70 }
];

// A -> B (a B)*
const infixOperators: InfixOperator[] = [
    { type: 'infix', token: '+', precedence: 10, associativity: 'left' },
    { type: 'infix', token: '-', precedence: 10, associativity: 'left' },
    { type: 'infix', token: '*', precedence: 20, associativity: 'left' },
    { type: 'infix', token: '/', precedence: 20, associativity: 'left' },
    { type: 'infix', token: '^', precedence: 30, associativity: 'right' }
];

// A -> B a
const postfixOperators: PostfixOperator[] = [
    { type: 'postfix', token: '++', precedence: 80 }
];

// A -> (B a)*
const statementOperators: StatementOperator[] = [
    { type: 'statement', token: ';', precedence: 5 }
];

// A -> a B a
const bracketOperators: BracketOperator[] = [
    { type: 'bracket', openToken: '(', closeToken: ')' }
];

// A -> a
const nullaries: NullaryOperator[] = [
    { type: 'nullary', token: '0' },
    { type: 'nullary', token: '1' },
    { type: 'nullary', token: '2' },
    { type: 'nullary', token: '3' },
    { type: 'nullary', token: '4' },
    { type: 'nullary', token: '5' },
    { type: 'nullary', token: '6' },
    { type: 'nullary', token: '7' },
    { type: 'nullary', token: '8' },
    { type: 'nullary', token: '9' }
];

interface NullaryNode {
    type: 'nullary';
    operator: NullaryOperator;
}

interface UnaryNode {
    type: 'unary';
    operator: PrefixOperator | PostfixOperator | StatementOperator | BracketOperator;
    child: Node;
}

interface VariadicNode {
    type: 'variadic';
    operators: (InfixOperator | PostfixOperator | StatementOperator)[];
    values: Node[];
}

interface BinaryNode {
    type: 'binary';
    operator: InfixOperator | StatementOperator;
    left: Node;
    right: Node;
}

type Node = NullaryNode | UnaryNode | BinaryNode;

function getPrecendence(token: string) {
    if (bracketOperators.some((operator) => operator.closeToken === token)) {
        return 0;
    }
    const operator = infixOperators.find((operator) => operator.token === token) || postfixOperators.find((operator) => operator.token === token) || statementOperators.find((operator) => operator.token === token);
    if (operator === undefined) {
        throw new Error(`Unexpected token ${token}.`);
    }
    return operator.precedence;
}

let index = -1;
const input = '(-5)+2;3*1;'.split('');
// const input = ['5', '++', '(', '6'];
// const input = '2^3^2'.split('');
// const input = '-(2+3)*5'.split('');
// const input = '+2++3*-(-4)'.split('');

class TokenStream {
    private queue: string[] = [];
    private consumerQueue: { type: 'peek' | 'pop', consume: (token: string) => void }[] = [];

    public push(token: string) {
        this.queue.push(token);
        this.flush();
    }

    public peek(): Promise<string> {
        this.consumerQueue.push();
    }

    public async pop(): string | undefined {

    }

    private flush() {

    }
}

function parse(precedence: number): Node {
    let token = input[++index];
    const operator: NullaryOperator | PrefixOperator | BracketOperator | undefined =
        prefixOperators.find((operator) => operator.token === token)
        || nullaries.find((nullary) => nullary.token === token)
        || bracketOperators.find((operator) => operator.openToken === token);
    if (operator === undefined) {
        throw new Error();
    }
    let node: Node;
    if (operator.type === 'prefix') {
        node = { type: 'unary', operator, child: parse(operator.precedence) };
    } else if (operator.type === 'nullary') {
        node = { type: 'nullary', operator };
    } else {
        node = { type: 'unary', operator, child: parse(0) };
        if (input[++index] !== operator.closeToken) {
            throw new Error();
        }
    }
    while (index < input.length - 1 && precedence < getPrecendence(input[index + 1])) {
        token = input[++index];
        const operator =
            infixOperators.find((operator) => operator.token === token)
            || postfixOperators.find((operator) => operator.token === token)
            || statementOperators.find((operator) => operator.token === token);
        if (operator === undefined) {
            throw new Error();
        }
        if (operator.type === 'infix' || operator.type === 'statement') {
            if (index < input.length - 1) {
                const associativity = operator.type === 'infix' && operator.associativity === 'left' ? 0 : -1;
                node = { type: 'binary', operator, left: node, right: parse(operator.precedence + associativity) };
            } else if (operator.type === 'statement') {
                node = { type: 'unary', operator, child: node };
            } else {
                throw new Error();
            }
        } else if (operator.type === 'postfix') {
            node = { type: 'unary', operator, child: node };
        }
    }
    return node;
}

function toDotNode(node: Node, lines: string[], context: { counter: number }): number {
    if (node.type === 'nullary') {
        lines.push(`N${context.counter} [label="${node.operator.token}"]`);
    } else if (node.type === 'unary') {
        const child = toDotNode(node.child, lines, context);
        if (node.operator.type === 'prefix') {
            const prefix = context.counter++;
            lines.push(`N${prefix} [label="${node.operator.token}"]`);
            lines.push(`N${context.counter} -> N${prefix}`);
            lines.push(`N${context.counter} -> N${child}`);
        } else if (node.operator.type === 'postfix' || node.operator.type === 'statement') {
            const postfix = context.counter++;
            lines.push(`N${postfix} [label="${node.operator.token}"]`);
            lines.push(`N${context.counter} -> N${child}`);
            lines.push(`N${context.counter} -> N${postfix}`);
        } else {
            const open = context.counter++;
            const close = context.counter++;
            lines.push(`N${open} [label="${node.operator.openToken}"]`);
            lines.push(`N${close} [label="${node.operator.closeToken}"]`);
            lines.push(`N${context.counter} -> N${open}`);
            lines.push(`N${context.counter} -> N${child}`);
            lines.push(`N${context.counter} -> N${close}`);
        }
        lines.push(`N${context.counter} [label=""]`);
    } else {
        const left = toDotNode(node.left, lines, context);
        const right = toDotNode(node.right, lines, context);
        const operator = context.counter++;
        lines.push(`N${context.counter} [label=""]`);
        lines.push(`N${operator} [label="${node.operator.token}"]`);
        lines.push(`N${context.counter} -> N${left}`);
        lines.push(`N${context.counter} -> N${operator}`);
        lines.push(`N${context.counter} -> N${right}`);
    }
    return context.counter++;
}

function toDot(node: Node) {
    const lines: string[] = [];
    lines.push('digraph G {');
    lines.push('graph [ordering="out"];');
    toDotNode(node, lines, { counter: 0 });
    lines.push('}');
    return lines.join('\n');
}

// // tslint:disable-next-line:max-classes-per-file
// class Expression {
//     private static getValue(node: Node): number {
//         if (node.type === 'binary') {
//             if (node.operator.token === '*') {
//                 return Expression.getValue(node.left) * Expression.getValue(node.right);
//             } else if (node.operator.token === '+') {
//                 return Expression.getValue(node.left) + Expression.getValue(node.right);
//             } else {
//                 throw new Error();
//             }
//         } else if (node.type === 'nullary') {
//             return parseInt(node.operator.token, 10);
//         } else {
//             throw new Error();
//         }
//     }

//     public readonly value: number;

//     constructor(node: Node) {
//         this.value = Expression.getValue(node);
//     }
// }

// // tslint:disable-next-line:max-classes-per-file
// class Module {
//     private static getStatements(node: Node): Expression[] {
//         const statements: Expression[] = [];
//         if (node.operator.type === 'postfix' && node.operator.token === ';') {
//             if (node.type === 'unary') {
//                 statements.push(...Module.getStatements(node.child));
//             } else if (node.type === 'binary') {
//                 statements.push(...Module.getStatements(node.left));
//                 statements.push(...Module.getStatements(node.right));
//             }
//         } else {
//             statements.push(new Expression(node));
//         }
//         return statements;
//     }

//     public readonly statements: Expression[] = [];

//     constructor(node: Node) {
//         this.statements = Module.getStatements(node);
//     }
// }

// console.log(parse(0));

// console.log(JSON.stringify(parse(0), null, 2));
console.log(toDot(parse(0)));
