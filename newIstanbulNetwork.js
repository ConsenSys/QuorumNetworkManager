let async = require('async')
let exec = require('child_process').exec

let whisper = require('./Communication/whisperNetwork.js')
let util = require('./util.js')
let constellation = require('./constellation.js')
let peerHandler = require('./peerHandler.js')
let fundingHandler = require('./fundingHandler.js')
let ports = require('./config.js').ports
let setup = require('./config.js').setup

function startIstanbulNode(result, cb){
  console.log('[*] Starting istanbul node...')
  let options = {encoding: 'utf8', timeout: 100*1000}
  let cmd = './startIstanbulNode.sh';
  cmd += ' '+setup.dataDir;
  cmd += ' '+ports.gethNode;
  cmd += ' '+ports.gethNodeRPC;
  cmd += ' '+ports.gethNodeWS_RPC;
  let child = exec(cmd, options)
  child.stdout.on('data', function(data){
    cb(null, result)
  })
  child.stderr.on('data', function(error){
    console.log('Start istanbul node ERROR:', error)
    cb(error, null)
  })
}

function startNewIstanbulNetwork(config, cb){
  console.log('[*] Starting new node...')

  let nodeConfig = {
    localIpAddress: config.localIpAddress,
    networkMembership: config.networkMembership,
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
      remoteIpAddress : null, 
      remotePort : ports.constellation,
      publicKeyFileName: 'node.pub', 
      privateKeyFileName: 'node.key', 
      publicArchKeyFileName: 'nodeArch.pub', 
      privateArchKeyFileName: 'nodeArch.key', 
    },
    "web3IPCHost": './Blockchain/geth.ipc',
    "web3RPCProvider": 'http://localhost:'+ports.gethNodeRPC,
    "web3WSRPCProvider": 'ws://localhost:'+ports.gethNodeWS_RPC,
    consensus: 'istanbul'
  }

  let seqFunction = async.seq(
    util.handleExistingFiles,
    whisper.StartCommunicationNetwork,
    util.handleNetworkConfiguration,
    startIstanbulNode,
    util.CreateWeb3Connection,
    whisper.AddEnodeResponseHandler,
    peerHandler.ListenForNewEnodes,
    whisper.AddEtherResponseHandler,
    fundingHandler.MonitorAccountBalances,
    whisper.existingIstanbulNetworkMembership,
    whisper.PublishNodeInformation
  )

  seqFunction(nodeConfig, function(err, res){
    if (err) { return console.log('ERROR', err) }
    console.log('[*] Done')
    cb(err, res)
  })
}
function handleStartingNewIstanbulNetwork(options, cb){
  config = {}
  config.localIpAddress = options.localIpAddress
  config.networkMembership = options.networkMembership
  config.keepExistingFiles = options.keepExistingFiles
  startNewIstanbulNetwork(config, function(err, result){
    if (err) { return console.log('ERROR', err) }
    config.istanbulNetwork = Object.assign({}, result)
    let networks = {
      istanbulNetwork: config.istanbulNetwork,
      communicationNetwork: config.communicationNetwork
    }
    cb(err, networks)
  })
}

exports.handleStartingNewIstanbulNetwork = handleStartingNewIstanbulNetwork
