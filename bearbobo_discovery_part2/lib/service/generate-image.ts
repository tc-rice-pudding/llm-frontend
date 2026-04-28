export async function generateImage(prompt: string): Promise<{ error: string, url: string }> {
    const endpoint = process.env.VITE_FLUX_END_POINT;
    const modelName = process.env.VITE_FLUX_MODEL_NAME;

    const payload = {
        prompt,
        width: 1024,
        height: 1024,
        steps: 40,
        prompt_upsampling: true,
        seed: 42,
        guidance: 3,
        sampler: 'dpmpp_2m',
        safety_tolerance: 2,
    };

    const headers: any = {
        'Content-Type': 'application/json',
        'x-key': process.env.VITE_FLUX_API_KEY,
    };

    const res = await fetch(`${endpoint}/${modelName}`, {
        headers,
        method: 'POST',
        body: JSON.stringify(payload),
    });
    const id = (await res.json()).id;
    const resultUrl = `${endpoint}/get_result?id=${id}`;

    do {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const result = await fetch(resultUrl);
        const resultJson = await result.json();
        if (resultJson.status === 'Pending') {
            continue;
        }
        const sample = resultJson.result?.sample;
        if (sample) {
            return {
                error: '',
                url: sample,
            }
        } else {
            console.log(resultJson);
            return {
                error: 'No result',
                url: 'https://res.bearbobo.com/resource/upload/vNg4ALJv/6659895-ox36cbkajrr.png',
            }
        }
    } while (1);
    return { error: '', url: '' };
}