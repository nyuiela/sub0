/**
 * Disallow global Tailwind variable syntax in className (e.g. text-(--color-text)).
 * Use semantic utilities instead: text-foreground, text-muted, bg-surface, etc.
 * Page-scoped variables (e.g. --reg-*) are allowed.
 */

const GLOBAL_VAR_PATTERN = /\(--(?:color-[a-z0-9-]+|duration-[a-z0-9-]+|z-[a-z0-9-]+)\)/;

function getClassNameString(node) {
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (node.type === "TemplateLiteral") {
    return node.quasis.map((q) => q.value?.raw ?? "").join("");
  }
  return "";
}

export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow Tailwind (--variable) format in className; use semantic utilities (e.g. text-foreground) instead.",
    },
    schema: [],
    messages: {
      useSemantic:
        "Use semantic Tailwind utilities (e.g. text-foreground, text-muted, bg-surface) instead of (--variable) in className.",
    },
  },
  create(context) {
    return {
      JSXAttribute(attr) {
        const key = attr.name?.name ?? attr.name?.raw;
        if (key !== "className" && key !== "class") return;
        const valueNode =
          attr.value?.type === "JSXExpressionContainer"
            ? attr.value.expression
            : attr.value;
        if (!valueNode) return;
        const str = getClassNameString(valueNode);
        if (!str || !GLOBAL_VAR_PATTERN.test(str)) return;
        context.report({
          node: valueNode,
          messageId: "useSemantic",
        });
      },
    };
  },
};
