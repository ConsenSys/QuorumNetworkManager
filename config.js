//TODO: These can be overwritten with commandline variables passed when running setupFromConfig

let env = process.env
let config = {}

config.chainId = 4058

config.ports = {}
config.ports.communicationNode = 50000
config.ports.remoteCommunicationNode = 50000
config.ports.communicationNodeRPC = 50010
config.ports.communicationNodeWS_RPC = 50020
config.ports.gethNode = 20000 // Changing this will change the raftHttp port!
config.ports.gethNodeRPC = 20010
config.ports.gethNodeWS_RPC = 20020
config.ports.raftHttp = config.ports.gethNode + 20000  // This is a requirement from raftHttp!
config.ports.devp2p = 30303
config.ports.constellation = 9000

config.identity = {}
config.identity.nodeName = env.NODE_NAME ? env.NODE_NAME : 'unset'

config.whisper = {}
config.whisper.symKeyPassword = 'networkBootstrapPassword'
config.whisper.symKeyID = null
config.whisper.asymKeyID = null
config.whisper.id = null
config.whisper.powTime = 3
config.whisper.powTarget = 0.5
config.whisper.diskEncryptionPassword = 'insertSecurePassword' || process.env.WHISPER_DISK_ENCRYPTION_PASSWORD
config.whisper.diskEncryptionDirectory = 'WhisperKeys' || process.env.WHISPER_DISK_ENCRYPTION_DIRECTORY
config.whisper.diskEncryptionFileName = 'whisperKeys.txt'

// Change these for different setups.
config.setup = {}
// Enter ip address as a string
config.setup.localIpAddress = env.IP ? env.IP : '127.0.0.1'
// Only allowAll for now
config.setup.networkMembership = env.NETWORK_MEMBERSHIP ? env.NETWORK_MEMBERSHIP : 'allowAll'
// Options are true or false. This refers to the blockchain files
config.setup.keepExistingFiles = (env.KEEP_FILES == 'true')
// Options are true or false. This refers to the nodekey and keystore
config.setup.deleteKeys = (env.DELETE_KEYS == 'true')
// Only raft and istanbul supported for now
config.setup.consensus = env.CONSENSUS ? env.CONSENSUS : 'raft'
// Options are coordinator, non-coordinator, dynamicPeer
config.setup.role = env.ROLE ? env.ROLE : 'coordinator'
// Enodes that will be written to static-nodes.json if coordinator, comma separated strings
config.setup.enodeList = env.ENODE_LIST ? env.ENODE_LIST : []
// Accounts that will be written to the genesis config if coordinator, comma separated strings
config.setup.addressList = env.ADDRESS_LIST ? env.ADDRESS_LIST : []
// Address of the coordinator, used if this node is not the coordinator
config.setup.remoteIpAddress = env.COORDINATING_IP ? env.COORDINATING_IP : '127.0.0.1'
// This is changed to true if setupFromConfig.js is used
config.setup.automatedSetup = false
// The target gas limit that this node will be voting for
config.setup.targetGasLimit = env.TARGET_GAS_LIMIT ? env.TARGET_GAS_LIMIT : '10000000'
// The block gas limit specified in the genesis config (only used if this node is the coordinator)
config.setup.genesisGasLimit = env.GENESIS_GAS_LIMIT ? env.GENESIS_GAS_LIMIT : '10000000'

module.exports = config
