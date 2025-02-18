import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { Command } from '../command/index.js';
import { CommandManager } from '../command/index.js';

declare global {
  namespace BlockSuite {
    interface CommandData {
      commandData1?: string;
      commandData2?: string;
      commandData3?: string;
    }

    interface Commands {
      command1: Command<
        never,
        never,
        {
          command1Option?: string;
        }
      >;
      command2: Command;
      command3: Command;
      command4: Command;
    }

    type Std = object;
  }
}

describe('CommandManager', () => {
  let std: BlockSuite.Std;
  let commandManager: CommandManager;

  beforeEach(() => {
    std = {};
    commandManager = new CommandManager(std);
  });

  test('can add and execute a command', () => {
    const command1: Command = vi.fn((ctx, next) => next());
    const command2: Command = vi.fn((ctx, next) => {});
    commandManager.add('command1', command1);
    commandManager.add('command2', command2);

    const success1 = commandManager.pipe().command1().run();
    const success2 = commandManager.pipe().command2().run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(success1).toBeTruthy();
    expect(success2).toBeFalsy();
  });

  test('can chain multiple commands', () => {
    const command1: Command = vi.fn((ctx, next) => next());
    const command2: Command = vi.fn((ctx, next) => next());
    const command3: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);

    const success = commandManager
      .pipe()
      .command1()
      .command2()
      .command3()
      .run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(command3).toHaveBeenCalled();
    expect(success).toBeTruthy();
  });

  test('skip commands if there is a command failed before them (`next` not executed)', () => {
    const command1: Command = vi.fn((ctx, next) => next());
    const command2: Command = vi.fn((ctx, next) => {});
    const command3: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);

    const success = commandManager
      .pipe()
      .command1()
      .command2()
      .command3()
      .run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(command3).not.toHaveBeenCalled();
    expect(success).toBeFalsy();
  });

  test('can handle command failure', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const command1: Command = vi.fn((ctx, next) => next());
    const command2: Command = vi.fn((ctx, next) => {
      throw new Error('command2 failed');
    });
    const command3: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);

    const success = commandManager
      .pipe()
      .command1()
      .command2()
      .command3()
      .run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(command3).not.toHaveBeenCalled();
    expect(success).toBeFalsy();
    expect(errorSpy).toHaveBeenCalledWith(new Error('command2 failed'));
  });

  test('can pass data to command when calling a command', () => {
    const command1: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);

    const success = commandManager
      .pipe()
      .command1({ command1Option: 'test' })
      .run();

    expect(command1).toHaveBeenCalledWith(
      expect.objectContaining({ command1Option: 'test' }),
      expect.any(Function)
    );
    expect(success).toBeTruthy();
  });

  test('can add data to the command chain with `with` method', () => {
    const command1: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);

    const success = commandManager
      .pipe()
      .with({ commandData1: 'test' })
      .command1()
      .run();

    expect(command1).toHaveBeenCalledWith(
      expect.objectContaining({ commandData1: 'test' }),
      expect.any(Function)
    );
    expect(success).toBeTruthy();
  });

  test('passes and updates context across commands', () => {
    const command1: Command = vi.fn((ctx, next) =>
      next({ commandData1: '123' })
    );
    const command2: Command<'commandData1'> = vi.fn((ctx, next) => {
      expect(ctx.commandData1).toBe('123');
      next();
    });

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);

    const success = commandManager.pipe().command1().command2().run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(success).toBeTruthy();
  });

  test('can execute an inline command', () => {
    const inlineCommand: Command = vi.fn((ctx, next) => next());

    const success = commandManager.pipe().inline(inlineCommand).run();

    expect(inlineCommand).toHaveBeenCalled();
    expect(success).toBeTruthy();
  });

  test('should not continue with the rest of the chain if all commands in `try` fail', () => {
    const command1: Command = vi.fn((ctx, next) => {});
    const command2: Command = vi.fn((ctx, next) => {});
    const command3: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);

    const success = commandManager
      .pipe()
      .try(cmd => [cmd.command1(), cmd.command2()])
      .command3()
      .run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(command3).not.toHaveBeenCalled();
    expect(success).toBeFalsy();
  });

  test('should not re-execute previous commands in the chain before `try`', () => {
    const command1: Command = vi.fn((ctx, next) => next());
    const command2: Command = vi.fn((ctx, next) => {});
    const command3: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);

    const success = commandManager
      .pipe()
      .command1()
      .try(cmd => [cmd.command2(), cmd.command3()])
      .run();

    expect(command1).toHaveBeenCalledTimes(1);
    expect(command2).toHaveBeenCalled();
    expect(command3).toHaveBeenCalled();
    expect(success).toBeTruthy();
  });

  test('should continue with the rest of the chain if one command in `try` succeeds', () => {
    const command1: Command = vi.fn((ctx, next) => {});
    const command2: Command = vi.fn((ctx, next) => next());
    const command3: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);

    const success = commandManager
      .pipe()
      .try(cmd => [cmd.command1(), cmd.command2()])
      .command3()
      .run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(command3).toHaveBeenCalled();
    expect(success).toBeTruthy();
  });

  test('should not execute any further commands in `try` after one succeeds', () => {
    const command1: Command = vi.fn((ctx, next) => next());
    const command2: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);

    commandManager
      .pipe()
      .try(cmd => [cmd.command1(), cmd.command2()])
      .run();

    expect(command1).toHaveBeenCalled();
    expect(command2).not.toHaveBeenCalled();
  });

  test('should pass context correctly in `try` when a command succeeds', () => {
    const command1: Command = vi.fn((ctx, next) =>
      next({ commandData1: 'fromCommand1', commandData2: 'fromCommand1' })
    );
    const command2: Command<'commandData1' | 'commandData2'> = vi.fn(
      (ctx, next) => {
        expect(ctx.commandData1).toBe('fromCommand1');
        expect(ctx.commandData2).toBe('fromCommand1');
        // override commandData2
        next({ commandData2: 'fromCommand2' });
      }
    );
    const command3: Command<'commandData1' | 'commandData2'> = vi.fn(
      (ctx, next) => {
        expect(ctx.commandData1).toBe('fromCommand1');
        expect(ctx.commandData2).toBe('fromCommand2');
        next();
      }
    );

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);

    const success = commandManager
      .pipe()
      .command1()
      .try(cmd => [cmd.command2()])
      .command3()
      .run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(command3).toHaveBeenCalled();
    expect(success).toBeTruthy();
  });

  test('should continue with the rest of the chain if at least one command in `tryAll` succeeds', () => {
    const command1: Command = vi.fn((ctx, next) => {});
    const command2: Command = vi.fn((ctx, next) => next());
    const command3: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);

    const success = commandManager
      .pipe()
      .tryAll(cmd => [cmd.command1(), cmd.command2()])
      .command3()
      .run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(command3).toHaveBeenCalled();
    expect(success).toBeTruthy();
  });

  test('should execute all commands in `tryAll` even if one has already succeeded', () => {
    const command1: Command = vi.fn((ctx, next) => next());
    const command2: Command = vi.fn((ctx, next) => next());
    const command3: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);

    const success = commandManager
      .pipe()
      .tryAll(cmd => [cmd.command1(), cmd.command2(), cmd.command3()])
      .run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(command3).toHaveBeenCalled();
    expect(success).toBeTruthy();
  });

  test('should not continue with the rest of the chain if all commands in `tryAll` fail', () => {
    const command1: Command = vi.fn((ctx, next) => {});
    const command2: Command = vi.fn((ctx, next) => {});
    const command3: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);

    const success = commandManager
      .pipe()
      .tryAll(cmd => [cmd.command1(), cmd.command2()])
      .command3()
      .run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(command3).not.toHaveBeenCalled();
    expect(success).toBeFalsy();
  });

  test('should pass context correctly in `tryAll` when at least one command succeeds', () => {
    const command1: Command = vi.fn((ctx, next) =>
      next({ commandData1: 'fromCommand1' })
    );
    const command2: Command<'commandData1'> = vi.fn((ctx, next) => {
      expect(ctx.commandData1).toBe('fromCommand1');
      // override commandData1
      next({ commandData1: 'fromCommand2', commandData2: 'fromCommand2' });
    });
    const command3: Command<'commandData1' | 'commandData2'> = vi.fn(
      (ctx, next) => {
        expect(ctx.commandData1).toBe('fromCommand2');
        expect(ctx.commandData2).toBe('fromCommand2');
        next({
          // override commandData2
          commandData2: 'fromCommand3',
          commandData3: 'fromCommand3',
        });
      }
    );
    const command4: Command<'commandData1' | 'commandData2' | 'commandData3'> =
      vi.fn((ctx, next) => {
        expect(ctx.commandData1).toBe('fromCommand2');
        expect(ctx.commandData2).toBe('fromCommand3');
        expect(ctx.commandData3).toBe('fromCommand3');
        next();
      });

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);
    commandManager.add('command4', command4);

    const success = commandManager
      .pipe()
      .command1()
      .tryAll(cmd => [cmd.command2(), cmd.command3()])
      .command4()
      .run();

    expect(command1).toHaveBeenCalled();
    expect(command2).toHaveBeenCalled();
    expect(command3).toHaveBeenCalled();
    expect(command4).toHaveBeenCalled();
    expect(success).toBeTruthy();
  });

  test('should not re-execute commands before `tryAll` after executing `tryAll`', () => {
    const command1: Command = vi.fn((ctx, next) => next());
    const command2: Command = vi.fn((ctx, next) => next());
    const command3: Command = vi.fn((ctx, next) => {});
    const command4: Command = vi.fn((ctx, next) => next());

    commandManager.add('command1', command1);
    commandManager.add('command2', command2);
    commandManager.add('command3', command3);
    commandManager.add('command4', command4);

    const success = commandManager
      .pipe()
      .command1()
      .tryAll(cmd => [cmd.command2(), cmd.command3()])
      .command4()
      .run();

    expect(command1).toHaveBeenCalledTimes(1);
    expect(command2).toHaveBeenCalled();
    expect(command3).toHaveBeenCalled();
    expect(command4).toHaveBeenCalled();
    expect(success).toBeTruthy();
  });
});
