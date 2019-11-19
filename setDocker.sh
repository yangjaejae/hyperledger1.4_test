#!/bin/bash +x
#
# Docker 설치 Shell Script
#

echo
echo "##########################################################"
echo "##### Install Docker #########"
echo "##########################################################"
   set -x

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

sudo apt-get update
sudo apt-get install apt-transport-https
sudo apt-get update
apt-cache policy docker-ce
sudo apt-get update
sudo apt-get install -y docker-ce
sudo chmod -R 777 /var/run/docker.sock
sudo usermod -aG docker ubuntu

echo
echo "##########################################################"
echo "##### Install docker-compose #########"
echo "##########################################################"
sudo curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
    set +x
