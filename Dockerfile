FROM mhart/alpine-node:14 as client-build

WORKDIR /glof/src/app
COPY glof/ ./glof/

RUN cd glof && npm install @angular/cli && npm install && npm run build

# ADD /glof/package.json .
# ADD /glof-server/package.json .

# RUN npm install
# ADD . .

FROM mhart/alpine-node:14 as server-build
WORKDIR /root/
COPY --from=client-build /glof/src/app/glof/dist ./glof/dist
COPY package*.json ./
RUN npm install
COPY /glof-server .
RUN npm install
EXPOSE 709
CMD ["node", "server.js"]


# COPY --from=build /srv .
# EXPOSE 709
# CMD ["node", "/glof-server/server.js"]