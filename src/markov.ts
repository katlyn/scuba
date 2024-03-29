function shuffleArray<T>(array: Array<T>) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
      array[j] = temp;
  }
}

export default class Markov {
  words = new Map<string, Array<string|null>>()
  constructor () {}

  seed (text: string) {
    const words = text.split(/\s+/)
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const wordFollow = words[i + 1] || null
      if (this.words.has(word)) {
        this.words.get(word)!.push(wordFollow)
      } else {
        this.words.set(word, [wordFollow])
      }
    }
  }

  respond (prompt: string): string[] {
    const seeds = prompt.split(/\s+/)
    shuffleArray(seeds)
    for (const seed of seeds) {
      if (this.words.has(seed)) {
        let lastResult = seed
        let generated: string[] = []
        while (true) {
          generated.push(lastResult)
          const options = this.words.get(lastResult)
          // @ts-ignore
          lastResult = options[Math.floor(Math.random() * options.length)]
          if (lastResult === null) {
            return generated
          }
        }
      }
    }
    const keys = Array.from(this.words.keys())
    const rand = keys[Math.floor(Math.random() * keys.length)]
    return this.respond(rand)
  }
}
