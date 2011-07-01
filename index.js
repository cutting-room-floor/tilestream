#!/usr/bin/env node
process.title = 'tilestream';

var tilelive = require('tilelive');
tilelive.protocols['mbtiles:'] = require('mbtiles');

require('bones').load(__dirname);
!module.parent && require('bones').start();

