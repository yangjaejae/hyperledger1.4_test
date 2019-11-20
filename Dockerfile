FROM node:10.15.2

# 앱 디렉터리 생성
#ENV PATH /usr/local/bin:$PATH
#ENV PYTHON_VERSION 2.7
RUN mkdir -p /usr/src/app

#RUN echo "Asia/Seoul" > /etc/timezone
#RUN dpkg-reconfigure -f noninteractive tzdata

# 앱 의존성 설치
COPY package*.json ./
RUN npm install
