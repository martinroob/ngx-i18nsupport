FROM nginx:1.13.1-alpine
LABEL maintainer "martinroob65@gmail.com" \
  description="A tiny little webapp to quick and dirty translate XLIFF 1.2, XLIFF 2.0 and XMB files"
COPY Dockerhub/nginx.conf /etc/nginx/nginx.conf
COPY Dockerhub/nginx.default.conf /etc/nginx/conf.d/default.conf
RUN mkdir /usr/share/nginx/html/tiny-translator
COPY dist/ /usr/share/nginx/html/tiny-translator
COPY Dockerhub/index.html /usr/share/nginx/html
EXPOSE 80
