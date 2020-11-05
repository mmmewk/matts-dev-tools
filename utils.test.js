const {
  prompt,
  execCommand,
} = require('./utils');
const stdin = require('mock-stdin').stdin();
const logSymbols = require('log-symbols');
const { describe, expect, test } = require('@jest/globals');
const ora = require('ora');

process.env.NODE_ENV = 'test';
jest.mock('ora');
const mockStopAndPersist = jest.fn();
const mockStart = jest.fn().mockImplementation(() => {
  return {
    stopAndPersist: mockStopAndPersist,
  };
});
ora.mockImplementation(() => {
  return {
    start: mockStart,
  };
});

beforeEach(() => {
  ora.mockClear();
  mockStart.mockClear();
  mockStopAndPersist.mockClear();
});

describe('prompt', () => {
  test('Should return true on user input of y', async () => {
    setTimeout(() => {
      stdin.send('y');
    }, 10);

    const confirmation = await prompt('should this succeed?');
    expect(confirmation).toBeTruthy();
  });

  test('Should return true on user input of Y', async () => {
    setTimeout(() => {
      stdin.send('Y');
    }, 10);

    const confirmation = await prompt('should this succeed?');
    expect(confirmation).toBeTruthy();
  });

  test('Should return false on user input of n', async () => {
    setTimeout(() => {
      stdin.send('n');
    }, 10);

    const confirmation = await prompt('should this succeed?');
    expect(confirmation).toBeFalsy();
  });

  test('Should return false on user input of N', async () => {
    setTimeout(() => {
      stdin.send('N');
    }, 10);

    const confirmation = await prompt('should this succeed?');
    expect(confirmation).toBeFalsy();
  });
});

describe('execCommand', () => {
  test('should correctly execute a command in a directory', async () => {
    expect(await execCommand('ls', { cwd: '../' })).toEqual(0);
  });

  test('should correctly execute a command in the current directory', async () => {
    expect(await execCommand('ls')).toEqual(0);
  });

  test('fails on missing directory', async () => {
    expect(await execCommand('ls', { cwd: 'adsf' })).toEqual(1);
  });

  test('boots up and modifies a spinner on success', async () => {
    await execCommand('ls');
    expect(ora).toHaveBeenCalledTimes(1)
    expect(mockStart).toHaveBeenCalledTimes(1)
    expect(mockStopAndPersist).toHaveBeenCalledWith({ symbol: logSymbols.success, color: 'green' })
  });

  test('boots up and modifies a spinner on error', async () => {
    await execCommand('asdf');
    expect(ora).toHaveBeenCalledTimes(1)
    expect(mockStart).toHaveBeenCalledTimes(1)
    expect(mockStopAndPersist).toHaveBeenCalledWith({ symbol: logSymbols.error, color: 'red' })
  });
});