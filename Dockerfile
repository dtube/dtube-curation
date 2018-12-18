FROM node:latest
LABEL "project.home"="https://github.com/dtube/dtube-curation"
RUN git clone https://github.com/dtube/dtube-curation
WORKDIR /dtube-curation
RUN npm install

ENV token 'MY_SUPER_SECRET_BOT_TOKEN'
ENV wif '5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg'
ENV account 'guest123'
ENV db_addr 'localhost'
ENV db_user 'root'
ENV db_pass ''

CMD ["node", "index.js"]
