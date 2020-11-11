/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  reporters: ["default", "jest-junit"],
  testPathIgnorePatterns: ["example/"],
  coverageReporters: ["cobertura", "text"],
};
