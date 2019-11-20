#!/bin/bash
DOCKER_CONTAINER_NAME="taxrefund.api.blockchain"
DOCKER_IMAGE_NAME="taxrefund.api.blockchain/nodejs"
DOCKER_IMAGE_TAG="v1.0.0"
COMPOSE_FILE=docker-compose.yaml

  docker rm -f $(docker ps -aqf name="${DOCKER_CONTAINER_NAME}")
  docker-compose -f ${COMPOSE_FILE} up -d 2>&1