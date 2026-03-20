import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeImage(imagePath, prompt) {
  const zai = await ZAI.create();
  
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });
  
  return response.choices[0]?.message?.content;
}

async function main() {
  const prompt = "Descreva esta imagem de forma detalhada em português. É uma tela de computador? O que está sendo exibido? Liste todos os textos, botões, abas e elementos visíveis.";
  
  console.log("=== IMAGEM 1 ===");
  const result1 = await analyzeImage('/home/z/my-project/upload/pasted_image_1773872744055.png', prompt);
  console.log(result1);
  
  console.log("\n=== IMAGEM 2 ===");
  const result2 = await analyzeImage('/home/z/my-project/upload/pasted_image_1773872761980.png', prompt);
  console.log(result2);
}

main().catch(console.error);
