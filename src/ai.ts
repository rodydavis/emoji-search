import { FeatureExtractionPipeline, pipeline, Tensor, type DataArray } from "@huggingface/transformers";

export const embeddingGemma = "onnx-community/embeddinggemma-300m-ONNX";

export async function getEmbedder(model_id: string) {
    const embedder = await pipeline('feature-extraction', model_id);
    return embedder;
}

export async function encode(embedder: FeatureExtractionPipeline, title: string, text: string) {
    const res = await embedder(`title: ${title} | text: ${text}`, {
        pooling: 'mean',
        normalize: true,
    });
    const embeddings = res.data;
    return embeddings;
}

export async function encodeAll(embedder: FeatureExtractionPipeline, title: string, text: string[]) {
    const res = await embedder(text.map(e => `title: ${title} | text: ${e}`), {
        pooling: 'mean',
        normalize: true,
    });
    const results: DataArray[] = [];
    const arr = Array.from(res) as Array<Tensor>;
    for (let i = 0; i < arr.length; i++) {
        const el = arr[i];
        results.push(el.data);
    }
    return results;
}

const TaskType = {
    none: 'none',
    searchResult: 'search result',
} as const;

export async function encodeDocument(embedder: FeatureExtractionPipeline, text: string) {
    return await encode(embedder, TaskType.none, text);
}

export async function encodeDocuments(embedder: FeatureExtractionPipeline, text: string[]) {
    return await encodeAll(embedder, TaskType.none, text);
}

export async function encodeQuery(embedder: FeatureExtractionPipeline, text: string) {
    return await encode(embedder, TaskType.searchResult, text);
}

export async function encodeQuerys(embedder: FeatureExtractionPipeline, text: string[]) {
    return await encodeAll(embedder, TaskType.searchResult, text);
}