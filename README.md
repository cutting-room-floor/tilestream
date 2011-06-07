TileStream
----------
A high performance tile server and simple web viewer for [MBTiles][1] files.


Features
--------
- MBTiles-based tile server
- Minimal gallery view and map viewer for tiles
- Support for MBTiles interaction using [Wax][2]


Requirements
------------
- *TileStream client*
  - Tested: Chrome 6+, Firefox 3+, IE8+
  - May work: Opera 11
- *TileStream server*
  - Tested: Mac OS X 10.6, Ubuntu 10.10
  - Tested: node 0.4.7
  - Tested: npm v1.0.3
  - At least 613MB memory
  - May work: Older versions, other POSIX-compliant systems


Installation: Mac OS X 10.6
---------------------------
Install [Xcode][3] for Mac OS X.

Install [node and npm][4]. You may want to use [nvm][5] which can install and
manage your node installation for you.

Download and unpack TileStream. Build & install:

    git clone git://github.com/mapbox/tilestream.git
    cd tilestream
    npm install .

Start TileStream:

    ./index.js

TileStream should now be accessible from a browser at `http://localhost:8888`.


Installation: Ubuntu 10.10
--------------------------
Install build requirements:

    sudo apt-get install build-essential libssl-dev libsqlite3-0 libsqlite3-dev

Install [node and npm][4]. You may want to use [nvm][5] which can install and
manage your node installation for you.

Download and unpack TileStream. Build & install:

    git clone git://github.com/mapbox/tilestream.git
    cd tilestream
    npm install .

Start TileStream:

    ./index.js

TileStream should now be accessible from a browser at `http://localhost:8888`.


Syslog setup
------------

If you want tilestream to sent messages to syslog instead of stdout, use the
`--syslog` option or specify `"syslog": true` in the settings JSON file.

Tilestream uses the standard syslog format, and expects a syslog daemon
(rsyslogd is known to work) to run on localhost:514, that has to accept TCP
connections. To filter tilestream's messages to a particular log file, add

    if $programname == 'tilestream' then /var/log/tilestream.log
    & ~

to your `/etc/rsyslog.conf` file and restart the daemon.


Usage
-----
MBTiles files should be placed in the `tiles` directory. Each
tileset can be previewed at `http://localhost:8888/map/[filename]` where
`[filename]` is the name of the tileset file without the `.mbtiles` extension.

Tileset filenames:

- May contain letters (lower or upper case), numbers, underscores or dashes.

        world-light.mbtiles
        control_room.mbtiles
        PartyLikeIts1999.mbtiles

- May not contain periods, spaces, non ASCII characters or other punctuation.

        World Light.mbtiles
        BlueWorld-1.0.mbtiles

To see the options available for use with TileStream, run

    ./index.js start --help


Tests
-----
TileStream tests use [Expresso][6].

    npm install -g expresso
    cd tilestream
    npm test


Contributors
------------
- [Young Hahn][7]
- [Tom MacWright][8]
- [Will White][9]
- [Konstantin Käfer][10]
- [Dane Springmeyer][11]


[1]:http://mbtiles.org
[2]:https://github.com/mapbox/wax
[3]:http://developer.apple.com/technologies/tools/xcode.html
[4]:https://github.com/joyent/node/wiki/Installation
[5]:https://github.com/creationix/nvm
[6]:http://visionmedia.github.com/expresso
[7]:https://github.com/yhahn
[8]:https://github.com/tmcw
[9]:https://github.com/willwhite
[10]:https://github.com/kkaefer
[11]:https://github.com/springmeyer
