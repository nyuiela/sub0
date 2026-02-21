import noTailwindVarInClass from "./no-tailwind-var-in-class.js";

const localRules = {
  meta: {
    name: "eslint-plugin-local-rules",
    version: "1.0.0",
  },
  rules: {
    "no-tailwind-var-in-class": noTailwindVarInClass,
  },
};

export default localRules;
