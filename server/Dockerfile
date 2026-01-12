FROM node:22-bullseye
# sets the working directory inside the container
WORKDIR /app
# copy package.json and install dependencies in the container
COPY package*.json ./
RUN npm install
# copy the rest of the application code to the container
COPY . .
# build the typescript code
RUN npm run build
# the container will listen on port 5000
EXPOSE 5000
# run the production server
CMD ["npm", "start"]
