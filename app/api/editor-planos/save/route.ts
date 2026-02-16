export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Parse Body
    const { id, name, walls, doors, windows, rooms, projectId, variant, image, bgConfig, bgImage, gridRotation, calibration, shunts } = await request.json()

    // Handle Image Upload if base64 provided (Thumbnail)
    let imageUrl = null;
    if (image && image.startsWith("data:image")) {
      try {
        const base64Data = image.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `floor-plans/${session.user.id}/${Date.now()}-${crypto.randomUUID()}.png`;

        const { error: uploadError } = await supabase.storage
          .from("planos-reconocidos")
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error("Error uploading thumbnail:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("planos-reconocidos")
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      } catch (e) {
        console.error("Exception handling image:", e);
      }
    }

    // Handle Background Image Upload if base64 provided
    let finalBgConfig = bgConfig || {};
    if (bgImage && bgImage.startsWith("data:")) {
      try {
        const mimeType = bgImage.substring(bgImage.indexOf(":") + 1, bgImage.indexOf(";"));
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

        if (!allowedTypes.includes(mimeType)) {
          console.error("Invalid file type for background:", mimeType);
        } else {
          // Check size (5MB limit)
          // Base64 size is approx 1.33 * actual size. 5MB * 1.33 = ~6.65MB
          const base64Length = bgImage.length;
          const sizeInBytes = (base64Length * 3) / 4;
          const MAX_SIZE = 5 * 1024 * 1024; // 5MB

          if (sizeInBytes > MAX_SIZE) {
            console.error("Background file too large:", sizeInBytes);
          } else {
            const base64Data = bgImage.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const fileExt = mimeType.split("/")[1];
            const fileName = `${session.user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from("plano-background")
              .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: false
              });

            if (uploadError) {
              console.error("Error uploading background file:", uploadError);
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from("plano-background")
                .getPublicUrl(fileName);
              finalBgConfig.url = publicUrl;
            }
          }
        }
      } catch (e) {
        console.error("Exception handling background file:", e);
      }
    }

    // Prepare data payload
    const planData = {
      name: name || "Nuevo Plano",
      data: {
        walls,
        doors,
        windows,
        rooms,
        bgConfig: finalBgConfig,
        gridRotation,
        calibration,
        shunts
      },
      updated_at: new Date().toISOString(),
      // Only update image if a new one was uploaded
      ...(imageUrl ? { image_url: imageUrl } : {}),
      // Update variant if provided
      ...(variant ? { variant } : {})
    }

    let resultData;
    let resultError;

    if (id) {
      // UPDATE EXISTING PLAN
      // RLS will ensure user owns it or has access via project
      const { data, error } = await supabase
        .from("project_floor_plans")
        .update(planData)
        .eq("id", id)
        .select()
        .single()

      resultData = data;
      resultError = error;
    } else {
      // CREATE NEW STANDALONE PLAN
      const { data, error } = await supabase
        .from("project_floor_plans")
        .insert({
          ...planData,
          user_id: session.user.id,
          project_id: projectId || null, // Optional link
          image_url: imageUrl || "https://placehold.co/600x400/orange/white?text=Plano" // Default image for new plans
        })
        .select()
        .single()

      resultData = data;
      resultError = error;
    }

    if (resultError) {
      console.error("Error saving plan:", resultError)
      return NextResponse.json({
        error: "Error al guardar plano",
        details: resultError.message,
        hint: resultError.hint
      }, { status: 500 })
    }

    return NextResponse.json({ id: resultData.id })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error al guardar plano" }, { status: 500 })
  }
}

