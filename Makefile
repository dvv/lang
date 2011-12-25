build:
	@./node_modules/.bin/browserbuild -g Locale -f ../lang.js -m index.js lib/
	rm -fr dist

test:
	@./node_modules/.bin/vows tests/smoke.js --spec

.PHONY: build test
