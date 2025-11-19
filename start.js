#!/usr/bin/env node
import 'dotenv/config';
import { spawn } from 'child_process';

const runMode = process.env.RUN_MODE || 'api';

const command = runMode === 'bot' ? 'npm' : 'npm';
const args = runMode === 'bot' ? ['run', 'bot'] : ['start'];

console.log(`Starting in ${runMode} mode...`);

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code);
});
