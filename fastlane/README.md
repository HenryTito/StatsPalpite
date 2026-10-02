# Build e assinatura automatizados (RNF09)

## Requisitos

- Ruby 3.0+ e Bundler (`gem install bundler`)
- JDK 17+ — o do Android Studio serve: `export JAVA_HOME=$HOME/android-studio/jbr`
- Android SDK em `ANDROID_HOME`

```bash
bundle install
```

## Ambientes de assinatura

As lanes de release leem quatro variáveis. Guarde-as fora do repositório,
num `.env` local ou nos segredos do CI:

```bash
export ANDROID_KEYSTORE_PATH=$HOME/chaves/statspalpite-release.keystore
export ANDROID_KEYSTORE_PASSWORD=...
export ANDROID_KEY_ALIAS=statspalpite
export ANDROID_KEY_PASSWORD=...
```

Na primeira vez, crie o keystore:

```bash
bundle exec fastlane android create_keystore
```

**O keystore não pode ser perdido nem versionado.** Sem ele, não é possível
publicar atualização do app na Play Store — a loja exige que toda versão seja
assinada com a mesma chave.

## Lanes

| Lane | O que faz |
|---|---|
| `verify` | type-check, lint e testes |
| `prebuild` | gera `android/` a partir do `app.json` |
| `build_test` | APK de teste assinado com a chave de debug |
| `build_release` | APK de produção assinado com a chave de release |
| `bundle_release` | AAB de produção, formato da Play Store |
| `create_keystore` | cria a chave de release |

```bash
bundle exec fastlane android build_test
bundle exec fastlane android build_release
```

Toda lane de build roda `verify` antes: um APK não sai de código que não
compila, não passa no lint ou quebra um teste.

## Por que `prebuild` em toda lane

A pasta `android/` está no `.gitignore` — o projeto usa geração nativa do
Expo. Isso evita conflito entre o que está no `app.json` e o que está no
`AndroidManifest.xml`, ao custo de regenerar os arquivos a cada build. O
`--no-install` pula o `npm install`, que o `verify` já garantiu.
