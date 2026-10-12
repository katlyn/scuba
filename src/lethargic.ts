import translate, { languages } from "google-translate-api-x"
import { messageDb } from "./databases"

function interlace<T>(...parts: T[][]): T[] {
    function* _interlace (parts: T[][]) {
        let idx = 0
        const maxLength = Math.max(...parts.map(s => s.length))
        for (let idx = 0; idx < maxLength; idx++) {
            for (const part of parts) {
                if (idx < part.length) {
                    yield part[idx]
                } else {
                    continue
                }
            }
        }
    }
    return Array.from(_interlace(parts))
}

async function randomTranslate(input: string, inputLang: languages, targetLang: languages, iterations: number): Promise<string> {
    if (iterations <= 0) {
        return input
    }
    if (iterations == 1) {
        if (inputLang === targetLang) {
            return input
        }
        const response = await translate(input, {from: inputLang, to: targetLang})
        return response.text
    }
    const languageOpts = Object.keys(languages).filter(lang => !["auto", inputLang, targetLang].includes(lang))
    const randomLang = languageOpts[Math.floor(Math.random() * languageOpts.length)]
    const response = await translate(input, { from: inputLang, to: randomLang })
    return await randomTranslate(response.text, randomLang as languages, targetLang, iterations - 1)
}

export async function lethargy (inputParts: string[]): Promise<string> {
    const messages: string[][] = []
    for await (const [, value] of messageDb.iterator()) {
        const messageParts = value.split(/\s+/)
        if (messageParts.length >= inputParts.length) {
            messages.push(messageParts)
        }
    }

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]

    const interlaced = interlace(inputParts, randomMessage).join(" ")
    return randomTranslate(interlaced, languages.en, languages.en, 10)
}
