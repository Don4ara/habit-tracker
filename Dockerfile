FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# base=/ переопределяет "/habit-tracker/" из vite.config — в контейнере отдаём с корня
RUN npm run build -- --base=/
EXPOSE 80
# vite preview раздаёт dist с SPA-фолбэком
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "80", "--base", "/"]
