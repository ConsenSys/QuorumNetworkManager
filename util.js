var exec = require('child_process').exec;
var ps = require('ps-node')
var fs = require('fs');
var async = require('async')
var prompt = require('prompt')
prompt.start();

let config = require('./config.js')
let ports = config.ports
let setup = config.setup

let constellation = require('./constellation.js')

function killallGethConstellationNode(cb){
  var cmd = 'killall -9';
  cmd += ' geth';
  cmd += ' constellation-node';
  var child = exec(cmd, function(){
    cb(null, null);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function clearDirectories(result, cb){
  var cmd = 'rm -rf';
  for(var i in result.folders){
    var folder = result.folders[i];
    cmd += ' '+ folder + '/*';
  }
  var child = exec(cmd, function(){
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function createDirectories(result, cb) {
  var cmd = 'mkdir -p';
  for(var i in result.folders){
    var folder = result.folders[i];
    cmd += ' '+folder;    
  }
  var child = exec(cmd, function(){
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function hex2a(hexx) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2){
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

// TODO: Add failure after a number of retries
function waitForIPCPath(path, cb){
  if (fs.existsSync(path)) {
    cb()
  } else {
    setTimeout(function(){
      waitForIPCPath(path, cb)
    }, 1000)
  }
}

function createWeb3IPC(ipcProvider){
  let Web3IPC = require('web3_ipc');
  let options = {
    host: ipcProvider,
    ipc: true,
    personal: true,
    admin: true,
    debug: false
  };
  let web3IPC = Web3IPC.create(options);
  let web3IPCConnection = web3IPC.currentProvider.connection
  return web3IPC
}

function waitForRPCConnection(web3RPC, cb){
  web3RPC.eth.net.isListening(function(err, isListening){
    if(isListening === true){
      console.log('[*] RPC connection established')
      cb()
    } else {
      setTimeout(function(){
        console.log('waiting for RPC connection ...')
        waitForRPCConnection(web3RPC, cb)
      }, 1000)
    }
  })
}

// TODO: add error handler here for web3 connections so that program doesn't exit on error
function createWeb3Connection(result, cb){
  let ipcProvider = result.web3IPCHost;
  waitForIPCPath(ipcProvider, function(){
    // Web3 WS RPC
    let web3WSRPC
    if(result.web3WSRPCProvider){
      let wsProvider = result.web3WSRPCProvider;
      let Web3 = require('web3');
      web3WSRPC = new Web3(wsProvider);
      result.web3WSRPC = web3WSRPC;
    }
    // Web3 http RPC
    let httpProvider = result.web3RPCProvider;
    let Web3HttpRPC = require('web3');
    let web3HttpRPC = new Web3HttpRPC(httpProvider);
    result.web3HttpRPC = web3HttpRPC
    waitForRPCConnection(result.web3HttpRPC, function(){
      result.web3IPC = createWeb3IPC(ipcProvider)
      if(result.consensus === 'raft'){
        let Web3Raft = require('web3-raft');
        let web3HttpRaft = new Web3Raft(httpProvider);
        result.web3HttpRaft = web3HttpRaft;
      }
      console.log('[*] Node started')
      cb(null, result);
    })
  })
}

function connectToPeer(result, cb){
  var enode = result.enode;
  result.web3IPC.admin.addPeer(enode, function(err, res){
    if(err){console.log('ERROR:', err);}
    cb(null, result);
  });
}

function getNewGethAccount(result, cb){
  var options = {encoding: 'utf8', timeout: 10*1000};
  var child = exec('geth --datadir Blockchain account new', options);
  child.stdout.on('data', function(data){
    if(data.indexOf('Your new account') >= 0){
      child.stdin.write('\n');
    } else if(data.indexOf('Repeat') >= 0){
      child.stdin.write('\n');
    } else if(data.indexOf('Address') == 0){
      var index = data.indexOf('{');
      var address = '0x'+data.substring(index+1, data.length-2);
      if(result.addressList == undefined){
        result.addressList = [];
      }
      result.addressList.push(address);
      cb(null, result);
    } 
  });
  child.stderr.on('data', function(error){
    if(error.indexOf('No etherbase set and no accounts found as default') < 0){
      console.log('ERROR:', error);
      cb(error, null);
    }
  });
}

function instanceAlreadyRunningMessage(processName){
  console.log('\n--- NOTE: There is an instance of '+processName+' already running.'+
    ' Please kill this instance by selecting option 5 before continuing\n')
}

function checkPreviousCleanExit(cb){
  async.parallel({
    geth: function(callback){
      ps.lookup({
        command: 'geth',
        psargs: 'ef'
      }, 
      function(err, resultList){
        callback(err, resultList)
      })
    }, 
    constellation: function(callback){
      ps.lookup({
        command: 'constellation-node',
        psargs: 'ef'
      }, 
      function(err, resultList){
        callback(err, resultList)
      })
    } 
  }, function(err, result){
    if(result && result.geth && result.geth.length > 0){
      instanceAlreadyRunningMessage('geth')
    }
    if(result && result.constellation && result.constellation.length > 0){
      instanceAlreadyRunningMessage('constellation')
    }
    cb(err, true)
  })
}

function createRaftGenesisBlockConfig(result, cb){
  let genesisTemplate = {
    "alloc": {},
    "coinbase": result.addressList[0],
    "config": {
      "homesteadBlock": 0,
      "chainId": config.chainId,
      "eip155Block": null,
      "eip158Block": null,
      "isQuorum": true
    },
    "difficulty": "0x0",
    "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "gasLimit": "0xE0000000",
    "mixhash": "0x00000000000000000000000000000000000000647572616c65787365646c6578",
    "nonce": "0x0",
    "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "timestamp": "0x00"
  }

  for(let key in result.addressList){
    genesisTemplate.alloc[result.addressList[key]] = {
      "balance": "1000000000000000000000000000"
    }
  }

  let genesisConfig = JSON.stringify(genesisTemplate)

  fs.writeFile('quorum-genesis.json', genesisConfig, 'utf8', function(err, res){
    result.communicationNetwork.genesisBlockConfigReady = true;
    cb(err, result);
  })
}

function isWeb3RPCConnectionAlive(web3RPC){
  let isAlive = false
  try{
    let accounts = web3RPC.eth.accounts
    if(accounts){
      isAlive = true
    }
  } catch(err){ } 
  return isAlive 
}

function getEnodePubKey(cb){
  let options = {encoding: 'utf8', timeout: 10*1000};
  let child = exec('bootnode -nodekey Blockchain/geth/nodekey -writeaddress', options)
  child.stdout.on('data', function(data){
    data = data.slice(0, -1)
    cb(null, data)
  })
  child.stderr.on('data', function(error){
    console.log('ERROR:', error)
    cb(error, null)
  })
}

function generateEnode(result, cb){
  console.log('Generating node key')
  if(result.consensus === 'raft'){
    let options = {encoding: 'utf8', timeout: 10*1000};
    let child = exec('bootnode -genkey Blockchain/geth/nodekey', options)
    child.stderr.on('data', function(error){
      console.log('ERROR:', error)
    })
    child.stdout.on('close', function(error){
      getEnodePubKey(function(err, pubKey){
        let enode = 'enode://'+pubKey+'@'+result.localIpAddress+':'+ports.gethNode+
          '?raftport='+ports.raftHttp
        result.nodePubKey = pubKey
        result.enodeList = [enode]
        cb(null, result)
      })
    })
  } else if(result.consensus === 'istanbul'){
    runIstanbulTools(function(err, dataString){
      getIstanbulSetupFromIstanbulTools(dataString, function(err, validatorsJSON, staticNodesJSON, genesisJSON){
        let validatorAddress = validatorsJSON['Address']
        let enode = validatorsJSON['NodeInfo'].replace('0.0.0.0:30303?discport=0', result.localIpAddress+':'+ports.gethNode)
        let nodePubKey =  enode.substring('enode://'.length, enode.indexOf('@'))
        let nodekey = validatorsJSON['Nodekey']
        console.log('To become a validator, please use the following address:', validatorAddress)
        result.validatorAddress = validatorAddress
        result.nodePubKey = nodePubKey
        result.enodeList = [enode]
        fs.writeFileSync('Blockchain/geth/nodekey', nodekey, 'utf8') 
        fs.writeFileSync('Blockchain/validatorAddress', validatorAddress, 'utf8') 
        cb(null, result)
      })
    })
  } else {
    console.log('ERROR: Invalid consensus choice')
    cb(null, null)
  }
}

function displayEnode(result, cb){
  let options = {encoding: 'utf8', timeout: 10*1000};
  let child = exec('bootnode -nodekey Blockchain/geth/nodekey -writeaddress', options)
  child.stdout.on('data', function(data){
    data = data.slice(0, -1)
    let enode = 'enode://'+data+'@'+result.localIpAddress+':'+ports.gethNode+'?raftport='+ports.raftHttp
    console.log('\nenode:', enode+'\n')
    cb(null, result)
  })
  child.stderr.on('data', function(error){
    console.log('ERROR:', error)
    cb(error, null)
  })
}

function displayCommunicationEnode(result, cb){
  if(!result){
    return cb({error: 'parameter not defined, could not get ip address'}, null)
  }
  var options = {encoding: 'utf8', timeout: 10*1000};
  var child = exec('bootnode -nodekey CommunicationNode/geth/nodekey -writeaddress', options)
  child.stdout.on('data', function(data){
    data = data.slice(0, -1)
    let enode = 'enode://'+data+'@'+result.localIpAddress+':'
      +ports.communicationNode
    console.log('\n', enode+'\n')
    result.nodePubKey = data
    result.enodeList = [enode]
    cb(null, result)
  })
  child.stderr.on('data', function(error){
    console.log('ERROR:', error)
    cb(error, null)
  })
}

function handleExistingFiles(result, cb){
  if(result.keepExistingFiles == false){ 
    let seqFunction = async.seq(
      clearDirectories,
      createDirectories
    )
    seqFunction(result, function(err, res){
      if (err) { return console.log('ERROR', err) }
      cb(null, res)
    })
  } else {
    cb(null, result)
  }
}

function createStaticNodeFile(enodeList, cb){
  let options = {encoding: 'utf8', timeout: 100*1000};
  let list = ''
  for(let enode of enodeList){
    list += '"'+enode+'",'
  }
  list = list.slice(0, -1)
  let staticNodes = '['
    + list
    +']'
  
  fs.writeFile('Blockchain/static-nodes.json', staticNodes, function(err, res){
    cb(err, res);
  });
}

function getRaftConfiguration(result, cb){
  if(setup.automatedSetup){
    if(setup.enodeList){
      result.enodeList = result.enodeList.concat(setup.enodeList) 
    } 
    createStaticNodeFile(result.enodeList, function(err, res){
      result.communicationNetwork.staticNodesFileReady = true
      cb(err, result)
    })
  } else {
    console.log('Please wait for others to join. Hit any key + enter once done.')
    prompt.get(['done'] , function (err, answer) {
      if(result.communicationNetwork && result.communicationNetwork.enodeList){
        result.enodeList = result.enodeList.concat(result.communicationNetwork.enodeList) 
      }
      createStaticNodeFile(result.enodeList, function(err, res){
        result.communicationNetwork.staticNodesFileReady = true
        cb(err, result)
      })
    })
  }
}

function runIstanbulTools(cb){
  let cmd = 'istanbul setup --nodes --verbose --num 1 --quorum';
  let child = exec(cmd, function(){ })

  let dataString = ''
  child.stdout.on('data', function(chunk){
    dataString += chunk
  })

  child.stdout.on('end', function(){
    cb(null, dataString)
  })

  child.stderr.on('data', function(error){
    console.log('ERROR:', error)
    cb(error, null)
  })
}

function getIstanbulSetupFromIstanbulTools(dataString, cb){

  let validatorsName = 'validators'
  let staticNodesFileName = 'static-nodes.json'
  let genesisFileName = 'genesis.json'
  let validatorsIndex = dataString.indexOf('validators')
  let staticNodesIndex = dataString.indexOf('static-nodes.json')
  let genesisFileIndex = dataString.indexOf('genesis.json')

  let validatorsFile = dataString.substring(validatorsName.length, staticNodesIndex)
  let validatorsJSON = JSON.parse(validatorsFile)

  let staticNodesJSON = JSON.parse(dataString.substring(staticNodesIndex+staticNodesFileName.length, genesisFileIndex))

  let genesisJSON = JSON.parse(dataString.substring(genesisFileIndex+genesisFileName.length))
  let gasLimit = 50000000
  genesisJSON.gasLimit = '0x' + gasLimit.toString(16)

  cb(null, validatorsJSON, staticNodesJSON, genesisJSON)
}

function getIstanbulConfiguration(result, cb){
  runIstanbulTools(function(err, dataString){
    getIstanbulSetupFromIstanbulTools(dataString, function(err, validatorsJSON, staticNodesJSON, genesisJSON){
      let nodekeyFile = validatorsJSON['Nodekey']
      fs.writeFileSync('Blockchain/geth/nodekey', nodekeyFile, 'utf8') 
      
      staticNodesJSON[0] = staticNodesJSON[0].replace('0.0.0.0:30303?discport=0', result.localIpAddress+':'+ports.gethNode)
      fs.writeFileSync('Blockchain/static-nodes.json', JSON.stringify(staticNodesJSON), 'utf8') 

      genesisJSON['config'].chainId = config.chainId
      for(let key in result.addressList){
        genesisJSON.alloc[result.addressList[key]] = {
          "balance": "0x446c3b15f9926687d2c40534fdb564000000000000"
        }
      }
      fs.writeFileSync('quorum-genesis.json', JSON.stringify(genesisJSON), 'utf8') 

      result.communicationNetwork.genesisBlockConfigReady = true
      result.communicationNetwork.staticNodesFileReady = true
      cb(err, result)
    })
  })
}

function addAddresslistToQuorumConfig(result, cb){
  if(setup.addressList && setup.addressList.length > 0){
    result.addressList = result.addressList.concat(setup.addressList) 
  } 
  if(result.communicationNetwork && result.communicationNetwork.addressList){
    result.addressList = result.addressList.concat(result.communicationNetwork.addressList) 
  }
  cb(null, result)
}

function handleNetworkConfiguration(result, cb){
  if(result.keepExistingFiles == false){ 
    let createGenesisBlockConfig = null
    if(result.consensus === 'raft'){
      let seqFunction = async.seq(
        getRaftConfiguration,
        getNewGethAccount,
        addAddresslistToQuorumConfig,
        createRaftGenesisBlockConfig,
        constellation.CreateNewKeys, 
        constellation.CreateConfig
      )
      seqFunction(result, function(err, res){
        if (err) { return console.log('ERROR', err) }
        cb(null, res)
      })
    } else if(result.consensus === 'istanbul') {
      let seqFunction = async.seq(
        getNewGethAccount,
        addAddresslistToQuorumConfig,
        getIstanbulConfiguration,
        constellation.CreateNewKeys, 
        constellation.CreateConfig
      )
      seqFunction(result, function(err, res){
        if (err) { return console.log('ERROR', err) }
        cb(null, res)
      })
    } else {
      console.log('ERROR in handleNetworkConfiguration: Unknown consensus choice')
      cb(null, null)
    }

  } else {
    result.communicationNetwork.genesisBlockConfigReady = true
    result.communicationNetwork.staticNodesFileReady = true
    cb(null, result)
  }
}

exports.Hex2a = hex2a
exports.ClearDirectories = clearDirectories
exports.CreateDirectories = createDirectories
exports.CreateWeb3Connection = createWeb3Connection
exports.ConnectToPeer = connectToPeer
exports.KillallGethConstellationNode = killallGethConstellationNode
exports.GetNewGethAccount = getNewGethAccount
exports.CheckPreviousCleanExit = checkPreviousCleanExit
exports.CreateRaftGenesisBlockConfig = createRaftGenesisBlockConfig
exports.IsWeb3RPCConnectionAlive = isWeb3RPCConnectionAlive
exports.GenerateEnode = generateEnode
exports.DisplayEnode = displayEnode
exports.DisplayCommunicationEnode = displayCommunicationEnode
exports.handleExistingFiles = handleExistingFiles
exports.generateEnode = generateEnode
exports.displayEnode = displayEnode
exports.handleNetworkConfiguration = handleNetworkConfiguration
