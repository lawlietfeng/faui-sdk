import { evaluateExpression, type ExpressionContext } from "../src";

const context: ExpressionContext = {
  $root: {
    name: "张三",
    count: 3,
    loading: false,
    items: [
      { name: "A", amount: 10 },
      { name: "B", amount: 20 }
    ]
  },
  $current: { name: "A", amount: 10 }
};

const legalExpressions = [
  "${$root.name}",
  "Hello ${$root.name}",
  "${count + 1}",
  "${loading ? \"加载中\" : \"就绪\"}",
  "${sum($root.items.map((item) => Number(item.amount || 0)))}",
  "${$current.name}"
];

const blockedExpressions = [
  "${$root.constructor.constructor(\"return globalThis\")()}",
  "${$root.__proto__}",
  "${typeof window}",
  "${typeof document}",
  "${typeof globalThis}",
  "${typeof process}",
  "${typeof eval}",
  "${typeof Function}"
];

for (const expression of legalExpressions) {
  console.log(expression, "=>", evaluateExpression(expression, context));
}

for (const expression of blockedExpressions) {
  console.log(expression, "=>", evaluateExpression(expression, context));
}
