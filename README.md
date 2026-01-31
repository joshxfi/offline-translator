# offline-translator

A local-first translation web app powered by `translategemma` & supports multiple languages.

### Prerequisites
- Bun (package manager)
- Ollama
- Node.js >= 20

### Pull translation model
```sh
$ ollama pull translategemma:12b # translation model
$ ollama pull translategemma:4b  # for language detection
```
### Install dependenices
```sh
$ bun install
```

### Development server
```sh
$ bun dev
```
