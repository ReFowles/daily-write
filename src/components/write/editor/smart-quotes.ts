import { Extension, InputRule, type RawCommands } from '@tiptap/core';

export interface SmartQuotesStorage {
  enabled: boolean;
}

declare module '@tiptap/core' {
  interface Storage {
    smartQuotes: SmartQuotesStorage;
  }

  interface Commands<ReturnType> {
    smartQuotes: {
      /**
       * Toggle whether typed straight quotes are replaced with curly quotes.
       */
      setSmartQuotesEnabled: (enabled: boolean) => ReturnType;
    };
  }
}

const OPEN_DOUBLE = '\u201C';
const CLOSE_DOUBLE = '\u201D';
const OPEN_SINGLE = '\u2018';
const CLOSE_SINGLE = '\u2019';

// A quote is "opening" when it follows the start of a line, whitespace, an
// opening bracket, or another opening/curly quote; otherwise it's "closing".
// Mirrors the smart-quote rules in prosemirror-inputrules.
const OPEN_DOUBLE_RE = /(?:^|[\s\{\[\(<'"\u2018\u201C])(")$/;
const CLOSE_DOUBLE_RE = /"$/;
const OPEN_SINGLE_RE = /(?:^|[\s\{\[\(<'"\u2018\u201C])(')$/;
const CLOSE_SINGLE_RE = /'$/;

// Enabled state lives in per-editor storage so callers can toggle it via
// `editor.commands.setSmartQuotesEnabled(...)` without re-initializing.
export const SmartQuotes = Extension.create<Record<string, never>, SmartQuotesStorage>({
  name: 'smartQuotes',

  addStorage() {
    return { enabled: true };
  },

  addCommands() {
    return {
      setSmartQuotesEnabled:
        (enabled: boolean) =>
        ({ dispatch }: { dispatch: (() => void) | undefined }) => {
          if (dispatch) this.storage.enabled = enabled;
          return true;
        },
    } as Partial<RawCommands>;
  },

  addInputRules() {
    const rule = (find: RegExp, replacement: string) =>
      new InputRule({
        find,
        handler: ({ state, range, match }) => {
          if (!this.storage.enabled) return null;

          const captured = match[1];
          // Rules without a capture group replace the whole match (a single
          // straight quote). Rules with one preserve the preceding character
          // and only swap the captured quote for the curly variant.
          let insert = replacement;
          if (captured !== undefined) {
            const offset = match[0].lastIndexOf(captured);
            insert =
              match[0].slice(0, offset) +
              replacement +
              match[0].slice(offset + captured.length);
          }
          state.tr.insertText(insert, range.from, range.to);
        },
      });

    return [
      rule(OPEN_DOUBLE_RE, OPEN_DOUBLE),
      rule(CLOSE_DOUBLE_RE, CLOSE_DOUBLE),
      rule(OPEN_SINGLE_RE, OPEN_SINGLE),
      rule(CLOSE_SINGLE_RE, CLOSE_SINGLE),
    ];
  },
});
