# Makefile for cleaning up the repo and set it to a fresh-clone state
# Run in root of the repo with sudo:

# sudo make clean

# Run 'pnpm i' to install dependencies again
# Run 'pnpm build' to build the project again

# Folders to blow away
CLEAN_DIRS := \
  node_modules \
  .turbo \
  out \
  **/**/node_modules \
  **/**/.next \
  **/**/out \
  **/**/dist \
  **/**/.turbo \

# Files to blow away
CLEAN_FILES := \
  **/**/*.tsbuildinfo \

.PHONY: clean
clean:
	@echo "🧹 Cleaning all build artifacts and installs…"
	# Remove directories
	@for d in $(CLEAN_DIRS); do \
	  sudo rm -rf $$d; \
	done
	# Remove files
	@for f in $(CLEAN_FILES); do \
	  sudo rm -f $$f; \
	done
	@echo "✅  Done. Repo is now back to a fresh-clone state."

.PHONY: rebuild
rebuild:
	@echo "🔄 Cleaning build artifacts as root…"
	sudo $(MAKE) clean
	@echo "🔄 Rebuilding local packages…"
	# Dependencies are installed under the invoking user
	pnpm install
	@echo "🏗️ Building packages in packages/…"
	pnpm run build:packages


# Make your life easier connecting to the container

# Convenience variable for executing commands in the running container.
DC      := docker-compose exec meepstudio_website_dev
SHELL   := /bin/bash
.PHONY: shell build serve dev run runb down

# 0) Run the container
run:
	docker compose up meepstudio_website_dev
runb:
	docker compose up meepstudio_website_dev --build
down:
	docker compose down -v

# 1) Drop into a shell in the container
shell:
	$(DC) sh

# 2) Build everything from repo root
build:
	$(DC) sh -c "cd /repo && pnpm run build"

# 3) Serve the website’s out/ folder on 3001
#
#    Assumes both:
#      • a package.json script like "serve:out": "serve out -l 3001"
#      • AND that 'serve' is in the devDependencies of the package.json
serve:
	pnpm --filter meepstudio-website run serve:out

# Completely clean the repo, install dependencies, build, and serve (reproducing the gh actions workflow)
dev: clean
	pnpm i && pnpm run build && pnpm --filter meepstudio-website run serve:out

prod: clean down
	docker compose up meepstudio_website_prod --build && \
	npx serve out -l 3001