#!/bin/bash
DOCKER_CONTAINER_NAME="taxrefund.api.blockchain"
DOCKER_IMAGE_NAME="taxrefund.api.blockchain/nodejs"
DOCKER_IMAGE_TAG="v1.0.0"
COMPOSE_FILE=docker-compose.yaml

echo "Remove ${DOCKER_CONTAINER_NAME} docker IMAGE!!.."
docker rmi -f ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}

echo "Build ${DOCKER_CONTAINER_NAME} SERVER image.."
docker build -t ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG} .