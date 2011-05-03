TileStream
----------
A high performance tile server and simple web viewer for [MBTiles][1] files.

[1]:[http://mbtiles.org]


Features
--------
- MBTiles-based tile server
- Minimal gallery view and OpenLayers based viewer of tiles
- Support for MBTiles interaction using [Wax](http://github.com/mapbox/wax)


Requirements
------------
- *TileStream client*
  - Tested: Chrome 6+, Firefox 3+, IE8+
  - May work: Opera 11
- *TileStream server*
  - Tested: Mac OS X 10.6, Ubuntu 10.10
  - Tested: [node](http://nodejs.org/) 0.4.7
  - Tested: [npm](http://npmjs.org/) v1.0.3
  - At least 613MB memory
  - May work: Older versions, other POSIX-compliant systems

[2]:https://github.com/ry/node/wiki/Installation


Installation: Mac OS X 10.6
---------------------------
Install [Xcode][3] for Mac OS X.

Download and unpack TileStream. Build & install:

    git clone git://github.com/mapbox/tilestream.git
    cd tilestream
    npm install .

Start TileStream:

    ./index.js

TileStream should now be accessible from a browser at `http://localhost:8888`.

[3]:http://developer.apple.com/technologies/tools/xcode.html


Installation: Ubuntu 10.10
--------------------------
Install build requirements:

    sudo apt-get install build-essential libssl-dev libsqlite3-0 libsqlite3-dev

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
TileStream tests use [Expresso](http://visionmedia.github.com/expresso).

    npm install -g expresso
    cd tilestream
    expresso


Contributors
------------
- [Young Hahn](https://github.com/yhahn)
- [Tom MacWright](https://github.com/tmcw)
- [Will White](https://github.com/willwhite)
- [Konstantin Käfer](https://github.com/kkaefer)
- [Dane Springmeyer](https://github.com/springmeyer)
