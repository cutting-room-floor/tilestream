Upgrading from TileStream pre-ndistro
-------------------------------------

TileStream switched from ndistro to [npm](http://npmjs.org/) in order to manage
its dependencies better. This means that there's an upgrade process between
earlier versions of TileStream and the new version, that includes a
`package.json` file and can be found in the npm repository as well as in git.

Upgrading is a simple process:

1. Install TileStream in a separate location from the previous installation.
2. Move the `/tiles` directory and settings JSON file from your old TileStream
installation to this new installation.
