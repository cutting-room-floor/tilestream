#!/usr/bin/env node
process.title = 'tilestream';

var tilelive = require('tilelive');
require('mbtiles').registerProtocols(tilelive);

require('bones').load(__dirname);
!module.parent && require('bones').start();

