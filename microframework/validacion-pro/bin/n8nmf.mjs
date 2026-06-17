#!/usr/bin/env node
import { runCli } from '../src/cli/index.mjs';
await runCli(process.argv.slice(2));
