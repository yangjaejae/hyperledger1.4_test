#!/bin/bash
DOCKER_CONTAINER_NAME="taxrefund.api.blockchain"
DOCKER_IMAGE_NAME="taxrefund.api.blockchain/nodejs"
DOCKER_IMAGE_TAG="v1.0.0"
COMPOSE_FILE=docker-compose.yaml
echo "start TAXREFUND.API.BLOCKCHAIN Server"


function restartContainers() {
  docker rm -f $(docker ps -aqf name="${DOCKER_CONTAINER_NAME}")
  docker-compose -f ${COMPOSE_FILE} up -d 2>&1
}

function rebuildDocker() {
    echo "Stop and Remove current TAXREFUND.API.BLOCKCHAIN Server docker container..."
    docker rm -f $(docker ps -aqf name="${DOCKER_CONTAINER_NAME}")

    if [[ "$(docker images -q ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} 2> /dev/null)" != "" ]]; then
        echo "Remove TAXREFUND.API.BLOCKCHAIN Server docker IMAGE!!.."
        docker rmi -f ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}
    fi

    echo "Build TAXREFUND.API.BLOCKCHAIN Server image.."
    docker build -t ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} .
    docker-compose -f ${COMPOSE_FILE} up -d 2>&1
}


function askProceed () {
  read -p "Remove CA-Registry Server images and container to rebuild those items(Y) or just restart container(N) ? [Y/N] " ans
  case "$ans" in
    y|Y|"" )
      echo "Remove and rebuild docker container of TAXREFUND.API.BLOCKCHAIN Server"
      rebuildDocker
    ;;
    n|N )
      echo "Restart docker container of TAXREFUND.API.BLOCKCHAIN Server..."
      restartContainers
    ;;
    * )
      echo "invalid response"
      askProceed
    ;;
  esac
}


askProceed




