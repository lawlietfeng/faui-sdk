import { describe, expect, it, vi } from 'vitest';
import { postMessageAction } from '../../src/actions/postMessage';

const executor = {
  context: {
    $root: { user: { id: 'u1' }, count: 3 },
    $current: null,
    $parent: null,
  },
};

describe('postMessageAction', () => {
  it('evaluates payload values and posts to the parent origin', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);

    await postMessageAction({
      action: 'post_message',
      payload: {
        type: 'faui:user_selected',
        data: {
          id: '${$root.user.id}',
          count: '${$root.count}',
          nested: ['item', '${$root.user.id}'],
        },
        targetOrigin: 'https://parent.example.com',
      },
    }, executor);

    expect(postMessage).toHaveBeenCalledWith({
      type: 'faui:user_selected',
      data: { id: 'u1', count: 3, nested: ['item', 'u1'] },
    }, 'https://parent.example.com');
  });

  it.each([
    { payload: { data: {} }, warning: 'post_message action requires payload.type' },
    { payload: { type: 'faui:test' }, warning: 'post_message action requires payload.targetOrigin' },
    { payload: { type: 'faui:test', targetOrigin: '*' }, warning: 'post_message action requires a valid HTTP(S) payload.targetOrigin other than "*"' },
    { payload: { type: 'faui:test', targetOrigin: 'https://parent.example.com/path' }, warning: 'post_message action requires a valid HTTP(S) payload.targetOrigin other than "*"' },
  ])('warns and skips invalid payloads', async ({ payload, warning }) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);

    await postMessageAction({ action: 'post_message', payload }, executor);

    expect(warn).toHaveBeenCalledWith(warning);
    expect(postMessage).not.toHaveBeenCalled();
  });
});
