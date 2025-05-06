# Makefile for cleaning up the repo and set it to a fresh-clone state
# Run in root of the repo with sudo:

# sudo make clean

# Run 'pnpm i' to install dependencies again
# Run 'pnpm build' to build the project again

# Folders to blow away
CLEAN_DIRS := \
  node_modules \
  .turbo \
  **/**/node_modules \
  **/**/.next \
  **/**/out \
  **/**/dist \
  **/**/.turbo \

# Files to blow away
CLEAN_FILES := \
  pnpm-lock.yaml \
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