#Dockerfile in the root directory

# Use the multi-stage build to reduce the final image size
# Stage 1: Build Stage
FROM node:14 AS builder

# Set working directory
WORKDIR /usr/src/app


# Copy the package.json and package-lock.json from the server folder to the working directory
COPY ./server/package*.json ./

# Install dependencies
RUN npm install

# Copy the source code from the server folder to the working directory
COPY ./server .

# Stage 2: Production Stage
FROM node:14

# Set working directory
WORKDIR /usr/src/app

# Copy the built files from the previous stage
COPY --from=builder /usr/src/app .


# Expose the port the app runs on
EXPOSE 10000

# Start the server
CMD ["npm", "start"]
