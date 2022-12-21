FROM node:16-alpine

ENV GENERATE_SOURCEMAP=false
ENV NODE_ENV=production

WORKDIR /app

COPY . .

RUN npm install \
  npm run build 

CMD ["npm", "run", "start"]