#!/usr/bin/env node
var plugin = module.exports = require('bones').plugin(__dirname);

plugin.load();
!module.parent && plugin.start();

