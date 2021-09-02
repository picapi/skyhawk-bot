# Skyhawk

A bot designed to look over your server like a hawk and keep everyone secure within it.
Real documentation and license coming at some point.

For now, using the `docker-compose.dev.yml.example` as a template, renaming to `docker-compose.dev.yml`, doing the same for `config.json.example` to `config.json`, running `docker-compose -f .\docker-compose.dev.yml -f .\docker-compose.yml up --build`, and `docker exec -it <compose name> node push-slash-commands.js` should get things working.