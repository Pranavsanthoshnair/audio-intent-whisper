 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { audio, fileName, mimeType } = await req.json();
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     if (!audio) {
       throw new Error("No audio data provided");
     }
 
     console.log(`Processing audio file: ${fileName}, type: ${mimeType}`);
 
     // Use Gemini for multimodal audio analysis
     // Gemini can process audio and provide transcription + analysis in one call
     const systemPrompt = `You are an expert multilingual audio analyst specializing in threat detection and intent analysis.
 
 Your task is to:
 1. Transcribe the audio content accurately
 2. Detect the language being spoken (with special focus on Kashmiri, Urdu, Hindi, Arabic, and other regional languages)
 3. Translate the content to English
 4. Analyze the contextual meaning for potentially threatening or suspicious intent
 
 IMPORTANT ANALYSIS GUIDELINES:
 - Do NOT rely on single keywords alone
 - Analyze the FULL CONTEXT of what is being said
 - Consider cultural nuances and common expressions
 - Look for patterns like: repeated threats, explicit violence references, coordinated harmful activities
 - Be careful not to flag normal religious expressions, political opinions, or cultural discussions as threats
 - Only flag content as high risk if there is CLEAR and EXPLICIT threatening intent
 
 RISK LEVEL CRITERIA:
 - LOW: Normal conversation, cultural/religious discussion, no concerning content
 - MEDIUM: Ambiguous language that could be concerning in certain contexts, requires human review
 - HIGH: Explicit threats, coordination of harmful activities, clear violent intent
 
 Respond in JSON format with these exact fields:
 {
   "originalText": "the original transcription in the original language",
   "detectedLanguage": "the detected language name",
   "englishTranslation": "English translation of the content",
   "riskLevel": "low" | "medium" | "high",
   "confidenceScore": 0.0-1.0,
   "analysisDetails": "detailed explanation of the analysis including why this risk level was assigned"
 }
 
 If you cannot hear or understand the audio clearly, set confidenceScore below 0.5 and explain in analysisDetails.`;
 
     // Prepare the audio for Gemini
     const mediaType = mimeType || "audio/webm";
     
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-2.5-pro",
         messages: [
           { role: "system", content: systemPrompt },
           { 
             role: "user", 
             content: [
               {
                 type: "text",
                 text: "Please analyze this audio file for threat detection. Provide complete transcription, translation, and risk assessment."
               },
               {
                 type: "image_url",
                 image_url: {
                   url: `data:${mediaType};base64,${audio}`
                 }
               }
             ]
           }
         ],
         max_tokens: 2000,
       }),
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("AI Gateway error:", response.status, errorText);
       
       if (response.status === 429) {
         return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
           status: 429,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       if (response.status === 402) {
         return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
           status: 402,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       
       throw new Error(`AI analysis failed: ${response.status}`);
     }
 
     const aiResponse = await response.json();
     console.log("AI Response received");
 
     const content = aiResponse.choices?.[0]?.message?.content || "";
     
     // Parse the JSON response from the AI
     let analysisResult;
     try {
       // Try to extract JSON from the response
       const jsonMatch = content.match(/\{[\s\S]*\}/);
       if (jsonMatch) {
         analysisResult = JSON.parse(jsonMatch[0]);
       } else {
         throw new Error("No JSON found in response");
       }
     } catch (parseError) {
       console.error("Failed to parse AI response:", parseError);
       // Return a fallback response
       analysisResult = {
         originalText: "Unable to transcribe",
         detectedLanguage: "Unknown",
         englishTranslation: "Unable to translate",
         riskLevel: "low",
         confidenceScore: 0.1,
         analysisDetails: `AI response could not be parsed. Raw response: ${content.substring(0, 500)}`
       };
     }
 
     console.log(`Analysis complete. Risk level: ${analysisResult.riskLevel}`);
 
     return new Response(JSON.stringify(analysisResult), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
 
   } catch (error) {
     console.error("Analysis error:", error);
     return new Response(
       JSON.stringify({ 
         error: error instanceof Error ? error.message : "Unknown error occurred" 
       }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });