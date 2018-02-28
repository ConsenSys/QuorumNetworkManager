let config = require('./config.js')
let setup = config.setup
let newRaftNetwork = require('./newRaftNetwork.js')
let joinExistingRaft = require('./joinExistingRaftNetwork.js')
let newIstanbulNetwork = require('./newIstanbulNetwork.js')
let joinExistingIstanbul = require('./joinExistingIstanbulNetwork.js')

function run(){
  console.log('[SetupFromConfig] Starting setup from config')
  console.log('==== Setup config ====')
  console.log('[DATA_DIR]', setup.dataDir)
  console.log('[IP]', setup.localIpAddress)
  console.log('[NODE_NAME]', config.identity.nodeName)
  console.log('[COORDINATING_IP]', setup.remoteIpAddress)
  console.log('[CONSENSUS]', setup.consensus)
  console.log('[ROLE]', setup.role)
  console.log('[KEEP_FILES]', setup.keepExistingFiles)
  console.log('==== Setup config ====')
  if(config.setup.consensus === 'raft'){
    if(config.setup.role === 'coordinator'){
      config.setup.automatedSetup = true
      newRaftNetwork.HandleStartingNewRaftNetwork(config.setup, function(err, result){
        if(err){console.log('ERROR:', err)} 
        console.log('[SetupFromConfig] All done. Leave this running, ideally inside screen')
      })
    } else if (config.setup.role === 'non-coordinator'){
      console.log('TODO: non-coordinator')
    } else if (config.setup.role === 'dynamicPeer'){
      config.setup.automatedSetup = true
      joinExistingRaft.HandleJoiningRaftNetwork(config.setup, function(err, result){
        if(err){console.log('ERROR:', err)} 
        console.log('[SetupFromConfig] All done. Leave this running, ideally inside screen')
      })
    } else {
      console.log('Unsupported option:', config.setup.role)
    }    
  } else if(config.setup.consensus === 'istanbul'){
    if(config.setup.role === 'coordinator'){
      config.setup.automatedSetup = true
      newIstanbulNetwork.handleStartingNewIstanbulNetwork(config.setup, function(err, result){
        if(err){console.log('ERROR:', err)} 
        console.log('[SetupFromConfig] All done. Leave this running, ideally inside screen')
      })
    } else if (config.setup.role === 'dynamicPeer'){
      config.setup.automatedSetup = true
      joinExistingIstanbul.handleJoiningExistingIstanbulNetwork(config.setup, function(err, result){
        if(err){console.log('ERROR:', err)} 
        console.log('[SetupFromConfig] All done. Leave this running, ideally inside screen')
      })
    } else {
      console.log('Unsupported option:', config.setup.role)
    }    
  } else {
    console.log('Only RAFT and Istanbul-BFT is supported')
  }
}

run()
