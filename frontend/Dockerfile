FROM node:20-slim

WORKDIR /workspaces/Unity-Generator/frontend

COPY package.json /workspaces/Unity-Generator/frontend/package.json
RUN npm install

COPY . /workspaces/Unity-Generator/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
