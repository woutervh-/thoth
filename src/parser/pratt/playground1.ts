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

interface BracketOperator {
    type: 'bracket';
    openToken: string;
    closeToken: string;
}

interface NullaryOperator {
    type: 'nullary';
    token: string;
}

type Operator = PrefixOperator | InfixOperator | PostfixOperator | BracketOperator | NullaryOperator;

const prefixOperators: PrefixOperator[] = [
    { type: 'prefix', token: '+', precedence: 70 },
    { type: 'prefix', token: '-', precedence: 70 }
];

const infixOperators: InfixOperator[] = [
    { type: 'infix', token: ';', precedence: 5, associativity: 'left' },
    { type: 'infix', token: '+', precedence: 10, associativity: 'left' },
    { type: 'infix', token: '-', precedence: 10, associativity: 'left' },
    { type: 'infix', token: '*', precedence: 20, associativity: 'left' },
    { type: 'infix', token: '/', precedence: 20, associativity: 'left' },
    { type: 'infix', token: '^', precedence: 30, associativity: 'right' }
];

const postfixOperators: PostfixOperator[] = [
    { type: 'postfix', token: ';', precedence: 5 },
    { type: 'postfix', token: '++', precedence: 80 }
];

const bracketOperators: BracketOperator[] = [
    { type: 'bracket', openToken: '(', closeToken: ')' }
];

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
    operator: PrefixOperator | PostfixOperator | BracketOperator;
    child: Node;
}

interface BinaryNode {
    type: 'binary';
    operator: InfixOperator;
    leftChild: Node;
    rightChild: Node;
}

type Node = NullaryNode | UnaryNode | BinaryNode;

function getPrecendence(token: string) {
    if (bracketOperators.some((operator) => operator.closeToken === token)) {
        return 0;
    }
    const operator = infixOperators.find((operator) => operator.token === token) || postfixOperators.find((operator) => operator.token === token);
    if (operator === undefined) {
        throw new Error(`Unexpected token ${token}.`);
    }
    return operator.precedence;
}

let index = -1;
const input = '5+2;3*1;'.split('');
// const input = ['5', '++', '(', '6'];
// const input = '2^3^2'.split('');
// const input = '-(2+3)*5'.split('');
// const input = '+2++3*-(-4)'.split('');

function parse(precedence: number): Node {
    let token = input[++index];
    const operator: NullaryOperator | PrefixOperator | BracketOperator | undefined =
        prefixOperators.find((operator) => operator.token === token)
        || nullaries.find((nullary) => nullary.token === token)
        || bracketOperators.find((operator) => operator.openToken === token);
    if (operator === undefined) {
        throw new Error();
    }
    let left: Node;
    if (operator.type === 'prefix') {
        left = { type: 'unary', operator, child: parse(operator.precedence) };
    } else if (operator.type === 'nullary') {
        left = { type: 'nullary', operator };
    } else {
        left = { type: 'unary', operator, child: parse(0) };
        if (input[++index] !== operator.closeToken) {
            throw new Error();
        }
    }
    while (index < input.length - 1 && precedence < getPrecendence(input[index + 1])) {
        token = input[++index];
        const operator =
            (index < input.length - 1 ? infixOperators.find((operator) => operator.token === token) : undefined)
            || postfixOperators.find((operator) => operator.token === token);
        if (operator === undefined) {
            throw new Error();
        }
        if (operator.type === 'infix') {
            const associativity = operator.associativity === 'left' ? 0 : -1;
            left = { type: 'binary', operator, leftChild: left, rightChild: parse(operator.precedence + associativity) };
        } else {
            left = { type: 'unary', operator, child: left };
        }
    }
    return left;
}

console.log(JSON.stringify(parse(0), null, 2));
