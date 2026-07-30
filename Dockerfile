FROM ruby:3.3-bookworm

ENV BUNDLE_GEMFILE=/opt/rycabeauty/Gemfile \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_JOBS=4 \
    JEKYLL_CACHE_DIR=/tmp/jekyll-cache

WORKDIR /srv/jekyll

COPY Gemfile Gemfile.lock /opt/rycabeauty/

RUN gem install bundler --version 4.0.17 --no-document \
    && cd /opt/rycabeauty \
    && bundle lock --add-platform x86_64-linux \
    && bundle install

EXPOSE 4000 35729

CMD ["bundle", "exec", "jekyll", "serve", "--source", "/srv/jekyll", "--destination", "/tmp/rycabeauty-site", "--host", "0.0.0.0", "--port", "4000", "--livereload", "--livereload-port", "35729", "--force_polling"]
