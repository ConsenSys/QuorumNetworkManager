#!/bin/bash

#TODO: Add version check for nodejs as well
#TODO: extract versions to variables

sudo apt-get update
sudo apt-get install -y build-essential libssl-dev git curl

# Install NodeJS
NODEJS_VERSION=$(node --version)
if [[ $NODEJS_VERSION = "" ]]
then
  curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Checking GO version
echo 'Checking go version, if not found will install'
GO_PATH=$(which go)
if [[ $GO_PATH != "" ]]
then
  GO_VERSION=$(go version)
  if [[ $GO_VERSION != 'go version go1.10.3 linux/amd64' ]] && [[ $GO_VERSION != "" ]]
  then
    echo 'go version other than 1.10.3 detected, please see v0.8.0 release notes'
    echo 'current:' $GO_VERSION
    echo 'exiting...'
    exit
  fi
fi

# Install GO
GO_PATH=$(which go)
if [[ $GO_PATH = "" ]]
then
  echo 'Installing go...'
  wget https://storage.googleapis.com/golang/go1.10.3.linux-amd64.tar.gz
  tar -xf go1.10.3.linux-amd64.tar.gz
  sudo cp -r go/ /usr/local/
  rm -rf go/ go1.10.3.linux-amd64.tar.gz
  DETECTED_GO_PATH=$(which go)
  if [[ $DETECTED_GO_PATH = "" ]]
  then
    echo "export GOROOT=/usr/local/go" >> ~/.bashrc
    echo "export GOPATH=$HOME/projects/go" >> ~/.bashrc
    echo "PATH=\$PATH:/usr/local/go/bin" >> ~/.bashrc
    export GOROOT=/usr/local/go
    export GOPATH=$HOME/projects/go
    export PATH=$GOPATH/bin:$GOROOT/bin:$PATH
  fi
  echo 'Installed go version 1.10.3'
else
  echo 'Skipped installing go'
fi

# Detect/move/remove/update/install geth/quorum
GETH_PATH=$(which geth)
if [[ $GETH_PATH != "" ]]
then
  GETH_TYPE=$(geth version | sed -n '4,4p' | sed 's/ /\n/g' | head -1)
  if [[ $GETH_TYPE != "Quorum" ]] # currently detected geth is not quorum
  then
    if [[ $GETH_PATH = '/usr/bin/geth' ]]
    then
      sudo mv /usr/bin/geth /usr/bin/normalGeth
    fi
  fi
  QUORUM_COMMIT=$(geth version | sed -n '3,3p' | sed 's/ /\n/g' | tail -1)
  if [[ $QUORUM_COMMIT != "df4267a25637a5497a3db9fbde4603a3dcd6aa14" ]] # incorrect version of quorum detected
  then
    if [ -d "quorum" ]
    then
      QUORUM_INSTALLED_DIR=${GETH_PATH%/build/bin/geth}
      QUORUM_TARGET_DIR=$(readlink -f quorum)
      if [[ $QUORUM_TARGET_DIR = $QUORUM_INSTALLED_DIR ]]
      then
        echo 'Updating Quorum...'
        cd quorum/
        git fetch --tags
        git checkout v2.0.2
        make all
        echo 'Updated Quorum to 2.0.2'
        cd ..
      else
        echo 'Skipping Quorum update: Detected quorum not installed in' $QUORUM_TARGET_DIR '- human intervention required'
      fi
    else
      echo 'Quorum version other than 2.0.2 detected and/or installed in unknown location - human intervention required'
      echo 'Current:' $QUORUM_COMMIT
      echo 'Exiting...'
      exit
    fi
  fi
else
  if [ ! -d "quorum" ]
  then
    echo 'Installing Quorum...'
    git clone https://github.com/jpmorganchase/quorum.git
    cd quorum/
    git fetch --tags
    git checkout v2.0.2
    make all
    DETECTED_GETH_PATH=$(which geth)
    if [[ $DETECTED_GETH_PATH = "" ]]
    then
      echo "PATH=\$PATH:"$PWD/build/bin >> ~/.bashrc
      export PATH=$PWD/build/bin:$PATH
      source ~/.bashrc
    fi
    cd ..
    echo 'Installed Quorum 2.0.2'
  else
    echo 'Skipped installing Quorum'
  fi
fi

# Checking constellation version
echo 'Checking constellation version, if not found will install'
CONSTELLATION_PATH=$(which constellation-node)
if [[ $CONSTELLATION_PATH != "" ]]
then 
  CONSTELLATION_VERSION=$(constellation-node --version)
  if [[ $CONSTELLATION_VERSION != 'Constellation Node 0.3.2' ]] && [[ $CONSTELLATION_VERSION != "" ]]
  then
    echo 'constellation version other than 0.3.2 detected, please see v0.8.0 release notes'
    echo 'current:' $CONSTELLATION_VERSION
    echo 'exiting...'
    exit
  fi
fi

# Installing constellation
CONSTELLATION_PATH=$(which constellation-node)
if [[ $CONSTELLATION_PATH = "" ]]
then
  echo 'Installing Constellation...'
  mkdir -p constellation && cd constellation/
  sudo apt-get install -y libdb-dev libleveldb-dev libsodium-dev zlib1g-dev libtinfo-dev
  wget https://github.com/jpmorganchase/constellation/releases/download/v0.3.2/constellation-0.3.2-ubuntu1604.tar.xz -O constellation-0.3.2-ubuntu1604.tar.xz
  tar -xf constellation-0.3.2-ubuntu1604.tar.xz
  rm constellation-0.3.2-ubuntu1604.tar.xz
  chmod +x constellation-0.3.2-ubuntu1604/constellation-node
  DETECTED_CONSTELLATION_PATH=$(which constellation-node)
  sudo ln -s /usr/lib/x86_64-linux-gnu/libsodium.so.23.1.0 /usr/lib/libsodium.so.18
  if [[ $DETECTED_CONSTELLATION_PATH = "" ]]
  then
    echo "PATH=\$PATH:"$PWD/constellation-0.3.2-ubuntu1604 >> ~/.bashrc
    export PATH=$PWD/constellation-0.3.2-ubuntu1604:$PATH
    source ~/.bashrc
  fi
  cd ..
  echo 'Installed Constellation 0.3.2'
else
  echo 'Skipped installing Constellation'
fi

# Installing istanbul-tools
OLD_GOPATH=$GOPATH
echo 'Installing Istanbul-tools...'
GOPATH=$PWD/istanbul-tools go get github.com/getamis/istanbul-tools/cmd/istanbul
DETECTED_ISTANBUL_PATH=$(which istanbul)
if [[ $DETECTED_ISTANBUL_PATH = "" ]]
then
  echo "PATH=\$PATH:"$PWD/istanbul-tools/bin >> ~/.bashrc
  echo 'Installed Istanbul-tools'
  source ~/.bashrc
fi
GOPATH=$OLD_GOPATH

# Cloning the QuorumNetworkManager repo
if [ ! -d "QuorumNetworkManager" ]
then 
  echo 'Cloning and installing QuorumNetworkManager...'
  git clone https://github.com/consensys/QuorumNetworkManager.git
  cd QuorumNetworkManager/
  git checkout v0.8.1-beta
  npm install
  echo 'Cloned and installed QuorumNetworkManager v0.8.1-beta'
else
  echo 'Skipped cloning and installing QuorumNetworkManager'
fi
