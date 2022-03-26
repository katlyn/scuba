declare module 'markov' {

  interface Hash {
    key: string
    word: string
  }

  interface Markov {
    seed: (data: string | EventEmitter, cb?: () => unknown) => void,
    search: (text: string) => string | undefined
    pick: () => string
    next: (key: string) => Hash
    prev: (key: string) => Hash
    forward: (key: string, limit?: number) => string[]
    backward: (key: string, limit?: number) => string[]
    fill: (key: string, limit?: number) => string[]
    respond: (text: string, limit?: number) => string[]
  }

  function markov(order?: int): Markov
  export default markov
}
