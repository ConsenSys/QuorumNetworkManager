# Contents

1. Introduction & Additional functionality
2. Getting started
3. Start node from config
4. Running from cli prompt
5. Firewall rules
6. Constellation


# Introduction & Additional functionality

The introduction has been moved to https://github.com/ConsenSys/QuorumNetworkManager/wiki

# Getting started

There are two options to getting started, option 1: running a script or option 2 manually following the below steps (starting at Requirements). In summary, both will create the following directory structure:

```
workspace
  quorum
  constellation
  QuorumNetworkManager
  ...
```

## Option 1: Running the script

The latest release can be found at: https://github.com/ConsenSys/QuorumNetworkManager/releases. Please follow its install instructions.

## OR | Option 2: Installing Manually		

### Requirements

1. go 1.7.3/4/5 (this has to do with go-ethereum 1.7.* not working with go 1.8+) - https://golang.org/dl/
2. Ubuntu 16.04 (this has to do with installing Constellation)
3. NodeJS v8.x.x (tested on v8.x.x) (refer to https://nodejs.org/en/download/package-manager/ for installation)

### Installation
Take a look at https://raw.githubusercontent.com/ConsenSys/QuorumNetworkManager/v0.7.4-beta/setup.sh to see what is installed.

# Firewall rules

```
Name: raft-http
Port: TCP 40000

Name: geth-communicationNode
Port: TCP 50000

Name: geth-node
Port: TCP 20000

Name: DEVp2p
Port: TCP 30303

constellation-network
Port: TCP 9000

```

As ethereum networks rely on an accurate server time, please ensure outbound ports allow for the server time to stay in sync.

# Running from config

By setting options in the `config.js` file, users can now start a node with `node setupFromConfig.js`.  To start a raft coordinating node, simply run `node setupFromConfig.js`

## Running with pm2

Install pm2: `npm install -g pm2`

Start the script with `pm2 start setupFromConfig.js`. To list all pm2: `pm2 l`, to stop all: `pm2 stop all`. To completely unload all pm2 processes: `pm2 kill`.

## Start a 2 node Istanbul network

There are environment variables that can also be set.    

`IP=<coordinating node ip address> KEEP_FILES=false NODE_NAME=node1 CONSENSUS=istanbul pm2 start setupFromConfig.js`    

To connect a 2nd node to the network:    

`IP=<ip address of 2nd node> COORDINATING_IP=<coordinating node ip address> ROLE=dynamicPeer KEEP_FILES=false NODE_NAME=node2 CONSENSUS=istanbul pm2 start setupFromConfig.js`    

## Troubleshooting

Use `killall -9 geth constellation-node` to make sure there are no other running instances of geth or constellation-node.    

To ensure you are starting from a clean slate:
1. `pm2 stop all`
2. `pm2 kill`
3. `killall -9 screen`
4. `killall -9 geth constellation-node`

# Running from cli prompt

Start the QuorumNetworkManager by running `node index.js`. 

Tip: Use `screen -S QNM` in ubuntu to keep the QNM running. Detach from screen with `Ctrl + A + D`.


# Constellation

The `removeConstellation.sh` script can be used to remove constellation binaries and their entry into the `.bashrc`. Note that this script will leave the constellation directories intact (this is to prevent accidental deletion of directories if constellation wasn't installed using the `setup.sh` script).

## Upgrading Constellation

The QuorumNetworkManager upgrades constellation from `v0.0.1` to `v0.1.0` in commit [9061d3c](https://github.com/ConsenSys/QuorumNetworkManager/commit/9061d3c4144c9c9f25c607ad2a1a116f4ea81526). If you are on constellation `v0.0.1` and want to upgrade to `v0.1.0` please:

1. use a version of the QNM after [9061d3c](https://github.com/ConsenSys/QuorumNetworkManager/commit/9061d3c4144c9c9f25c607ad2a1a116f4ea81526)
2. run the `upgradeConstellationTo010.sh` script
3. run `source ~/.bashrc`



