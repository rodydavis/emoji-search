export function sleep(duration: number) {
    return new Promise((resolve) => setTimeout(resolve, duration));
}

export function createBatches<T>(array: T[], batchSize = 10) {
    return array.reduce<T[][]>((accumulator, currentValue, index) => {
        const batchIndex = Math.floor(index / batchSize);

        if (!accumulator[batchIndex]) {
            accumulator[batchIndex] = [];
        }

        accumulator[batchIndex].push(currentValue);
        return accumulator;
    }, []);
}
