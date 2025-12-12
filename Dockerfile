# Use official Node image and install python+yt-dlp
FROM node:20-slim

RUN apt-get update && apt-get install -y python3 python3-pip ca-certificates --no-install-recommends     && pip3 install --no-cache-dir yt-dlp     && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package.json ./
RUN npm ci --only=production

COPY server.js ./

EXPOSE 3000

RUN useradd -m appuser && chown -R appuser /usr/src/app
USER appuser

CMD ["node", "server.js"]
