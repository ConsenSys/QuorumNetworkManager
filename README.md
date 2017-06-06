# Contents

1. Introduction & Additional functionality
2. Getting started
3. Firewall rules
4. Performance analysis

# Introduction & Additional functionality

This project's goal is to help getting started with a basic Quorum network. Note that this project is still in its early days and as such, it is not production ready and is very limited in functionality. 

Additional functionnality includes (but is not limited to) options regarding adding more blockmakers and voters, using a different consensus mechanism (e.g. switching to raft) as well as performance testing.

## Network topology

It creates a network with 1 block maker + block voter (on the same node) and then allows multiple participant nodes to join.

## Account management

New accounts that are created via `geth` with automatically be seeded with some ether. This is acheived with a whisper message that requests ether from other nodes and as such can easily be extended to work for accounts that are not created via `geth`.

## Constellation - privacy/confidentiality

Nodes in the network will automatically generate constellation keys and broadcast the public key using whisper. This means that this network supports the privacy/confidentiality features of Quorum

## Pausing block making

There is a script `pauseBlockMaking.js` that will pause the blockmaker if no transactions are present. Depending on the use/test case this can greatly aid in node syncing times. Unfortunately there is currently a bug with`--preload` so this script can't be loaded automatically. Here is a workaround:

To pause blockmaking on the network, the following only needs to be done on the node that is acting as the blockmaker:

1. The terminal session that runs the below steps needs to stay open. To help with this, start a new screen (`sudo apt-get install screen` and `screen -S pauseBlockMaker`). 
2. Run `./attachToLocalQuorumNode.sh` (after the node is started) to connect to the node.
3. Run `loadScript('pauseBlockMaking.js')`. This should print `-------------loaded pause Blockmaker script`.
4. Detach from the screen (`Ctrl + a + d`, while pressing `Ctrl` first press `a` and then press `d`)

# Getting started

There are two options to getting started, manually following the below steps (starting at Requirements) or running a script. In summary, both will create the following directory structure:

```
workspace
  quorum
  quorum-genesis
  constellation
  QuorumNetworkManager
  ...
```

## Running the script

This script `setup.sh` needs to be run from the folder where you want the QuorumNetworkManager to be installed, like your workspace:

1. `wget https://raw.githubusercontent.com/ConsenSys/QuorumNetworkManager/master/setup.sh`
2. `chmod +x setup.sh`
3. `./setup.sh`

This will install all the requirements as well as all the below getting started steps

## Requirements

1. go 1.7.3/4/5 (this has to do with go-ethereum not working with go 1.8) - https://golang.org/dl/
2. Ubuntu 16.04 (this has to do with installing Constellation)
3. NodeJS v7.10.0+ (tested on v7.10.0) (refer to https://nodejs.org/en/download/package-manager/ for installation)

## Installing Ethereum		
 		
 NOTE1: There seems to be a problem with web3 if we don't install ethereum, we still need to find the exact package
 web3 is missing and simply install that package instead.
  		
 1. `sudo apt-get install software-properties-common`		
 2. `sudo add-apt-repository -y ppa:ethereum/ethereum`		
 3. `sudo apt-get update`		
 4. `sudo apt-get install ethereum`

## Installing Quorum

NOTE1: We will need to use Quorum's geth, so do a `sudo mv /usr/bin/geth /usr/bin/normalGeth`

Installation guide for https://github.com/jpmorganchase/quorum

NOTE: This should replace your currently installed `geth`. 

1. `sudo apt-get install -y build-essential`
2. `git clone https://github.com/jpmorganchase/quorum.git`
3. `cd quorum`
4. `make all`
5. Add /build/bin to your PATH: `echo "PATH=\$PATH:"$PWD/build/bin >> ~/.bashrc`
6. `source ~/.bashrc`

## Installing Constellation

Installation guide for https://github.com/jpmorganchase/constellation

1. `sudo apt-get install libdb-dev libsodium-dev zlib1g-dev libtinfo-dev unzip`
2. `mkdir constellation`
3. `cd constellation`
4. `wget https://github.com/jpmorganchase/constellation/releases/download/v0.0.1-alpha/ubuntu1604.zip`
5. `unzip ubuntu1604.zip`
6. `chmod +x ubuntu1604/constellation-node`
7. `chmod +x ubuntu1604/constellation-enclave-keygen`
8. Add ubuntu1604 to your PATH: `echo "PATH=\$PATH:"$PWD/ubuntu1604 >> ~/.bashrc`
9. `source ~/.bashrc`

## Installing Quorum Genesis

Installation guide for https://github.com/davebryson/quorum-genesis

NOTE: the public-key (use ssh-keygen to generate one) of the machine you are working on will have to be added to your github account to clone this repo via ssh

1. `git clone git@github.com:davebryson/quorum-genesis.git`
2. `cd quorum-genesis`
3. `sudo npm install`

## Installing the QuorumNetworkManager

1. `git clone git@github.com:coeniebeyers/QuorumNetworkManager.git`
2. `cd QuorumNetworkManager`
3. `npm install`

## Running

Start the QuorumNetworkManager by running `node index.js`. 

# Firewall rules

```
Name: geth-communicationNode
Port: (TCP+UDP/40000)

Name: geth-node
Port: (TCP+UDP/20000)

Name: whisper
Port: (TCP+UDP/30303)

ConstellationNetwork
Port: (TCP+UDP/9000)

```

# Performance analysis

For the purpose of this project, several tools have been added to assist in determining whether certain use cases are appropriate w.r.t necessary performance.

## Main script (index.js)

Running the main `index.js` script has an option to display the network usage by means of:
1. transactions per second (tx/s)

### Transactions per second

This is a simple measurement of how many transaction occurred over an intervals, divided by that interval. E.g. for 60 transactions that occurred over 10 seconds, we have 60 transactions/10 seconds to give us 6 transactions per seconds.

## doTransactions.js

This script will perform basic ether transfers between two accounts to aid in gauging transactional throughput. To run this script you will need to:
1. have two accounts, `eth.accounts[0]` and `eth.accounts[1]`,
2. `eth.accounts[0]` should be unlocked,
3. `eth.accounts[0]` should have some ether in it. Using the doTransactions.js script in conjunction with the index.js script should already take care of filing accounts with some ether.
4. in the doTransactions.js script there is a timeout that controls how frequently transactions are submitted. Adjust this number based on your needs. A lower number equals lower/less time between transactions which means more transactions per second.

This script will output if a transaction does not make it into the blockchain. If this happens, increase the number spoken of in number 4 above.




