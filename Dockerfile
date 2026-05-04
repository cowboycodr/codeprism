FROM node:22-bookworm
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends git docker.io \
  && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm ci
EXPOSE 5181 5182 2222
CMD ["npm", "run", "dev"]
