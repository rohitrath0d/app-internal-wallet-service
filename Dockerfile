FROM node:20-alpine

# set working directory
WORKDIR /app

# copy package files first (for caching)
COPY package.json package-lock.json* ./

# installing deps
RUN npm install

# copy source code
COPY . .

# expose port
EXPOSE 5000

CMD ["node", "src/run_server.js"]