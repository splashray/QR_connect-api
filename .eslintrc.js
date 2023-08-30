// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    // Your custom rules here
    indent: ["error", 2],
    "linebreak-style": "off",
    quotes: ["error", "double"],
    semi: ["error", "always"],
    // Additional rules can be added here
  },
};
