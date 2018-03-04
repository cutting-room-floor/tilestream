#!/usr/bin/env node
var os = require('os');

// increase the libuv threadpool size to 1.5x the number of logical CPUs.
process.env.UV_THREADPOOL_SIZE = Math.ceil(Math.max(4, os.cpus().length * 1.5));

process.title = 'tilestream';

var tilelive = require('tilelive');
require('mbtiles').registerProtocols(tilelive);

require('bones').load(__dirname);
!module.parent && require('bones').start();

module.exports = { tilelive: tilelive };
