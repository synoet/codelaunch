FROM node:16

COPY . /app
WORKDIR /app

RUN npm install \
npm install swc \
npm run build

EXPOSE 8000

CMD ["npm", "run", "start"]