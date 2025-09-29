/**
 * Parses the content of an emoji-sequences.txt file into a structured JSON array.
 *
 * @param {string} fileContent The string content of the .txt file.
 * @returns {Array<EmojiResult>} An array of objects, each representing an emoji or a range of emojis.
 */
function parseEmojiFile(fileContent: string): Array<EmojiResult> {
    const lines = fileContent.split('\n');
    const emojis: EmojiResult[] = [];

    for (const line of lines) {
        // 1. Ignore comments and empty lines
        if (line.startsWith('#') || line.trim() === '') {
            continue;
        }

        // 2. Remove comments from the end of the line
        const lineWithoutComment = line.split('#')[0];

        // 3. Split the line into its main components by the semicolon
        const parts = lineWithoutComment.split(';').map(p => p.trim());

        if (parts.length < 3) {
            continue; // Skip malformed lines
        }

        const [codePointsStr, type, description] = parts;

        const entry: EmojiResult = {
            type: type,
            description: description,
            emoji: '',
        };

        // 4. Handle code points, checking for ranges vs. single/sequence
        if (codePointsStr.includes('..')) {
            const [start, end] = codePointsStr.split('..');
            entry.code_point_range = { start, end };
        } else {
            // Splits by space for sequences, works for single points too
            entry.code_points = codePointsStr.split(/\s+/).filter(Boolean);
        }

        emojis.push(entry);
    }

    return emojis.flatMap(item => {
        // Case 1: Handle single emojis and ZWJ sequences
        if (item.code_points) {
            const codePoints = item.code_points.map(hex => parseInt(hex, 16));
            return [{ // flatMap expects an array to be returned
                ...item,
                emoji: String.fromCodePoint(...codePoints)
            }];
        }

        // Case 2: Handle and expand ranges
        if (item.code_point_range) {
            const start = parseInt(item.code_point_range.start, 16);
            const end = parseInt(item.code_point_range.end, 16);
            const expanded = [];

            for (let i = start; i <= end; i++) {
                expanded.push({
                    type: item.type,
                    // We'll reuse the original range description for each expanded emoji
                    description: item.description,
                    code_points: [i.toString(16).toUpperCase()], // Store the individual code point
                    emoji: String.fromCodePoint(i) // Render the specific emoji
                });
            }
            return expanded; // Return the array of new emoji objects
        }

        // If the item is neither, filter it out
        return [];
    });
}

export interface EmojiResult {
    type: string;
    emoji: string;
    description: string;
    code_point_range?: {
        start: string,
        end: string,
    };
    code_points?: string[];
}

function getFileUrls(version: string) {
    const baseUrl = 'https://www.unicode.org/Public/emoji';
    let prefix = `${baseUrl}/${version}`;
    prefix = new URL('../third_party/unicode', import.meta.url).toString();
    return [
        `${prefix}/emoji-sequences.txt`,
        `${prefix}/emoji-zwj-sequences.txt`,
    ];
}

export async function getAllEmojis(version = 'latest'): Promise<Array<EmojiResult>> {
    const results: EmojiResult[] = [];
    for (const url of getFileUrls(version)) {
        const res = await fetch(url);
        if (res.status === 200) {
            const body = await res.text();
            const emojis = parseEmojiFile(body);
            results.push(...emojis);
        }
    }
    return results;
}