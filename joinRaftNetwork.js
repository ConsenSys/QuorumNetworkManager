let async = require('async')
let exec = require('child_process').exec
let prompt = require('prompt')
let fs = require('fs')

let whisper = require('./Communication/whisperNetwork.js')
let util = require('./util.js')
let constellation = require('./constellation.js')
let peerHandler = require('./peerHandler.js')
let fundingHandler = require('./fundingHandler.js')
let ports = require('./config.js').ports
let setup = require('./config.js').setup

prompt.start()

function displayGethAccount(result, cb){
  console.log('Account:', result.addressList[0])
  cb(null, result)
}

function startRaftNode(result, cb){
  let options = {encoding: 'utf8', timeout: 100*1000}
  let cmd = './startRaftNode.sh'
  cmd += ' '+setup.dataDir;
  cmd += ' '+ports.gethNode;
  cmd += ' '+ports.gethNodeRPC;
  cmd += ' '+ports.gethNodeWS_RPC;
  cmd += ' '+ports.raftHttp;
  if(result.networkMembership === 'permissionedNodes'){
    cmd += ' permissionedNodes' 
  } else {
    cmd += ' allowAll'
  }
  let child = exec(cmd, options)
  child.stdout.on('data', function(data){
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
      util.ClearDirectories,
      util.CreateDirectories,
      util.GetNewGethAccount,
      displayGethAccount,
      util.GenerateEnode,    
      util.DisplayEnode,
      constellation.CreateNewKeys, 
      constellation.CreateConfig
    )
    seqFunction(result, function(err, res){
      if (err) { return console.log('ERROR', err) }
      cb(null, res)
    })
  } else {
    cb(null, result)
  }
}

function handleNetworkConfiguration(result, cb){
  if(result.keepExistingFiles == false){ 
    let seqFunction = async.seq(
      whisper.RequestNetworkMembership,
      whisper.GetGenesisBlockConfig,
      whisper.GetStaticNodesFile
    )
    seqFunction(result, function(err, res){
      if (err) { return console.log('ERROR', err) }
      cb(null, res)
    })
  } else {
    cb(null, result)
  }
}

function joinRaftNetwork(config, cb){
  console.log('[*] Starting new node...')

  let nodeConfig = {
    localIpAddress: config.localIpAddress,
    remoteIpAddress : config.remoteIpAddress, 
    keepExistingFiles: config.keepExistingFiles,
    folders: ['Blockchain', 'Blockchain/geth', 'Constellation'], 
    constellationKeySetup: [
      {folderName: 'Constellation', fileName: 'node'},
      {folderName: 'Constellation', fileName: 'nodeArch'},
    ],
    constellationConfigSetup: { 
      configName: 'constellation.config', 
      folderName: 'Constellation', 
      localIpAddress : config.localIpAddress, 
      localPort : ports.constellation,
      remoteIpAddress : config.remoteIpAddress, 
      remotePort : ports.constellation,
      publicKeyFileName: 'node.pub', 
      privateKeyFileName: 'node.key', 
      publicArchKeyFileName: 'nodeArch.pub', 
      privateArchKeyFileName: 'nodeArch.key', 
    },
    "web3IPCHost": './Blockchain/geth.ipc',
    "web3RPCProvider": 'http://localhost:'+ports.gethNodeRPC,
    "web3WSRPCProvider": 'ws://localhost:'+ports.gethNodeWS_RPC,
    consensus: 'raft'
  }

  let seqFunction = async.seq(
    handleExistingFiles,
    whisper.JoinCommunicationNetwork,
    handleNetworkConfiguration,
    startRaftNode,
    util.CreateWeb3Connection,
    whisper.AddEnodeResponseHandler,
    peerHandler.ListenForNewEnodes,
    fundingHandler.MonitorAccountBalances,
    whisper.PublishNodeInformation
  )

  seqFunction(nodeConfig, function(err, res){
    if (err) { return console.log('ERROR', err) }
    console.log('[*] New node started')
    cb(err, res)
  })
}

function handleJoiningRaftNetwork(options, cb){
  config = {}
  config.localIpAddress = options.localIpAddress
  config.keepExistingFiles = options.keepExistingFiles
  console.log('In order to join the network, '
    + 'please enter the ip address of the coordinating node')
  prompt.get(['ipAddress'], function (err, network) {
    config.remoteIpAddress = network.ipAddress
    joinRaftNetwork(config, function(err, result){
      if (err) { return console.log('ERROR', err) }
      let networks = {
        raftNetwork: Object.assign({}, result),
        communicationNetwork: config.communicationNetwork
      }
      cb(err, networks)
    })
  })
}

exports.HandleJoiningRaftNetwork = handleJoiningRaftNetwork
