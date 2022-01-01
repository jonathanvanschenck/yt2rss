# -------------------
#   Build Image
# ------------------
FROM node:16-alpine AS builder

# Install dependancies
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# RUN npm install
RUN npm ci --only=production


# -------------------
#   App Image
# ------------------
FROM node:16-alpine AS app

# Add dependancies
RUN apk add --no-cache ffmpeg

# Create app directory
WORKDIR /usr/src/app

# Copy over the build package
COPY --from=builder ./node_modules ./node_modules
COPY --from=builder ./package*.json ./

# Copy over all the source
COPY ./scripts ./scripts
COPY ./lib ./lib
COPY ./middleware ./middleware
COPY ./models ./models
COPY ./public ./public
COPY ./routes ./routes
COPY ./templates ./templates
COPY ./entrypoint.sh ./
COPY ./config.json.template ./
COPY ./index.js ./

# Run my boi
ENTRYPOINT [ "./entrypoint.sh" ]
