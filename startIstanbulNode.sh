#!/bin/bash
set -u
set -e

geth --datadir Blockchain init "$1/quorum-genesis.json" &>> /dev/null

nohup constellation-node constellation.config &> constellation.log &

sleep 5

FLAGS="--datadir Blockchain --shh --port $2 --unlock 0 --password passwords.txt --syncmode full --mine --nodiscover"

RPC_API="admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul"
HTTP_RPC_ARGS="--rpc --rpcaddr 0.0.0.0 --rpcport $3 --rpcapi $RPC_API"
WS_RPC_ARGS="--ws --wsaddr 0.0.0.0 --wsport $4 --wsapi $RPC_API --wsorigins=*"

ALL_ARGS="$FLAGS $HTTP_RPC_ARGS $WS_RPC_ARGS"

PRIVATE_CONFIG=constellation.config nohup geth $ALL_ARGS --targetgaslimit 50000000 &> gethNode.log &

echo "[*] Node started"
