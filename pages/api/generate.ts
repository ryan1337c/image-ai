import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

import { supabaseServerClient } from "./supaBaseServer";

type ResponseData = {
    url?: string;
    error?: string;
}

interface GenerateRequest extends NextApiRequest {
    body: {
        prompt: string;
        n: number;
        size: string;
    }
}

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export default async function handler(
    req: GenerateRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const promptString = req.body.prompt;
    if (!promptString) {
      return res.status(400).json({ error: "You need a prompt" });
    }

    try{
    const aiResponse = await openai.images.generate({
        prompt: promptString,
        n:1,
        size:"1024x1024",
        model: "dall-e-3"
    });

    if (!aiResponse.data || aiResponse.data.length === 0) {
      return res.status(500).json({ error: "No images generated" });
    }
    let imageUrl = aiResponse.data[0].url;

    if (!imageUrl || typeof imageUrl !== "string") {
        return res.status(500).json({ error: "Invalid or missing image URL from OpenAI" });
    }

    // // Fetch the image and convert into buffer
    // const imageResponse = await fetch(imageUrl);
    // if (!imageResponse.ok) {
    // throw new Error(`Failed to fetch image from OpenAI: ${imageResponse.statusText}`);
    // }
    
    // const arrayBuffer = await imageResponse.arrayBuffer();
    // const buffer = Buffer.from(arrayBuffer);

    // // Upload to supabase storage
    // const fileName = `dalle/${Date.now()}.png`;
    // const { data, error: uploadError } = await supabaseServerClient.storage
    // .from('images') 
    // .upload(fileName, buffer, {
    //     contentType: "image/png",
    // });

    // if (uploadError) {
    //     console.error("Upload error", uploadError);
    //     return res.status(500).json({ error: "Failed to upload iamge to supabase"})
    // }

    // const { data: dataUrl } = supabaseServerClient
    // .storage
    // .from("images")
    // .getPublicUrl(fileName);

    // const publicUrl = dataUrl.publicUrl;
    // console.log("Public image url", publicUrl);

    // return res.status(200).json({ url:  publicUrl });
    return res.status(200).json({ url:  imageUrl})
}
catch (error: any) {

    if (error.status === 400)
        return res.status(400).json({error: "Bad Request cooked"})
    else 
        return res.status(error.status).json({error: "OpenAI server issue"})
}
}