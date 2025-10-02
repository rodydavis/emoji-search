import { connectFirestoreEmulator, collection, vector, doc, setDoc, getDocs, VectorValue, query, where, limit, addDoc, getFirestore, QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import type { EmojiResult } from "./emojis";
import { initializeApp } from "firebase/app";

const app = initializeApp({
    projectId: 'demo-no-project'
});
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 3131);


const emojisRef = collection(db, 'emojis');

export async function addEmoji(emoji: EmojiResult, embedding?: Float32Array) {
    const q = query(emojisRef, where("emoji", "==", emoji.emoji), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const existing = querySnapshot.docs[0];
        const docRef = doc(db, 'emojis', existing.id);
        await setDoc(docRef, {
            ...emoji,
            ...(embedding && { embedding: vector(Array.from(embedding)), }),
        });
    } else {
        await addDoc(emojisRef, {
            ...emoji,
            ...(embedding && { embedding: vector(Array.from(embedding)), }),
        });
    }

}

function convertEmoji(e: QueryDocumentSnapshot<DocumentData, DocumentData>): EmojiResult & { embedding?: number[] } {
    const data = e.data();
    return {
        type: data.type as string,
        emoji: data.emoji as string,
        description: data.description as string,
        embedding: (data.embedding as VectorValue || undefined)?.toArray(),
    };
}

export async function getEmoji(emoji: string) {
    const q = query(emojisRef, where("emoji", "==", emoji), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const existing = querySnapshot.docs[0];
        return convertEmoji(existing);
    }
    return null;
}

export async function getEmojis() {
    const docs = await getDocs(emojisRef);
    return docs.docs.map(convertEmoji);
}