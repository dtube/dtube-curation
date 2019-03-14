# DTube Curation Bot

This bot is used on the official DTube Discord Server ([join now](https://discord.gg/dtube)) to curate videos posted on [d.tube](https://d.tube)


### Requirements

To run this bot you need nodeJS and a MySQL database.

### Installation

    git clone https://github.com/dtube/dtube-curation.git
    cd dtube-curation
    npm install
    
To generate the charts you need to install some packages:

OS | Command
----- | -----
OS X | Using [Homebrew](https://brew.sh/):<br/>`brew install pkg-config cairo pango libpng jpeg giflib librsvg`
Ubuntu | `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`
Fedora | `sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel`
Solaris | `pkgin install cairo pango pkg-config xproto renderproto kbproto xextproto`
OpenBSD | `doas pkg_add cairo pango png jpeg giflib`

    
### Database Setup

Create a new database and import the `dump.sql` file.

### Confguration

Open ``config.js`` and paste in your discord bot token, the curation channel and guild id and the database credentials.
If you want to use the ``!faq`` command update the faq object to your needs. If you dont want to use this command just
set ``mod_settings.enabled`` to `false`.

At last change the default steem credentials used by this bot to cast upvotes.

### Startup

To start the bot just run
    
    node index.js
    
Or use `forever` for automatic restarts whenever the bot throws an unexpected error, for example when the steem node does not reply.

    npm install forever -g
    forever start index.js
    
    
### Licence

This project is licenced unter the MIT Licence.        