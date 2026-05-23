#!/usr/bin/env node
const taskId = process.env.TOKENWISE_TASK_ID ?? 'unknown-task';
const variant = process.env.TOKENWISE_VARIANT ?? 'control';

const profiles = {
  control: { input_tokens: 90000, output_tokens: 9000, tool_calls: 24, file_reads: 14, grep_calls: 7, codegraph_calls: 0, skill_words_loaded: 0 },
  superpowers: { input_tokens: 130000, output_tokens: 12000, tool_calls: 28, file_reads: 11, grep_calls: 5, codegraph_calls: 0, skill_words_loaded: 16622 },
  codegraph: { input_tokens: 76000, output_tokens: 8000, tool_calls: 10, file_reads: 3, grep_calls: 1, codegraph_calls: 5, skill_words_loaded: 0 },
  tokenwise: { input_tokens: 70000, output_tokens: 7000, tool_calls: 12, file_reads: 5, grep_calls: 3, codegraph_calls: 0, skill_words_loaded: 1663 },
  'tokenwise-codegraph': { input_tokens: 52000, output_tokens: 6000, tool_calls: 8, file_reads: 2, grep_calls: 1, codegraph_calls: 4, skill_words_loaded: 1663 }
};

const profile = profiles[variant] ?? profiles.control;
const result = {
  task_id: taskId,
  variant,
  success: true,
  ...profile,
  total_tokens: profile.input_tokens + profile.output_tokens,
  cost_usd: Number(((profile.input_tokens + profile.output_tokens) / 1_000_000 * 3).toFixed(4)),
  notes: 'Synthetic smoke result; not evidence for public token-savings claims.'
};

console.log(`Mock agent reading ${process.env.TOKENWISE_PROMPT_FILE}`);
console.log(`TOKENWISE_RESULT ${JSON.stringify(result)}`);

