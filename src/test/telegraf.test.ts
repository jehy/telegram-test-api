import { assert } from 'chai';
import { getServerAndBot } from './utils';

describe('Telegram bot test', () => {
  const token = 'some token';

  it('should return help content', async () => {
    const { server, bot } = await getServerAndBot(token);
    const client = server.getClient(token, { timeout: 5000 });
    const command = client.makeCommand('/start');
    const res = await client.sendCommand(command);
    assert.equal(res.ok, true);
    const updates = await client.getUpdates();
    await bot.stop();
    await server.stop();
    assert.equal(updates.ok, true);
    assert.equal(
      updates.result.length,
      1,
      'updates queue should contain one message!'
    );
  });

  it('should respond pong to callback_query', async () => {
    const { server, bot } = await getServerAndBot(token);
    const client = server.getClient(token, { timeout: 5000 });
    const cb = client.makeCallbackQuery('ping');
    const res = await client.sendCallback(cb);
    assert.equal(res.ok, true);
    const updates = await client.getUpdates();
    await bot.stop();
    await server.stop();
    assert.equal(updates.ok, true);
    assert.equal(
      updates.result.length,
      1,
      'updates queue should contain one message!'
    );
    assert.equal(
      updates.result[0].message.text,
      'pong',
      'message should be pong!'
    );
  });
});
