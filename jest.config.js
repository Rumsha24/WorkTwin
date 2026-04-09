module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  testPathIgnorePatterns: ["<rootDir>/__tests__/setup.js"]
};
