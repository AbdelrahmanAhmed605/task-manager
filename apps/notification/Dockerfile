# Stage 1: Build
FROM node:18-alpine AS build

# Set working directory for the monorepo
WORKDIR /monorepo

# Copy root package files
COPY package.json yarn.lock ./

# Install dependencies for the root
RUN yarn install --frozen-lockfile --production=false

# Install dependencies and build for 'utils' workspace
WORKDIR /monorepo/packages/utils
COPY packages/utils/ ./
RUN yarn install --frozen-lockfile --production=false && yarn build

# Install dependencies and build for 'notification' app
WORKDIR /monorepo/apps/notification
COPY apps/notification/ ./
RUN yarn install --frozen-lockfile --production=false && yarn build


# Stage 2: Runtime
FROM node:20-slim AS runtime

# Set working directory for the runtime
WORKDIR /monorepo

# Copy necessary files from the build stage for 'notification'
COPY --from=build /monorepo/apps/notification/dist ./apps/notification/dist/
COPY --from=build /monorepo/apps/notification/package.json ./apps/notification/package.json

# Copy necessary files from the build stage for 'utils'
COPY --from=build /monorepo/packages/utils/dist ./packages/utils/dist/
COPY --from=build /monorepo/packages/utils/package.json ./packages/utils/package.json

# Copy necessary files from the build stage for root
COPY --from=build /monorepo/package.json ./
COPY --from=build /monorepo/yarn.lock ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile

WORKDIR /monorepo/apps/notification

ENV PORT=3333

EXPOSE ${PORT}

CMD ["node", "dist/index.js"]