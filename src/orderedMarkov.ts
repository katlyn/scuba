import ArrayKeyedMap from "array-keyed-map";

/**
 * Shuffles the values of an array in-place
 */
function shuffleArray<T>(array: Array<T>) {
  for (let index = array.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = array[index];
    array[index] = array[swapIndex];
    array[swapIndex] = temp;
  }
}

export default class OrderedMarkov {
  order: number
  dictionary = new ArrayKeyedMap<string[], Array<null|string>>()

  constructor (order: number) {
    this.order = order
  }

  addToDictionary (key: string[], value: string|null) {
    if (this.dictionary.has(key)) {
      this.dictionary.get(key)!.push(value)
    } else {
      this.dictionary.set(key, [value])
    }
  }

  seed (text: string) {
    const words = text.split(/\s+/)
    for (let index = 0; index < words.length - this.order + 1; ++index) {
      const key = words.slice(Math.max(index, 0), index + this.order)
      const followingWord = words[index + this.order] ?? null
      this.addToDictionary(key, followingWord)
    }
  }

  randomKey () {
    const keys = Array.from(this.dictionary.keys())
    return keys[Math.floor(Math.random() * keys.length)]
  }

  bestMatchKey (words: string[]): string[] {
    if (words.length === 0) {
      return this.randomKey()
    }
    const keys = [...this.dictionary.keys()]
    const matchKey = keys.find(key => words.every((val, idx) => val === key[idx]))
    return matchKey ?? this.bestMatchKey(words.slice(0, -1))
  }

  respond (prompt: string): string[] {
    let seedWords = prompt.split(/\s+/)
    if (seedWords.length < this.order) {
      // If there's less seed words than the order of the markov chain, attempt to find the best match key
      seedWords = this.bestMatchKey(seedWords)
    }

    const seedPhrases: string[][] = []
    for (let index = 0; index <= seedWords.length - this.order; ++index) {
      seedPhrases.push(seedWords.slice(index, index + this.order))
    }
    shuffleArray(seedPhrases)

    for (const seed of seedPhrases) {
      if (!this.dictionary.has(seed)) {
        continue
      }

      let generated: string[] = seed
      while (true) {
        const search = generated.slice(-this.order)
        const options = this.dictionary.get(search)
        if (options === undefined) {
          return generated
        }
        const selected = options[Math.floor(Math.random() * options.length)]
        if (selected === null) {
          return generated
        }
        generated.push(selected)
      }
    }

    // Select a random seed if the prompt text doesn't include anything
    return this.respond(this.randomKey().join(" "))
  }
}
