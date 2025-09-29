export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  moduleNameMapper: {
    '^@aenea/(.*)$': '<rootDir>/src/aenea/$1',
    '^@integration/(.*)$': '<rootDir>/src/integration/$1',
    '^@model/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@yui/(.*)$': '<rootDir>/yui-protocol/src/$1'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/yui-protocol/tests/'
  ]
};