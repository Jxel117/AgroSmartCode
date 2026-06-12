export default {

  testEnvironment: "node",

  collectCoverage: true,

  collectCoverageFrom:[
    "src/modules/**/*.js"
  ],

  coverageDirectory:
    "tests/reports/coverage",

  coverageReporters:[
    "text",
    "html"
  ],
  moduleNameMapper: {
  "^@auth/(.*)$": "<rootDir>/src/modules/auth/$1",
  "^@usuarios/(.*)$": "<rootDir>/src/usuarios/$1",
  "^@utils/(.*)$": "<rootDir>/src/utils/$1",
},
exportdefault: {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
},
};