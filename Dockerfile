###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM redhat/ubi9-minimal:9.7 AS nodejs

# Install nodejs
RUN adduser -U -u 1000 -s /bin/sh node && \
    microdnf -y module disable nodejs && \
    microdnf -y module enable nodejs:24 && \
    microdnf install shadow-utils nodejs which -y && \
    microdnf remove nodejs-full-i18n npm nodejs-docs -y && \
    microdnf clean all && \
    rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.* && \
    node -v

# allow node to bind to port 80
# This is required for the application to run on port 80 without root privileges
RUN setcap CAP_NET_BIND_SERVICE=+eip $(which node)

FROM nodejs AS nodejs-and-yarn

# Install yarn
RUN microdnf install npm -y && \
    microdnf remove nodejs-docs -y && \
    microdnf clean all && \
    rm -rf /mnt/rootfs/var/cache/* /mnt/rootfs/var/log/dnf* /mnt/rootfs/var/log/yum.*

RUN npm install -g corepack
RUN corepack enable

FROM nodejs-and-yarn AS development

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND yarn.lock (when available).
# Copying this first prevents re-running yarn install on every code change.
COPY --chown=node:node package.json ./
COPY --chown=node:node yarn.lock ./

RUN yarn install --immutable

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM nodejs-and-yarn AS build

WORKDIR /usr/src/app

# In order to run `yarn run build` we need access to the Nest CLI which is a dev dependency. In the previous development stage we ran `yarn ci` which installed all dependencies, so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node ./ ./
COPY --chown=node:node package.json ./
COPY --chown=node:node yarn.lock ./


# Run the build command which creates the production bundle
RUN yarn build

USER node

###################
# PRODUCTION
###################

FROM nodejs AS production

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/package.json ./package.json
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

ENV NODE_ENV=production
ENV NO_COLOR=true
ENV NODE_OPTIONS="--max-old-space-size=2048 --max-http-header-size=16384000"
USER node

# Start the server using the production build
CMD [ "node", "dist/main.js" ]

EXPOSE 80