#!/usr/bin/env node
process.title = 'tilestream';
require('bones').load(__dirname);
!module.parent && require('bones').start();

