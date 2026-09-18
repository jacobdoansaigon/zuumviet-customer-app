# ZUUMCUSTOMER Expo Web — static export served on $PORT
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG EXPO_PUBLIC_API_URL=https://zuumviet-api-production.up.railway.app
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npx expo export -p web

FROM node:22-alpine
WORKDIR /app
RUN npm i -g serve@14
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT}"]
