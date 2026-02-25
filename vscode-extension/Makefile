.PHONY: build package publish publish-vscode publish-ovsx clean

VERSION := $(shell node -p "require('./package.json').version")
VSIX_FILE := my-md-reader-$(VERSION).vsix

build:
	npm run build

package: build
	vsce package --no-dependencies

publish: publish-vscode publish-ovsx
	@echo "✅ Published to both VS Code Marketplace and Open VSX"

publish-vscode:
	vsce publish --no-dependencies

publish-ovsx: package
ifndef OVSX_PAT
	$(error OVSX_PAT is not set. Please set it with: export OVSX_PAT=your_token)
endif
	npx ovsx publish $(VSIX_FILE) -p $(OVSX_PAT)

clean:
	rm -f *.vsix
