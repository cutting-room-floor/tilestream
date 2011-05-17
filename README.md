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
  - At least 613MB memory
  - May work: Older versions, other POSIX-compliant systems
  - The [prerequisites for node][2] (python, libssl-dev)

[2]:https://github.com/ry/node/wiki/Installation


Installation: Mac OS X 10.6
---------------------------
Install [Xcode][3] for Mac OS X.

Download and unpack TileStream. Build & install:

    git clone -b master-ndistro git://github.com/mapbox/tilestream.git
    cd tilestream
    ./ndistro

Start TileStream:

    bin/node bin/tilestream

TileStream should now be accessible from a browser at `http://localhost:8888`.

[3]:http://developer.apple.com/technologies/tools/xcode.html


Installation: Ubuntu 10.10
--------------------------
Install build requirements:

    sudo apt-get install curl build-essential libssl-dev libsqlite3-0 libsqlite3-dev

Download and unpack TileStream. Build & install:

    git clone -b master-ndistro git://github.com/mapbox/tilestream.git
    cd tilestream
    ./ndistro

If you already cloned the master repository then do:

    cd tilestream
    git checkout master-ndistro
    ./ndistro

Start TileStream:

    bin/node bin/tilestream

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

Commandline options:

    Usage: tilestream [COMMAND] [OPTION]
    Commands:
      start
        start server
        --config=PATH      Pass options via JSON config file at PATH.
        --uiPort=PORT      UI server port. Defaults to 8888.
        --tilePort=PORT    Tile server port. Defaults to 8888.
        --subdomains=LIST  Comma separated list of subdomains to use for tiles.
        --tiles=PATH       Path to tiles directory.
        --syslog           Log to syslog instead of stdout.


Tests
-----
You can run the TileStream tests using expresso:

    PATH=bin expresso modules/tilestream/test/tilestream.test.js


Contributors
------------
- [Young Hahn](https://github.com/yhahn)
- [Tom MacWright](https://github.com/tmcw)
- [Will White](https://github.com/willwhite)
- [Konstantin Käfer](https://github.com/kkaefer)
- [Dane Springmeyer](https://github.com/springmeyer)
