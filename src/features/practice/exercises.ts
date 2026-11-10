export type Example = { input: string; expected: string; note: string };
export type Exercise = {
  id: string;
  number: string;
  title: string;
  topic: string;
  description: string[];
  instructions: string[];
  starter: string;
  examples: Example[];
};
export const exercises: Exercise[] = [
  {
    id: 'hello',
    number: '01',
    title: 'Olá, mundo',
    topic: 'Primeiros passos',
    description: [
      'Todo programa começa com uma primeira linha. Vamos escrever a sua.',
      'Imprima a palavra hello, em letras minúsculas. Este programa não precisa receber nenhuma entrada.',
    ],
    instructions: [
      'Use print() para escrever na saída.',
      'Não acrescente mensagens antes ou depois da palavra.',
      'Edite o exemplo, execute e observe o que muda.',
    ],
    starter: '# Seu primeiro programa em Python.\nprint("hello")\n',
    examples: [
      {
        input: '',
        expected: 'hello\n',
        note: 'Uma palavra, uma linha. A quebra de linha final é permitida.',
      },
    ],
  },
  {
    id: 'soma',
    number: '02',
    title: 'Soma de dois números',
    topic: 'Entrada e saída',
    description: [
      'Leia dois números inteiros separados por um espaço e imprima a soma.',
      'A entrada chega por input(). Escreva somente o resultado, sem rótulos ou mensagens adicionais.',
    ],
    instructions: [
      'Os números estão na mesma linha, separados por espaço.',
      'Os valores podem ser positivos, negativos ou zero.',
      'Use os exemplos públicos para experimentar outras entradas.',
    ],
    starter:
      'a, b = map(int, input().split())\n\n# Some os valores e imprima o resultado.\nprint(a + b)\n',
    examples: [
      { input: '2 3\n', expected: '5\n', note: '2 + 3 = 5.' },
      { input: '-4 7\n', expected: '3\n', note: 'Uma soma também pode ter números negativos.' },
      { input: '0 0\n', expected: '0\n', note: 'O zero também é um resultado.' },
    ],
  },
  {
    id: 'maior',
    number: '03',
    title: 'Maior de três números',
    topic: 'Comparação',
    description: [
      'Leia três números inteiros na mesma linha e imprima o maior deles.',
      'Experimente números repetidos e negativos. O programa deve funcionar sem depender da ordem da entrada.',
    ],
    instructions: [
      'Os três números são separados por espaços.',
      'Valores repetidos são permitidos.',
      'A saída contém apenas o maior número.',
    ],
    starter:
      'a, b, c = map(int, input().split())\n\n# Encontre o maior valor.\nprint(max(a, b, c))\n',
    examples: [
      { input: '3 8 5\n', expected: '8\n', note: 'O maior valor está no meio.' },
      { input: '-8 -3 -5\n', expected: '-3\n', note: 'Entre números negativos, -3 é o maior.' },
      { input: '4 4 1\n', expected: '4\n', note: 'O maior valor pode aparecer mais de uma vez.' },
    ],
  },
];
