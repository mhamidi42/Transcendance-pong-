COMPOSE_FILE = ./docker-compose.yml

all: up

up:
	./dev.sh

down:
	docker compose -f $(COMPOSE_FILE) down

clean:
	docker compose -f $(COMPOSE_FILE) down -v
	docker system prune -af

ps:
	docker compose -f $(COMPOSE_FILE) ps

logs:
	docker compose -f $(COMPOSE_FILE) logs -f

