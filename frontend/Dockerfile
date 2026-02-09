FROM node:20-slim

WORKDIR /app/frontend

COPY package.json /app/frontend/package.json
RUN npm install

COPY . /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
