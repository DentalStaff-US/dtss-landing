module.exports = {
	root: true,
	env: { node: true, browser: true, es2022: true },
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:astro/recommended",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: { ecmaVersion: "latest", sourceType: "module" },
	plugins: ["@typescript-eslint"],
	ignorePatterns: [
		"dist/",
		".astro/",
		"node_modules/",
		".emdash/",
		"emdash-env.d.ts",
		"src/styles/tokens/",
	],
	rules: {
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
		],
	},
	overrides: [
		{
			files: ["*.astro"],
			parser: "astro-eslint-parser",
			parserOptions: {
				parser: "@typescript-eslint/parser",
				extraFileExtensions: [".astro"],
			},
		},
		{
			// Hoisted <script> blocks are TypeScript.
			files: ["**/*.astro/*.ts", "*.astro/*.ts"],
			parser: "@typescript-eslint/parser",
			parserOptions: { project: null },
		},
		{
			// Inline <script is:inline> blocks are plain browser JS.
			files: ["**/*.astro/*.js", "*.astro/*.js"],
			rules: { "no-var": "off", "@typescript-eslint/no-unused-vars": "off" },
		},
	],
};
